// Lightweight global error capture bus.
// Import captureError from anywhere to push an entry into the ErrorLog panel.

export interface ErrorEntry {
  id: number;
  ts: string;
  msg: string;
  detail?: string;
}

let _id = 0;
export const errorSubscribers: Array<(e: ErrorEntry) => void> = [];

export function captureError(msg: string, detail?: string) {
  const entry: ErrorEntry = {
    id: ++_id,
    ts: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    msg: String(msg).slice(0, 400),
    detail: detail ? String(detail).slice(0, 800) : undefined,
  };
  errorSubscribers.forEach(fn => fn(entry));
}
