import { useEffect, useRef } from 'react';
import { Chessground } from 'chessground';
import type { Api } from 'chessground/api';
import type { Key } from 'chessground/types';
import type { DrawShape } from 'chessground/draw';
import { Chess, SQUARES } from 'chess.js';

/** An arrow (from → to) or, with no `to`, a circle on one square. */
export type Hint = { from: string; to?: string };

type Props = {
  fen: string;
  lastMove?: [string, string];
  onMove: (from: string, to: string) => void;
  orientation?: 'white' | 'black';
  /** False = pieces can't be moved (e.g. while the opponent's move is coming). */
  interactive?: boolean;
  hints?: Hint[];
  /** Change this number to force the board back to `fen` (e.g. undo a wrong move). */
  syncKey?: number;
};

// Legal destinations for every piece of the side to move, in Chessground's format.
function legalDests(chess: Chess): Map<Key, Key[]> {
  const dests = new Map<Key, Key[]>();
  for (const sq of SQUARES) {
    const moves = chess.moves({ square: sq, verbose: true });
    if (moves.length) dests.set(sq, moves.map((m) => m.to));
  }
  return dests;
}

export function Board({
  fen,
  lastMove,
  onMove,
  orientation = 'white',
  interactive = true,
  hints,
  syncKey,
}: Props) {
  const el = useRef<HTMLDivElement>(null);
  const cg = useRef<Api | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  useEffect(() => {
    cg.current = Chessground(el.current!, {
      movable: { free: false, showDests: true },
      draggable: { showGhost: true },
      animation: { duration: 150 },
      events: { move: (from, to) => onMoveRef.current(from, to) },
    });
    return () => cg.current?.destroy();
  }, []);

  useEffect(() => {
    const chess = new Chess(fen);
    const turn = chess.turn() === 'w' ? 'white' : 'black';
    const canMove = interactive && !chess.isGameOver();
    cg.current?.set({
      fen,
      orientation,
      turnColor: turn,
      check: chess.inCheck(),
      lastMove: lastMove as Key[] | undefined,
      movable: { color: canMove ? turn : undefined, dests: canMove ? legalDests(chess) : new Map() },
    });
  }, [fen, lastMove, orientation, interactive, syncKey]);

  useEffect(() => {
    const shapes: DrawShape[] = (hints ?? []).map((h) => ({
      orig: h.from as Key,
      dest: h.to as Key | undefined,
      brush: 'green',
    }));
    cg.current?.setAutoShapes(shapes);
  }, [hints, syncKey]);

  return <div ref={el} className="board" />;
}
