export type TransitionType = 'wave' | 'spiral' | 'random' | 'rows' | 'columns' | 'diagonal';

export const TRANSITIONS: TransitionType[] = ['wave', 'spiral', 'random', 'rows', 'columns', 'diagonal'];

export function getDelay(pixelId: number, type: TransitionType, gridSize: number = 32): number {
  const idx = pixelId - 1;
  const row = Math.floor(idx / gridSize);
  const col = idx % gridSize;
  const cr = gridSize / 2;

  switch (type) {
    case 'wave':
      return Math.sqrt((row - cr) ** 2 + (col - cr) ** 2) * 25;
    case 'spiral':
      return (Math.atan2(row - cr, col - cr) + Math.PI) * 50 + Math.sqrt((row - cr) ** 2 + (col - cr) ** 2) * 30;
    case 'random':
      return Math.random() * 800;
    case 'rows':
      return row * 60 + Math.random() * 20;
    case 'columns':
      return col * 60 + Math.random() * 20;
    case 'diagonal':
      return (row + col) * 30;
    default:
      return 0;
  }
}
