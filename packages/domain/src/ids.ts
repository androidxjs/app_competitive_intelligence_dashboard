export function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function isoNow(): string {
  return new Date().toISOString();
}

export function dateOnly(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
