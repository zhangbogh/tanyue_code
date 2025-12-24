/**
 * Lightweight browser logger emulating Winston-like levels.
 * Provides levelled logging with optional metadata.
 * Replaceable with real Winston in Node environments.
 */
(function () {
  const levels = ['error', 'warn', 'info', 'debug'];
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  const ts = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const log = (level, message, meta) => {
    const prefix = `[${ts()}][${level.toUpperCase()}]`;
    if (meta !== undefined) {
      // Use console method if available; fallback to console.log
      const method = console[level] || console.log;
      method(`${prefix} ${message}`, meta);
    } else {
      const method = console[level] || console.log;
      method(`${prefix} ${message}`);
    }
  };

  const Logger = {
    /** Log with explicit level */
    log,
    /** Error level logging */
    error: (msg, meta) => log('error', msg, meta),
    /** Warn level logging */
    warn: (msg, meta) => log('warn', msg, meta),
    /** Info level logging */
    info: (msg, meta) => log('info', msg, meta),
    /** Debug level logging */
    debug: (msg, meta) => log('debug', msg, meta),
  };

  // Expose globally
  window.Logger = Logger;
})();