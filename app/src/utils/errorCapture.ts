// Lightweight global event log bus.
// Import captureLog/captureError from anywhere to push entries into the debug panel.

export type LogLevel = 'info' | 'success' | 'warn' | 'error';

export interface ErrorEntry {
  id: number;
  ts: string;
  level: LogLevel;
  msg: string;
  detail?: string;
}

let _id = 0;
export const errorSubscribers: ((e: ErrorEntry) => void)[] = [];

function capture(level: LogLevel, msg: string, detail?: string) {
  const entry: ErrorEntry = {
    id: ++_id,
    level,
    ts: new Date().toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    msg: msg.slice(0, 400),
    detail: detail ? detail.slice(0, 800) : undefined,
  };
  errorSubscribers.forEach((fn) => {
    fn(entry);
  });
}

export const captureLog = (msg: string, detail?: string) => capture('info', msg, detail);
export const captureSuccess = (msg: string, detail?: string) => capture('success', msg, detail);
export const captureWarn = (msg: string, detail?: string) => capture('warn', msg, detail);
export const captureError = (msg: string, detail?: string) => capture('error', msg, detail);
