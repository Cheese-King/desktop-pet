const assert = require('node:assert/strict');
const { createAgent } = require('./out/main/agent');
function fixture(chat = async () => ({ content: 'ok' })) {
  const data = {}; let notes = []; let focus = { active: false };
  const agent = createAgent({
    store: { get: k => structuredClone(data[k]), set: (k, v) => { data[k] = structuredClone(v); } }, chat,
    createNote: (text, opts) => { const note = { id: notes.length + 1, text, ...opts }; notes.push(note); return note; },
    listNotes: keyword => notes.filter(n => !keyword || n.text.includes(keyword)),
    startFocus: (title, minutes) => { focus = { active: true, label: title, minutes }; return { focus }; },
    getCompanionState: () => ({ focus }), pushCompanionUpdate: () => {}, getMemory: () => [], weather: async () => ({ city: 'test' })
  });
  return agent;
}
(async () => {
  const a = fixture();
  const task = await a.execute('create_task', { title: '整理桌面' });
  assert.equal(a.state().tasks.length, 1);
  a.update(task.id, 'toggle'); assert.equal(a.state().tasks[0].done, true);
  await assert.rejects(a.execute('create_plan', { goal: '无效', steps: ['一步', ''] }));
  assert.equal(a.state().tasks.length, 1, 'invalid plan is atomic');
  await a.execute('create_plan', { goal: '准备汇报', steps: ['收集数据', '写提纲', '演练'] });
  assert.equal(a.state().tasks.length, 4);
  await a.execute('start_focus', { title: '收集数据', minutes: 25 });
  await assert.rejects(a.execute('start_focus', { title: '覆盖', minutes: 25 }));
  await assert.rejects(a.execute('save_note', { content: '过期', reminderAt: '2020-01-01T00:00:00Z' }));
  assert.equal(a.offline('添加待办：整理桌面，然后开始专注'), null);
  assert.equal(a.offline('添加待办：整理桌面').name, 'create_task');
  assert.equal((await a.execute('daily_overview')).tasks.length, 3);
  assert(a.state().runs.some(r => r.status === 'error'));
  let round = 0;
  const b = fixture(async messages => {
    if (round++ === 0) return { toolCalls: [{ id: '1', type: 'function', function: { name: 'create_task', arguments: '{"title":"tool task"}' } }] };
    assert.equal(messages.at(-1).role, 'tool');
    return { content: '已添加' };
  });
  assert.equal((await b.run([{ role: 'user', content: '添加任务' }], 'test')).content, '已添加');
  assert.equal(b.state().tasks.length, 1);
  round = 0;
  const c = fixture(async () => {
    if (round++ === 0) return { toolCalls: [{ id: '1', type: 'function', function: { name: 'create_task', arguments: '{"title":"saved before failure"}' } }] };
    throw new Error('network interrupted');
  });
  assert.match((await c.run([], 'test')).content, /已成功执行1项/);
  assert.equal(c.state().tasks.length, 1, 'partial failure must not replay writes');
  let calls = 0;
  const d = fixture(async () => ({ toolCalls: [{ id: String(calls++), type: 'function', function: { name: 'list_tasks', arguments: '{}' } }] }));
  await d.run([], 'test'); assert(calls <= 5, 'tool loop bounded');
  console.log('PASS: persistence, plans, task status, focus guard, reminders, offline routing, tool loop, partial failure, call limits');
})().catch(error => { console.error(error); process.exitCode = 1; });
