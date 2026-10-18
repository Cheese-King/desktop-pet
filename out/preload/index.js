"use strict";
const electron = require("electron");
const petApi = {
  openAgent: () => electron.ipcRenderer.send("pet:agent:open"),
  finishWelcome: () => electron.ipcRenderer.invoke("pet:welcome:finish"),
  openLogs: () => electron.ipcRenderer.invoke("pet:logs:open"),
  agentState: () => electron.ipcRenderer.invoke("pet:agent:state"),
  agentExecute: (name, args) => electron.ipcRenderer.invoke("pet:agent:execute", { name, args }),
  agentUpdate: (id, action) => electron.ipcRenderer.invoke("pet:agent:update", { id, action }),
  agentAsk: (text) => electron.ipcRenderer.invoke("pet:agent:ask", text),
  taskImport: (taskId) => electron.ipcRenderer.invoke("pet:task:import", taskId),
  taskExport: (taskId, fileId) => electron.ipcRenderer.invoke("pet:task:export", { taskId, fileId }),
  getMailConfig: () => electron.ipcRenderer.invoke("pet:mail:get"),
  setMailConfig: (config) => electron.ipcRenderer.invoke("pet:mail:set", config),
  sendTaskMail: (taskId, draftId) => electron.ipcRenderer.invoke("pet:mail:send", { taskId, draftId }),
  startVoice: () => electron.ipcRenderer.invoke("pet:tts:start"),
  dragWindow: (deltaX, deltaY) => electron.ipcRenderer.send("pet:drag", { deltaX, deltaY }),
  getSettings: () => electron.ipcRenderer.invoke("pet:get-settings"),
  setScale: (scale) => electron.ipcRenderer.invoke("pet:set-scale", scale),
  setViewMode: (mode) => electron.ipcRenderer.invoke("pet:set-view-mode", mode),
  toggleViewMode: () => electron.ipcRenderer.invoke("pet:toggle-view-mode"),
  onLockChanged: (cb) => {
    const handler = (_e, locked) => cb(locked);
    electron.ipcRenderer.on("pet:lock-changed", handler);
    return () => electron.ipcRenderer.removeListener("pet:lock-changed", handler);
  },
  onViewModeChanged: (cb) => {
    const handler = (_e, mode) => cb(mode);
    electron.ipcRenderer.on("pet:view-mode-changed", handler);
    return () => electron.ipcRenderer.removeListener("pet:view-mode-changed", handler);
  },
  openPanel: () => electron.ipcRenderer.send("pet:open-panel"),
  openPanelTab: (target) => electron.ipcRenderer.send("pet:open-panel-tab", target),
  closePanel: () => electron.ipcRenderer.send("pet:close-panel"),
  openMotionCapturePanel: () => electron.ipcRenderer.send("pet:open-motion-panel"),
  closeMotionCapturePanel: () => electron.ipcRenderer.send("pet:close-motion-panel"),
  sendFaceParams: (params) => electron.ipcRenderer.send("pet:face-params", params),
  onFaceParams: (cb) => {
    const handler = (_e, params) => cb(params);
    electron.ipcRenderer.on("pet:face-params", handler);
    return () => electron.ipcRenderer.removeListener("pet:face-params", handler);
  },
  openContextMenu: (screenX, screenY) => electron.ipcRenderer.send("pet:open-context-menu", { screenX, screenY }),
  closeContextMenu: () => electron.ipcRenderer.send("pet:close-context-menu"),
  openWeatherPanel: () => electron.ipcRenderer.send("pet:open-weather-panel"),
  closeWeatherPanel: () => electron.ipcRenderer.send("pet:close-weather-panel"),
  sendPanelReply: (payload) => electron.ipcRenderer.send("pet:panel-reply", payload),
  sendPanelFeedback: (text) => electron.ipcRenderer.send("pet:panel-feedback", text),
  sendPanelScaleChange: (scale) => electron.ipcRenderer.send("pet:panel-scale-change", scale),
  hide: () => electron.ipcRenderer.send("pet:hide"),
  quit: () => electron.ipcRenderer.send("pet:quit"),
  toggleLock: () => electron.ipcRenderer.send("pet:toggle-lock"),
  onCursorPosition: (cb) => {
    const handler = (_e, data) => cb(data);
    electron.ipcRenderer.on("cursor-position", handler);
    return () => electron.ipcRenderer.removeListener("cursor-position", handler);
  },
  chat: (messages) => electron.ipcRenderer.invoke("pet:chat", { messages }),
  getHistory: () => electron.ipcRenderer.invoke("pet:get-history"),
  clearHistory: () => electron.ipcRenderer.invoke("pet:clear-history"),
  getLlmConfig: () => electron.ipcRenderer.invoke("pet:get-llm-config"),
  setLlmConfig: (patch) => electron.ipcRenderer.invoke("pet:set-llm-config", patch),
  getTtsConfig: () => electron.ipcRenderer.invoke("pet:tts:get-config"),
  setTtsConfig: (patch) => electron.ipcRenderer.invoke("pet:tts:set-config", patch),
  checkTtsService: () => electron.ipcRenderer.invoke("pet:tts:check"),
  synthesizeSpeech: (text) => electron.ipcRenderer.invoke("pet:tts:synthesize", text),
  previewSpeech: (text) => electron.ipcRenderer.invoke("pet:tts:preview", text),
  stopSpeech: () => electron.ipcRenderer.send("pet:tts:stop"),
  onPanelToggle: (cb) => {
    const handler = (_e, open) => cb(open);
    electron.ipcRenderer.on("panel:toggle", handler);
    return () => electron.ipcRenderer.removeListener("panel:toggle", handler);
  },
  getTime: () => electron.ipcRenderer.invoke("pet:get-time"),
  getWeather: () => electron.ipcRenderer.invoke("pet:get-weather"),
  getWeatherConfig: () => electron.ipcRenderer.invoke("pet:get-weather-config"),
  setWeatherConfig: (patch) => electron.ipcRenderer.invoke("pet:set-weather-config", patch),
  weatherReply: (weather) => electron.ipcRenderer.invoke("pet:weather-reply", { weather }),
  onWeatherUpdate: (cb) => {
    const handler = (_e, weather) => cb(weather);
    electron.ipcRenderer.on("pet:weather-update", handler);
    return () => electron.ipcRenderer.removeListener("pet:weather-update", handler);
  },
  onGreeting: (cb) => {
    const handler = (_e, text) => cb(text);
    electron.ipcRenderer.on("pet:greeting", handler);
    return () => electron.ipcRenderer.removeListener("pet:greeting", handler);
  },
  notesList: (query) => electron.ipcRenderer.invoke("pet:notes:list", query !== void 0 ? { query } : void 0),
  notesCreate: (payload) => electron.ipcRenderer.invoke("pet:notes:create", payload),
  notesUpdate: (id, patch) => electron.ipcRenderer.invoke("pet:notes:update", { id, patch }),
  notesDelete: (id) => electron.ipcRenderer.invoke("pet:notes:delete", { id }),
  notesSearch: (keyword) => electron.ipcRenderer.invoke("pet:notes:search", { keyword }),
  getRoleplayConfig: () => electron.ipcRenderer.invoke("pet:get-roleplay-config"),
  setRoleplayConfig: (patch) => electron.ipcRenderer.invoke("pet:set-roleplay-config", patch),
  onPanelReply: (cb) => {
    const handler = (_e, payload) => cb(payload);
    electron.ipcRenderer.on("pet:panel-reply", handler);
    return () => electron.ipcRenderer.removeListener("pet:panel-reply", handler);
  },
  onPanelFeedback: (cb) => {
    const handler = (_e, text) => cb(text);
    electron.ipcRenderer.on("pet:panel-feedback", handler);
    return () => electron.ipcRenderer.removeListener("pet:panel-feedback", handler);
  },
  onPanelTab: (cb) => {
    const handler = (_e, target) => cb(target);
    electron.ipcRenderer.on("pet:panel-tab", handler);
    return () => electron.ipcRenderer.removeListener("pet:panel-tab", handler);
  },
  onPanelModelChange: (cb) => {
    const handler = (_e, path) => cb(path);
    electron.ipcRenderer.on("pet:panel-model-change", handler);
    return () => electron.ipcRenderer.removeListener("pet:panel-model-change", handler);
  },
  onPanelScaleChange: (cb) => {
    const handler = (_e, scale) => cb(scale);
    electron.ipcRenderer.on("pet:panel-scale-change", handler);
    return () => electron.ipcRenderer.removeListener("pet:panel-scale-change", handler);
  },
  getModelPath: () => electron.ipcRenderer.invoke("pet:get-model-path"),
  getModelProfile: (path) => electron.ipcRenderer.invoke("pet:get-model-profile", path),
  setModelProfile: (path, patch) => electron.ipcRenderer.invoke("pet:set-model-profile", { path, patch }),
  getChatMode: () => electron.ipcRenderer.invoke("pet:get-chat-mode"),
  setChatMode: (mode) => electron.ipcRenderer.invoke("pet:set-chat-mode", mode),
  getPetMode: () => electron.ipcRenderer.invoke("pet:get-pet-mode"),
  setPetMode: (mode) => electron.ipcRenderer.invoke("pet:set-pet-mode", mode),
  onPetModeChanged: (cb) => {
    const handler = (_e, mode) => cb(mode);
    electron.ipcRenderer.on("pet:pet-mode-changed", handler);
    return () => electron.ipcRenderer.removeListener("pet:pet-mode-changed", handler);
  },
  getSelectedCamera: () => electron.ipcRenderer.invoke("pet:get-selected-camera"),
  setSelectedCamera: (deviceId) => electron.ipcRenderer.invoke("pet:set-selected-camera", deviceId),
  getCameraFlipped: (deviceId) => electron.ipcRenderer.invoke("pet:get-camera-flipped", deviceId),
  setCameraFlipped: (deviceId, flipped) => electron.ipcRenderer.invoke("pet:set-camera-flipped", deviceId, flipped),
  onCameraFlippedChanged: (cb) => {
    const handler = (_e, payload) => cb(payload);
    electron.ipcRenderer.on("pet:camera-flipped-changed", handler);
    return () => electron.ipcRenderer.removeListener("pet:camera-flipped-changed", handler);
  },
  onCameraChanged: (cb) => {
    const handler = (_e, deviceId) => cb(deviceId);
    electron.ipcRenderer.on("pet:camera-changed", handler);
    return () => electron.ipcRenderer.removeListener("pet:camera-changed", handler);
  },
  getModelCapabilities: () => electron.ipcRenderer.invoke("pet:get-model-capabilities"),
  broadcastModelCapabilities: (payload) => electron.ipcRenderer.send("pet:broadcast-model-capabilities", payload),
  onModelCapabilities: (cb) => {
    const handler = (_e, payload) => cb(payload);
    electron.ipcRenderer.on("pet:model-capabilities", handler);
    return () => electron.ipcRenderer.removeListener("pet:model-capabilities", handler);
  },
  triggerModelAction: (payload) => electron.ipcRenderer.send("pet:trigger-model-action", payload),
  onTriggerModelAction: (cb) => {
    const handler = (_e, payload) => cb(payload);
    electron.ipcRenderer.on("pet:trigger-model-action", handler);
    return () => electron.ipcRenderer.removeListener("pet:trigger-model-action", handler);
  },
  getMemory: () => electron.ipcRenderer.invoke("pet:get-memory"),
  rememberMemory: (payload) => electron.ipcRenderer.invoke("pet:remember-memory", payload),
  clearMemory: () => electron.ipcRenderer.invoke("pet:clear-memory"),
  getCompanion: () => electron.ipcRenderer.invoke("pet:companion:get"),
  recordMood: (mood, note) => electron.ipcRenderer.invoke("pet:companion:mood", { mood, note }),
  updateMood: (dateKey, mood, note) => electron.ipcRenderer.invoke("pet:companion:update-mood", { dateKey, mood, note }),
  toggleImportantDate: (dateKey, label) => electron.ipcRenderer.invoke("pet:companion:toggle-important", { dateKey, label }),
  updateImportantLabel: (dateKey, label) => electron.ipcRenderer.invoke("pet:companion:update-important-label", { dateKey, label }),
  startFocus: (payload) => electron.ipcRenderer.invoke("pet:companion:focus-start", payload),
  stopFocus: (completed) => electron.ipcRenderer.invoke("pet:companion:focus-stop", { completed }),
  setProactive: (patch) => electron.ipcRenderer.invoke("pet:companion:proactive-set", patch),
  resetRelationship: () => electron.ipcRenderer.invoke("pet:companion:reset-relationship"),
  onCompanionUpdate: (cb) => {
    const handler = (_e, state) => cb(state);
    electron.ipcRenderer.on("pet:companion-update", handler);
    return () => electron.ipcRenderer.removeListener("pet:companion-update", handler);
  },
  interactCompanion: (kind, amount) => electron.ipcRenderer.invoke("pet:companion:interact", { kind, amount }),
  recordMotionMinute: () => electron.ipcRenderer.invoke("pet:companion:motion-minute"),
  claimDailyBonus: () => electron.ipcRenderer.invoke("pet:companion:daily-bonus"),
  onCompanionEvent: (cb) => {
    const handler = (_e, event) => cb(event);
    electron.ipcRenderer.on("pet:companion-event", handler);
    return () => electron.ipcRenderer.removeListener("pet:companion-event", handler);
  }
};
electron.contextBridge.exposeInMainWorld("petApi", petApi);
