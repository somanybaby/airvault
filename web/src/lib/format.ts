// Modified by somanybaby on 2026-10-03: Simplified Chinese time and date labels. See NOTICE.md; GPL-3.0-or-later.
export function shortUdid(udid: string): string {
  if (!udid) return '';
  if (udid.length <= 15) return udid;
  return `${udid.slice(0, 10)}…${udid.slice(-4)}`;
}

/** Pass the live `$now` store to make the label tick. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';

  const deltaSec = Math.round((now - then) / 1000);
  const past = deltaSec >= 0;
  const s = Math.abs(deltaSec);

  let out: string;
  if (s < 45) return past ? '刚刚' : '片刻后';
  else if (s < 5400) out = `${Math.round(s / 60)} 分钟`;
  else if (s < 129600) out = `${Math.round(s / 3600)} 小时`;
  else if (s < 1728000) out = `${Math.round(s / 86400)} 天`;
  else out = `${Math.round(s / 604800)} 周`;

  return past ? `${out}前` : `${out}后`;
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
}

/** From unix seconds (AFC mtimes). */
export function formatDate(unixSec?: number): string {
  if (!unixSec) return '';
  return new Date(unixSec * 1000).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatBytes(n?: number): string {
  if (!n || n <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  const digits = v < 10 && i > 0 ? 1 : 0;
  return `${v.toFixed(digits)} ${units[i]}`;
}

export function fileFacts(f: { size?: number; modified?: number }): string {
  return f.modified ? `${formatBytes(f.size)} · ${formatDate(f.modified)}` : formatBytes(f.size);
}

/** Empty for 0/unknown so callers can hide the speed line. */
export function formatSpeed(bytesPerSec?: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '';
  return `${formatBytes(bytesPerSec)}/s`;
}

export function formatDuration(startIso?: string, endIso?: string): string {
  if (!startIso || !endIso) return '—';
  const a = new Date(startIso).getTime();
  const b = new Date(endIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return '—';
  let secs = Math.round((b - a) / 1000);
  const h = Math.floor(secs / 3600);
  secs -= h * 3600;
  const m = Math.floor(secs / 60);
  secs -= m * 60;
  if (h > 0) return `${h} 小时 ${m} 分钟`;
  if (m > 0) return `${m} 分钟 ${secs} 秒`;
  return `${secs} 秒`;
}
