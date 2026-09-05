const HISTORY_KEY = 'tryon_history';
const HISTORY_MAX = 10;
const THUMBNAIL_WIDTH = 120;
const THUMBNAIL_QUALITY = 0.85;

export interface HistoryItem {
  id: string;
  timestamp: number;
  thumbnail: string;
}

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryItem[];
  } catch {
    try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
    return [];
  }
}

async function generateThumbnail(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = THUMBNAIL_WIDTH / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = THUMBNAIL_WIDTH;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('no 2d context')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', THUMBNAIL_QUALITY));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export async function addHistoryItem(
  resultImage: string,
  current: HistoryItem[]
): Promise<HistoryItem[]> {
  try {
    const thumbnail = await generateThumbnail(resultImage);
    const item: HistoryItem = {
      id: String(Date.now()),
      timestamp: Date.now(),
      thumbnail,
    };
    const next = [...current, item].slice(-HISTORY_MAX);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch {
    return current;
  }
}

export function deleteHistoryItem(id: string, current: HistoryItem[]): HistoryItem[] {
  const next = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
  return next;
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
  return `${Math.floor(diff / 86400)} 天前`;
}
