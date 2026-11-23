// Course checker. Run: npm run check-course -- src/courses/vienna.json [depth]
//
// Checks:
//  1. Every move in the tree and in the traps is legal and written in standard notation.
//  2. Every move for the user's side is close to Stockfish's best (flags losses >= 50 centipawns).
//  3. Opponent moves tagged "mistake" really are mistakes (lose >= 100 centipawns).
//  4. Every trap ends in a position where the user is clearly better (>= +1.5 pawns).
//  5. Every "concept:<id>" tag points at a concept in the overview.
// Exits with code 1 if anything fails.
import { readFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import { Engine } from './lib/engine.mjs';

const file = process.argv[2];
const depth = Number(process.argv[3] ?? 18);
if (!file) {
  console.error('Usage: npm run check-course -- <course.json> [depth]');
  process.exit(2);
}

const course = JSON.parse(readFileSync(file, 'utf8'));
const userColor = course.side === 'white' ? 'w' : 'b';
const sign = userColor === 'w' ? 1 : -1; // turn White-POV scores into user-POV
const conceptIds = new Set(course.overview.concepts.map((c) => c.id));

const MOVE_LOSS_LIMIT = 50;
const MISTAKE_MIN_LOSS = 100;
const TRAP_MIN_GAIN = 150;

const problems = [];
const engine = new Engine();
await engine.init();
const cache = new Map();
async function evalFen(fen) {
  if (!cache.has(fen)) cache.set(fen, await engine.evaluate(fen, depth));
  return cache.get(fen);
}

function label(chess) {
  const h = chess.history();
  return h.map((m, i) => (i % 2 === 0 ? `${i / 2 + 1}.${m}` : m)).join(' ');
}

let checked = 0;
async function walk(nodes, chess) {
  for (const node of nodes) {
    const before = chess.fen();
    const mover = chess.turn();
    let san;
    try {
      san = chess.move(node.move).san;
    } catch {
      problems.push(`ILLEGAL: "${node.move}" after: ${label(chess) || '(start)'}`);
      continue;
    }
    const where = label(chess);
    checked++;
    if (san !== node.move) problems.push(`NOTATION: "${node.move}" should be written "${san}" (${where})`);

    for (const t of node.tags ?? []) {
      if (t.startsWith('concept:') && !conceptIds.has(t.slice(8))) {
        problems.push(`UNKNOWN CONCEPT: ${t} (${where})`);
      }
    }

    const best = await evalFen(before);
    const after = await evalFen(chess.fen());
    if (best.cp !== null && after.cp !== null) {
      // Loss from the mover's point of view.
      const moverSign = mover === 'w' ? 1 : -1;
      const loss = (best.cp - after.cp) * moverSign;
      if (mover === userColor && loss >= MOVE_LOSS_LIMIT) {
        problems.push(`WEAK USER MOVE: ${where} loses ~${loss} cp (engine prefers ${best.best})`);
      }
      if (node.tags?.includes('mistake') && loss < MISTAKE_MIN_LOSS) {
        problems.push(`NOT A MISTAKE: ${where} only loses ~${loss} cp`);
      }
    }

    if (node.next) await walk(node.next, chess);
    chess.undo();
  }
}

await walk(course.tree, new Chess());

for (const trap of course.overview.traps) {
  const chess = new Chess();
  let ok = true;
  for (const m of trap.moves) {
    try {
      const san = chess.move(m).san;
      if (san !== m) problems.push(`NOTATION in trap "${trap.title}": "${m}" should be "${san}"`);
    } catch {
      problems.push(`ILLEGAL in trap "${trap.title}": "${m}" after ${label(chess)}`);
      ok = false;
      break;
    }
  }
  if (!ok) continue;
  const r = await evalFen(chess.fen());
  const gain = r.cp === null ? 0 : r.cp * sign;
  if (gain < TRAP_MIN_GAIN) problems.push(`WEAK TRAP "${trap.title}": ends at only ${gain} cp for you`);
  else console.log(`trap ok: "${trap.title}" (+${gain} cp)`);
}

engine.quit();
console.log(`\nChecked ${checked} tree moves and ${course.overview.traps.length} traps at depth ${depth}.`);
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(' - ' + p);
  process.exit(1);
}
console.log('All good.');
