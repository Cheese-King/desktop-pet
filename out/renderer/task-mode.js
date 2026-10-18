'use strict';
// Task mode: text-only task chat. Voice playback belongs to the companion chat, not here.
const api = window.petApi, $ = id => document.getElementById(id);
let state = { tasks: [], runs: [] }, selected = null, busy = false, confirming = null, filter = 'pending', pendingText = null;
const current = () => state.tasks.find(t => t.id === selected);
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
const statusNames = { pending: '等待确认', sending: '正在发送', sent: '已发送', uncertain: '发送结果待核实' };
const toolNames = { list_files: '查看任务文件', read_file: '读取文件', write_document: '保存成果', prepare_email: '准备邮件', create_plan: '拆解计划', create_task: '添加待办', start_focus: '开始专注', update_task: '更新任务' };
const ago = at => { const s = (Date.now() - at) / 1000; if (s < 60) return '刚刚'; if (s < 3600) return Math.floor(s / 60) + ' 分钟前'; if (s < 86400) return Math.floor(s / 3600) + ' 小时前'; return new Date(at).toLocaleDateString(); };
const ext = name => (name.split('.').pop() || '').slice(0, 4).toUpperCase();

function controls() {
  const has = !!current();
  document.querySelectorAll('.sidebar button, .sidebar input, .chips button').forEach(n => n.disabled = busy);
  for (const id of ['import', 'import-side', 'toggle-task', 'delete-task']) $(id).disabled = busy || !has;
  $('request').disabled = busy || !has;
  $('send').disabled = busy || !has;
}
function renderTasks() {
  const pending = state.tasks.filter(t => !t.done).length;
  $('count-pending').textContent = pending || ''; $('count-done').textContent = (state.tasks.length - pending) || '';
  document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.filter === filter)));
  const list = state.tasks.filter(t => filter === 'all' || t.done === (filter === 'done'))
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  $('tasks').replaceChildren();
  for (const t of list) {
    const row = el('div', 'task' + (t.id === selected ? ' selected' : '') + (t.done ? ' done' : ''));
    const check = el('input'); check.type = 'checkbox'; check.checked = t.done; check.disabled = busy; check.setAttribute('aria-label', (t.done ? '重新打开 ' : '完成 ') + t.title);
    check.onchange = () => act(() => api.agentUpdate(t.id, 'toggle'));
    const body = el('button', 't-body'); body.append(el('span', 't-title', t.title), el('span', 't-sub', `${(t.messages || []).length} 条对话 · ${(t.files || []).length} 个文件 · ${ago(t.updatedAt || t.createdAt || Date.now())}`));
    body.title = t.title; if (t.id === selected) body.setAttribute('aria-current', 'true');
    body.onclick = () => { selected = t.id; localStorage.setItem('qiban-task', selected); render(); $('request').focus(); };
    row.append(check, body); $('tasks').append(row);
  }
  if (!list.length) $('tasks').append(el('div', 'empty', filter === 'done' ? '还没有已完成的任务。' : '在上方写下任务名称，开始处理第一件事。'));
}
function renderMessages(task) {
  const box = $('messages'); const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  box.replaceChildren();
  if (!task) {
    const w = el('div', 'welcome'); w.append(el('div', 'logo', '栖'), el('h2', '', '从一句想法，到一份成果'), el('p', '', '在左侧新建一项任务，每项任务有独立的对话、文件和成果。'));
    const steps = el('div', 'steps'); [['导入文件', '资料、表格或文档'], ['交代要求', '整理、写作或计划'], ['查看成果', '另存或发到邮箱']].forEach(([b, s]) => { const d = el('div'); d.append(el('b', '', b), document.createTextNode(s)); steps.append(d); });
    w.append(steps); box.append(w); return;
  }
  const messages = task.messages || [];
  if (!messages.length && !pendingText) box.append(el('div', 'empty', '先导入要处理的文件，再告诉我具体要求。\n也可以直接交代写作、整理或计划任务。\n例如：把这份资料整理成一份 Word 报告，然后准备发送到我的邮箱。'));
  const cut = task.summarizedSeq || 0; let noted = false;
  for (const m of messages) {
    if (cut && !noted && m.seq > cut) { box.append(el('div', 'compressed-note', '以上对话已压缩为任务摘要')); noted = true; }
    box.append(messageNode(m.role, m.content, m.role === 'assistant' && m.content.startsWith('本次未完成：')));
  }
  if (pendingText) { box.append(messageNode('user', pendingText)); const t = el('div', 'message assistant typing'); const b = el('div', 'bubble'); b.append(el('i'), el('i'), el('i')); t.append(el('div', 'avatar', '栖'), b); box.append(t); }
  for (const draft of task.drafts || []) {
    const node = el('div', 'draft'); node.append(el('strong', '', '✉ 邮件 · ' + statusNames[draft.status]), el('div', '', draft.subject), el('small', '', '收件人：' + draft.to));
    const open = el('button', draft.status === 'pending' ? 'primary' : 'soft', draft.status === 'pending' ? '查看并确认发送' : '查看邮件'); open.onclick = () => showDraft(task.id, draft); node.append(open); box.append(node);
  }
  if (nearBottom || pendingText) box.scrollTop = box.scrollHeight;
}
function messageNode(role, content, error) {
  const node = el('div', 'message ' + role + (error ? ' error' : ''));
  const bubble = el('div', 'bubble', content);
  if (role === 'assistant') {
    const wrap = el('div'); wrap.style.minWidth = '0'; wrap.append(bubble);
    const copy = el('button', 'soft copy', '复制'); copy.onclick = () => navigator.clipboard.writeText(content).then(() => { copy.textContent = '已复制'; setTimeout(() => copy.textContent = '复制', 1200); });
    wrap.append(copy); node.append(el('div', 'avatar', '栖'), wrap);
  } else node.append(bubble);
  return node;
}
function render() {
  const task = current();
  $('current-title').textContent = task?.title || '开始一项新任务';
  $('toggle-task').textContent = task?.done ? '↺ 重新打开' : '✓ 标记完成';
  const pill = $('task-status'); pill.textContent = task ? (task.done ? '已完成' : '进行中') : ''; pill.className = 'pill' + (task?.done ? ' done' : '');
  const live = task ? (task.messages || []).filter(m => !task.summarizedSeq || m.seq > task.summarizedSeq).length : 0;
  $('context-info').textContent = task ? (task.summary ? `上下文：摘要 + 最近 ${live} 条` : `上下文：${live} 条`) : '';
  $('context-info').title = task?.summary ? '任务摘要：\n' + task.summary : '每新增 10 条消息自动压缩一次早期对话';
  renderTasks(); renderMessages(task);
  $('files').replaceChildren();
  for (const file of task?.files || []) {
    const node = el('div', 'file' + (file.kind === 'output' ? ' output' : ''));
    const name = el('div', 'f-name', file.name); name.title = file.name; name.append(el('span', 'f-kind', file.kind === 'output' ? '成果' : '输入'));
    const save = el('button', 'soft', '另存'); save.onclick = () => act(async () => { if (await api.taskExport(task.id, file.id)) $('reply').textContent = '已保存到你选择的位置。'; });
    node.append(el('span', 'f-icon', ext(file.name)), name, save); $('files').append(node);
  }
  $('logs').replaceChildren();
  const runs = state.runs.filter(r => r.taskId === selected).slice(0, 20);
  for (const run of runs) { const n = el('div', 'log' + (run.status === 'error' ? ' error' : ''), (run.status === 'error' ? '✕ ' : '✓ ') + (toolNames[run.name] || '处理任务')); n.title = run.status === 'error' ? run.result?.message || '' : ''; n.append(el('small', '', new Date(run.at).toLocaleTimeString())); $('logs').append(n); }
  if (!runs.length) $('logs').append(el('div', 'empty', '暂无记录'));
  controls();
}
async function refresh() { state = await api.agentState(); if (!current()) selected = state.tasks.find(t => !t.done)?.id || state.tasks[0]?.id || null; render(); }
async function act(fn) {
  if (busy) return; busy = true; controls();
  try { await fn(); } catch (error) { $('reply').textContent = error.message; }
  finally { pendingText = null; try { await refresh(); } catch (error) { $('reply').textContent = error.message; } busy = false; controls(); }
}
$('add-form').onsubmit = e => { e.preventDefault(); act(async () => { const t = await api.agentExecute('create_task', { title: $('task-title').value }); selected = t.id; localStorage.setItem('qiban-task', selected); filter = 'pending'; $('task-title').value = ''; $('reply').textContent = '任务已创建，可以导入文件或直接对话。'; }); };
document.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { filter = b.dataset.filter; renderTasks(); });
$('toggle-task').onclick = () => act(() => api.agentUpdate(selected, 'toggle'));
$('delete-task').onclick = () => { if (confirm('删除此任务及界面中的对话记录？已导出的文件不受影响。')) act(() => api.agentUpdate(selected, 'delete')); };
const importFiles = () => act(async () => { const files = await api.taskImport(selected); if (files.length) $('reply').textContent = '已导入 ' + files.length + ' 个文件，请告诉我处理要求。'; });
$('import').onclick = importFiles; $('import-side').onclick = importFiles;
$('toggle-side').onclick = () => {
  const app = document.querySelector('.app'), narrow = matchMedia('(max-width:860px)').matches;
  const open = narrow ? app.classList.toggle('side-open') : !app.classList.toggle('side-hidden');
  $('toggle-side').setAttribute('aria-expanded', String(open)); if (!narrow) localStorage.setItem('qiban-side', open ? '1' : '0');
};
if (localStorage.getItem('qiban-side') === '0') { document.querySelector('.app').classList.add('side-hidden'); $('toggle-side').setAttribute('aria-expanded', 'false'); }
const grow = () => { const r = $('request'); r.style.height = 'auto'; r.style.height = Math.min(200, r.scrollHeight) + 'px'; };
$('request').oninput = grow;
$('ask-form').onsubmit = e => {
  e.preventDefault(); const text = $('request').value.trim(), taskId = selected; if (!text || !taskId || busy) return;
  act(async () => {
    pendingText = text; $('request').value = ''; grow(); renderMessages(current());
    $('reply').textContent = '正在处理，请稍等…';
    await api.agentAsk({ text, taskId }); $('reply').textContent = '本轮已处理，可以继续补充要求。';
  });
};
$('request').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('ask-form').requestSubmit(); } };
document.querySelectorAll('[data-prompt]').forEach(b => b.onclick = () => { $('request').value = b.dataset.prompt; grow(); $('request').focus(); });
$('settings').onclick = () => api.openPanelTab('settings');
$('mail-settings').onclick = async () => {
  try { const c = await api.getMailConfig(); for (const key of ['recipient', 'user', 'host', 'port']) $('mail-' + key).value = c[key]; $('mail-secure').checked = c.secure; $('mail-password').value = ''; $('mail-status').textContent = c.hasPassword ? '已保存授权码。' : '请填写发件邮箱的 SMTP 授权码。'; $('mail-dialog').showModal(); }
  catch (error) { $('reply').textContent = error.message; }
};
$('close-mail').onclick = () => $('mail-dialog').close();
$('mail-form').onsubmit = async e => { e.preventDefault(); try { await api.setMailConfig({ recipient: $('mail-recipient').value, user: $('mail-user').value, host: $('mail-host').value, port: Number($('mail-port').value), secure: $('mail-secure').checked, password: $('mail-password').value }); $('mail-password').value = ''; $('mail-status').textContent = '设置已保存。处理好成果后，可以要求栖伴准备邮件。'; } catch (error) { $('mail-status').textContent = error.message; } };
function showDraft(taskId, draft) {
  confirming = { taskId, draftId: draft.id }; $('send-recipient').textContent = '收件人：' + draft.to; $('send-subject').textContent = draft.subject; $('send-body').textContent = draft.body;
  const task = state.tasks.find(t => t.id === taskId); $('send-attachments').textContent = '附件：' + (draft.attachments.map(id => task.files.find(f => f.id === id)?.name || '文件已不存在').join('、') || '无');
  $('confirm-send').hidden = draft.status !== 'pending'; $('send-dialog').showModal();
}
$('cancel-send').onclick = () => $('send-dialog').close();
$('confirm-send').onclick = () => { if (!confirming) return; const { taskId, draftId } = confirming; $('send-dialog').close(); act(async () => { $('reply').textContent = '正在发送邮件…'; await api.sendTaskMail(taskId, draftId); $('reply').textContent = '发件服务器已接受邮件，请留意收件箱。'; }); };
window.addEventListener('message', e => { if (e.source !== $('pet-frame').contentWindow) return; if (e.data?.type === 'task-pet-ready') $('pet-status').textContent = '栖伴陪你一起完成'; if (e.data?.type === 'task-pet-error') $('pet-status').textContent = '角色加载失败，请检查模型文件'; });
window.addEventListener('focus', () => { if (!busy) refresh().catch(() => {}); });
selected = localStorage.getItem('qiban-task');
refresh().catch(e => $('reply').textContent = e.message);
setInterval(() => { if (!busy) renderTasks(); }, 60000);
