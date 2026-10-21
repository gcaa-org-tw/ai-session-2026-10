export function clampSlide(i: number, total: number): number {
  if (total <= 0 || !Number.isFinite(i)) return 0;
  return Math.min(Math.max(Math.floor(i), 0), total - 1);
}
