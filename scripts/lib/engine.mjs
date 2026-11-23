// Minimal Stockfish driver for Node scripts (course checking).
// Runs the same engine build the app uses, as a child process over stdin/stdout.
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ENGINE = join(root, 'node_modules', 'stockfish', 'bin', 'stockfish-19-lite-single.js');

export class Engine {
  constructor() {
    this.proc = spawn(process.execPath, [ENGINE], { stdio: ['pipe', 'pipe', 'ignore'] });
    this.buf = '';
    this.waiters = [];
    this.proc.stdout.on('data', (d) => {
      this.buf += d.toString();
      let i;
      while ((i = this.buf.indexOf('\n')) >= 0) {
        const line = this.buf.slice(0, i).trim();
        this.buf = this.buf.slice(i + 1);
        for (const w of [...this.waiters]) w(line);
      }
    });
  }

  send(cmd) {
    this.proc.stdin.write(cmd + '\n');
  }

  /** Resolve with the first line for which `test` returns true; collect lines before it. */
  waitFor(test) {
    return new Promise((resolve) => {
      const lines = [];
      const w = (line) => {
        lines.push(line);
        if (test(line)) {
          this.waiters = this.waiters.filter((x) => x !== w);
          resolve(lines);
        }
      };
      this.waiters.push(w);
    });
  }

  async init() {
    this.send('uci');
    await this.waitFor((l) => l === 'uciok');
    this.send('setoption name Hash value 64');
    this.send('isready');
    await this.waitFor((l) => l === 'readyok');
  }

  /**
   * Evaluate a position. Returns score in centipawns from WHITE's point of view
   * (mate scores mapped to +/-100000), plus the best move in UCI.
   */
  async evaluate(fen, depth = 16) {
    this.send('ucinewgame');
    this.send(`position fen ${fen}`);
    this.send(`go depth ${depth}`);
    const lines = await this.waitFor((l) => l.startsWith('bestmove'));
    const whiteToMove = fen.split(' ')[1] === 'w';
    let cp = 0;
    let pv = [];
    for (const l of lines) {
      const m = l.match(/ score (cp|mate) (-?\d+).* pv (.+)$/);
      if (!m || l.includes('upperbound') || l.includes('lowerbound')) continue;
      const v = Number(m[2]);
      cp = m[1] === 'cp' ? v : v > 0 ? 100000 - v : -100000 - v;
      pv = m[3].split(' ');
    }
    const best = lines[lines.length - 1].split(' ')[1];
    if (best === '(none)') return { cp: null, best: null, pv: [] };
    return { cp: whiteToMove ? cp : -cp, best, pv };
  }

  quit() {
    this.send('quit');
    this.proc.kill();
  }
}
