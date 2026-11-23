import { useEffect, useRef } from 'react';
import { Chessground } from 'chessground';
import type { Api } from 'chessground/api';
import type { Key } from 'chessground/types';
import { Chess, SQUARES } from 'chess.js';

type Props = {
  fen: string;
  lastMove?: [string, string];
  onMove: (from: string, to: string) => void;
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

export function Board({ fen, lastMove, onMove }: Props) {
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
    cg.current?.set({
      fen,
      turnColor: turn,
      check: chess.inCheck(),
      lastMove: lastMove as Key[] | undefined,
      movable: { color: chess.isGameOver() ? undefined : turn, dests: legalDests(chess) },
    });
  }, [fen, lastMove]);

  return <div ref={el} className="board" />;
}
