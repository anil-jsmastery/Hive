const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function timeAgo(date: string | Date): string {
  const then = new Date(date);
  const seconds = Math.max(0, Math.floor((Date.now() - then.getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days <= 7) return days === 1 ? '1 day ago' : `${days} days ago`;
  return `${then.getDate()} ${MONTHS[then.getMonth()]} ${then.getFullYear()}`;
}
