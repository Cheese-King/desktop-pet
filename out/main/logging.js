'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { format } = require('node:util');

function installFileLogging(logDir) {
  const logPath = path.join(logDir, 'qiban.log');
  function write(level, args) {
    try {
      fs.mkdirSync(logDir, { recursive: true });
      if (fs.existsSync(logPath) && fs.statSync(logPath).size > 2 * 1024 * 1024) {
        fs.copyFileSync(logPath, logPath + '.previous');
        fs.truncateSync(logPath, 0);
      }
      fs.appendFileSync(logPath, `${new Date().toISOString()} [${level}] ${format(...args).slice(0, 16000)}\n`, 'utf8');
    } catch {
      // Logging must never take down the desktop process, even on a full disk.
    }
  }
  for (const level of ['log', 'info', 'warn', 'error', 'debug']) console[level] = (...args) => write(level, args);
  // A detached parent can leave inherited output pipes closed.
  for (const stream of [process.stdout, process.stderr]) {
    stream?.on('error', error => { write('stream', [error]); });
  }
  return { logPath, write };
}
module.exports = { installFileLogging };
