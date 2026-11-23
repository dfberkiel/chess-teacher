import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { Board, type Hint } from './Board';
import { spineLine, START_FEN } from './courses/spine';
import type { Course } from './courses/types';

export type DrillMode = 'learn' | 'practice';

const OPPONENT_DELAY_MS = 500;

type Props = { course: Course; mode: DrillMode; onBack: () => void };

export function Drill({ course, mode, onBack }: Props) {
  const plies = useMemo(() => spineLine(course), [course]);
  const userColor = course.side === 'white' ? 'w' : 'b';

  const [idx, setIdx] = useState(0); // number of moves played so far
  const [misses, setMisses] = useState(0); // wrong tries on the current move
  const [missedMoves, setMissedMoves] = useState(0); // moves with at least one wrong try
  const [syncKey, setSyncKey] = useState(0);

  const done = idx >= plies.length;
  const fen = idx === 0 ? START_FEN : plies[idx - 1].fen;
  const lastMove: [string, string] | undefined =
    idx === 0 ? undefined : [plies[idx - 1].from, plies[idx - 1].to];
  const userTurn = !done && new Chess(fen).turn() === userColor;
  const expected = done ? undefined : plies[idx];

  // Opponent moves come from the course file, after a short pause.
  useEffect(() => {
    if (done || userTurn) return;
    const t = setTimeout(() => setIdx((i) => i + 1), OPPONENT_DELAY_MS);
    return () => clearTimeout(t);
  }, [idx, done, userTurn]);

  function onMove(from: string, to: string) {
    if (!userTurn || !expected) return;
    const chess = new Chess(fen);
    let san: string;
    try {
      san = chess.move({ from, to, promotion: 'q' }).san;
    } catch {
      return;
    }
    if (san === expected.san) {
      setIdx((i) => i + 1);
      setMisses(0);
    } else {
      if (misses === 0) setMissedMoves((n) => n + 1);
      setMisses((n) => n + 1);
      setSyncKey((k) => k + 1); // snap the piece back
    }
  }

  function restart() {
    setIdx(0);
    setMisses(0);
    setMissedMoves(0);
    setSyncKey((k) => k + 1);
  }

  let hints: Hint[] = [];
  if (userTurn && expected) {
    if (mode === 'learn' || misses >= 3) hints = [{ from: expected.from, to: expected.to }];
    else if (misses >= 2) hints = [{ from: expected.from }];
  }

  // Explanations for the last two moves (your move and the reply).
  const recent = plies.slice(Math.max(0, idx - 2), idx).filter((p) => p.why);

  return (
    <div className="app">
      <div className="board-wrap">
        <Board
          fen={fen}
          lastMove={lastMove}
          onMove={onMove}
          orientation={course.side}
          interactive={userTurn}
          hints={hints}
          syncKey={syncKey}
        />
      </div>

      <div className="controls">
        <button onClick={onBack}>← Back</button>
        <button onClick={restart} disabled={idx === 0}>
          Restart
        </button>
        <span className="mode-tag">{mode === 'learn' ? 'Learn' : 'Practice'}</span>
      </div>

      <div className="panel">
        {done ? (
          <div className="done">
            <div className="status">Line complete!</div>
            <div>
              {missedMoves === 0
                ? 'No mistakes.'
                : `${missedMoves} move${missedMoves === 1 ? '' : 's'} needed another try.`}
            </div>
            <div className="controls">
              <button onClick={restart}>Again</button>
              <button onClick={onBack}>Back</button>
            </div>
          </div>
        ) : (
          <div className="prompt">
            {userTurn
              ? misses === 0
                ? mode === 'learn'
                  ? 'Play the move shown by the arrow.'
                  : 'Your move.'
                : misses === 1
                  ? 'Not quite. Try again.'
                  : misses === 2
                    ? 'Hint: move this piece.'
                    : `The move is ${expected!.label} ${expected!.san}.`
              : '…'}
          </div>
        )}

        {recent.map((p) => (
          <div className="note" key={p.fen}>
            <div className="note-move">
              {p.label} {p.san}
            </div>
            <div>{p.why}</div>
            {p.concepts.map((c) => (
              <div className="concept" key={c.id}>
                Idea: {c.title}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
