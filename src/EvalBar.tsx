import type { Score } from './engine/stockfish';

// Share of the bar that is white (0..100). Smooth curve so ±4 pawns ≈ 90/10.
function whitePercent(score: Score): number {
  if (score.type === 'mate') return score.value >= 0 ? 100 : 0;
  return 50 + 50 * (2 / (1 + Math.exp(-0.004 * score.value)) - 1);
}

export function formatScore(score: Score): string {
  if (score.type === 'mate') {
    return score.value === 0 ? '#' : `${score.value > 0 ? '' : '-'}M${Math.abs(score.value)}`;
  }
  const pawns = score.value / 100;
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(1)}`;
}

type Props = { score?: Score; winner?: 'white' | 'black' };

export function EvalBar({ score, winner }: Props) {
  const pct = winner ? (winner === 'white' ? 100 : 0) : score ? whitePercent(score) : 50;
  const whiteAhead = pct >= 50;
  const label = winner ? (winner === 'white' ? '1-0' : '0-1') : score && formatScore(score).replace('+', '');
  return (
    <div className="evalbar" aria-label="evaluation">
      <div className="evalbar-white" style={{ height: `${pct}%` }} />
      {label && <span className={`evalbar-label ${whiteAhead ? 'bottom' : 'top'}`}>{label}</span>}
    </div>
  );
}
