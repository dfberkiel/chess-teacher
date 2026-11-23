import { Chess } from 'chess.js';
import type { Concept, Course, MoveNode } from './types';

/** One move of a line, ready to show on the board. */
export type Ply = {
  san: string;
  why?: string;
  concepts: Concept[];
  from: string;
  to: string;
  /** Position after this move. */
  fen: string;
  /** e.g. "3." or "3…" */
  label: string;
};

export const START_FEN = new Chess().fen();

/** Follow the "spine"-tagged moves from the start: the Stage 1 main line. */
export function spineLine(course: Course): Ply[] {
  const chess = new Chess();
  const plies: Ply[] = [];
  let nodes: MoveNode[] | undefined = course.tree;
  for (;;) {
    const node: MoveNode | undefined = nodes?.find((n) => n.tags?.includes('spine'));
    if (!node) break;
    const label = `${chess.moveNumber()}${chess.turn() === 'w' ? '.' : '…'}`;
    const m = chess.move(node.move);
    const conceptIds = (node.tags ?? [])
      .filter((t) => t.startsWith('concept:'))
      .map((t) => t.slice('concept:'.length));
    plies.push({
      san: m.san,
      why: node.why,
      concepts: course.overview.concepts.filter((c) => conceptIds.includes(c.id)),
      from: m.from,
      to: m.to,
      fen: chess.fen(),
      label,
    });
    nodes = node.next;
  }
  return plies;
}
