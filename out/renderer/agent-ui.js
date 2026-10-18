'use strict';
const api = window.petApi;
const $ = id => document.getElementById(id);
let state = { tasks: [], runs: [] };
let busy = false;
const names = { create_task: '添加待办', create_plan: '创建行动计划', complete_task: '完成待办', update_task: '更新待办', save_note: '保存备忘', search_notes: '搜索备忘', start_focus: '开始专注', daily_overview: '今日总览', list_tasks: '查看待办', read_memory: '读取长期记忆', get_weather: '查询天气' };
function el(tag, cls, text) { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; }
function render() {
  $('pending').textContent = state.tasks.filter(t => !t.done).length;
  $('done').textContent = state.tasks.filter(t => t.done).length;
  $('runs').textContent = state.runs.length;
  const filter = $('filter').value;
  const tasks = state.tasks.filter(t => filter === 'all' || t.done === (filter === 'done'));
  $('tasks').replaceChildren();
  for (const task of tasks) {
    const row = el('div', 'task');
    const check = el('input'); check.type = 'checkbox'; check.checked = task.done; check.setAttribute('aria-label', '完成 ' + task.title);
    check.onchange = () => act(() => api.agentUpdate(task.id, 'toggle'));
    const content = el('div', 'content'); content.append(el('div', 'title' + (task.done ? ' complete' : ''), task.title));
    if (task.goal) content.append(el('small', '', task.goal));
    row.append(check, content);
    if (!task.done) { const focus = el('button', '', '专注25分'); focus.onclick = () => act(async () => { await api.agentExecute('start_focus', { title: task.title, minutes: 25 }); $('reply').textContent = '专注已开始：' + task.title; }); row.append(focus); }
    const remove = el('button', 'delete', '删除'); remove.setAttribute('aria-label', '删除 ' + task.title); remove.onclick = () => act(() => api.agentUpdate(task.id, 'delete')); row.append(remove);
    $('tasks').append(row);
  }
  if (!tasks.length) $('tasks').append(el('div', 'empty', filter === 'done' ? '完成的事情会收在这里。' : '先写下一件小事，就从这里开始。'));
  $('logs').replaceChildren();
  for (const run of state.runs.slice(0, 20)) {
    const row = el('div', 'log'); row.append(el('span', 'dot' + (run.status === 'error' ? ' error' : ''), run.status === 'error' ? '!' : '✓'));
    const detail = el('div', '', names[run.name] || run.name);
    detail.append(el('small', '', run.status === 'error' ? run.result.message : run.args.title || run.args.goal || run.args.content || run.args.keyword || (run.status === 'success' ? '已完成' : run.status)));
    row.append(detail, el('time', '', new Date(run.at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))); $('logs').append(row);
  }
  if (!state.runs.length) $('logs').append(el('div', 'empty', '每一次实际操作，都会在这里留下记录。'));
}
async function refresh() { state = await api.agentState(); render(); }
async function act(fn) {
  if (busy) return; busy = true;
  document.querySelectorAll('button,input,textarea,select').forEach(n => n.disabled = true);
  try { await fn(); } catch (error) { $('reply').textContent = '暂未完成：' + error.message; }
  finally { try { await refresh(); } catch (error) { $('reply').textContent = error.message; } busy = false; document.querySelectorAll('button,input,textarea,select').forEach(n => n.disabled = false); }
}
$('filter').onchange = render;
$('refresh').onclick = () => act(async () => {});
$('add-form').onsubmit = e => { e.preventDefault(); act(async () => { await api.agentExecute('create_task', { title: $('task-title').value }); $('task-title').value = ''; $('reply').textContent = '待办已经记下了。'; }); };
$('plan-form').onsubmit = e => { e.preventDefault(); act(async () => { await api.agentExecute('create_plan', { goal: $('goal').value, steps: $('steps').value.split('\n').map(s => s.trim()).filter(Boolean) }); $('goal').value = ''; $('steps').value = ''; $('reply').textContent = '行动计划已保存，逐步完成就好。'; }); };
$('ask-form').onsubmit = e => { e.preventDefault(); const prompt = $('request').value.trim(); if (!prompt) return; act(async () => { $('reply').textContent = '正在理解并处理，请稍等…'; const result = await api.agentAsk(prompt); $('reply').textContent = result.content; }); };
document.querySelectorAll('[data-prompt]').forEach(button => button.onclick = () => { $('request').value = button.dataset.prompt; $('request').focus(); });
if (api?.agentState) refresh().catch(error => { $('reply').textContent = error.message; });
else $('reply').textContent = '请从栖伴桌宠的“任务中心”打开此页面。';
window.addEventListener('focus', () => { if (!busy && api?.agentState) refresh().catch(() => {}); });
