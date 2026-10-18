'use strict';
const api = window.petApi;
const $ = id => document.getElementById(id);
async function action(fn) { try { await fn(); } catch (error) { $('message').textContent = error.message; } }
$('settings').onclick = () => api.openPanelTab('settings');
$('tasks').onclick = () => api.openAgent();
$('finish').onclick = () => action(() => api.finishWelcome());
$('logs').onclick = () => action(() => api.openLogs());
Promise.all([api.getChatMode(), api.getLlmConfig()]).then(([mode, config]) => {
  $('chat-status').textContent = mode === 'local' ? '对话：本地模式，可先使用离线指令。' : `对话：${config.model}。若尚未启动模型服务，请到设置中配置，或先切换本地模式。`;
}).catch(() => { $('chat-status').textContent = '暂时无法读取设置，请打开设置检查。'; });
api.checkTtsService().then(result => {
  $('voice-status').textContent = result.ok ? '语音：服务已就绪，可在设置 → 语音中试听。' : '语音：尚未就绪，可先使用文字；模型首次加载可能需要几十秒。';
}).catch(() => { $('voice-status').textContent = '语音：暂未连接，可先使用文字。'; });
