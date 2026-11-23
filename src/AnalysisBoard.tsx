import { useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import { Board } from './Board';
import { EvalBar, formatScore } from './EvalBar';
import { Engine, type EngineLine, type Score } from './engine/stockfish';

const START_FEN = new Chess().fen();
const DEPTHS = [8, 10, 12, 14, 16, 18, 20, 22, 24];

type Ply = { fen: string; lastMove: [string, string] };

// Turn a line of UCI moves into numbered SAN text, e.g. "12. Nf3 Nc6 13. Bb5".
function pvToSan(fen: string, pv: string[], max = 10): string {
  const chess = new Chess(fen);
  const parts: string[] = [];
  for (const uci of pv.slice(0, max)) {
    const moveNo = chess.moveNumber();
    const white = chess.turn() === 'w';
    try {
      const m = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
      if (white) parts.push(`${moveNo}. ${m.san}`);
      else parts.push(parts.length === 0 ? `${moveNo}… ${m.san}` : m.san);
    } catch {
      break;
    }
  }
  return parts.join(' ');
}

export function AnalysisBoard({ onBack }: { onBack: () => void }) {
  const [history, setHistory] = useState<Ply[]>([]);
  const [depth, setDepth] = useState(16);
  const [lines, setLines] = useState<EngineLine[]>([]);
  const engine = useRef<Engine | null>(null);

  const fen = history.length ? history[history.length - 1].fen : START_FEN;
  const lastMove = history.length ? history[history.length - 1].lastMove : undefined;
  const game = useMemo(() => new Chess(fen), [fen]);

  useEffect(() => {
    const e = new Engine();
    engine.current = e;
    return () => e.terminate();
  }, []);

  useEffect(() => {
    const e = engine.current!;
    e.onUpdate((l, lineFen) => {
      if (lineFen === fen) setLines([...l]);
    });
    setLines([]);
    if (game.isGameOver()) e.stop();
    else e.analyze(fen, depth);
  }, [fen, depth, game]);

  function onMove(from: string, to: string) {
    const chess = new Chess(fen);
    try {
      chess.move({ from, to, promotion: 'q' }); // auto-queen for now
    } catch {
      return;
    }
    setHistory((h) => [...h, { fen: chess.fen(), lastMove: [from, to] }]);
  }

  let status = '';
  let barScore: Score | undefined = lines[0]?.score;
  let winner: 'white' | 'black' | undefined;
  if (game.isCheckmate()) {
    winner = game.turn() === 'w' ? 'black' : 'white';
    status = `Checkmate. ${winner === 'white' ? 'White' : 'Black'} wins.`;
  } else if (game.isStalemate()) {
    status = 'Stalemate.';
    barScore = { type: 'cp', value: 0 };
  } else if (game.isDraw()) {
    status = 'Draw.';
    barScore = { type: 'cp', value: 0 };
  }

  return (
    <div className="app">
      <div className="board-row">
        <EvalBar score={barScore} winner={winner} />
        <div className="board-wrap">
          <Board fen={fen} lastMove={lastMove} onMove={onMove} />
        </div>
      </div>

      <div className="controls">
        <button onClick={onBack}>← Home</button>
        <button onClick={() => setHistory((h) => h.slice(0, -1))} disabled={!history.length}>
          Undo
        </button>
        <button onClick={() => setHistory([])} disabled={!history.length}>
          Reset
        </button>
        <label>
          Depth{' '}
          <select value={depth} onChange={(e) => setDepth(Number(e.target.value))}>
            {DEPTHS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="lines">
        {status ? (
          <div className="status">{status}</div>
        ) : (
          <>
            <div className="lines-head">
              Stockfish 19 lite · depth {lines[0]?.depth ?? '…'}/{depth}
            </div>
            {[0, 1, 2].map((i) => {
              const l = lines[i];
              return (
                <div className="line" key={i}>
                  <span className="score">{l ? formatScore(l.score) : ''}</span>
                  <span className="pv">{l ? pvToSan(fen, l.pv) : i === 0 ? 'thinking…' : ''}</span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
