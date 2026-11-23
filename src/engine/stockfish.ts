// Tiny UCI wrapper around the single-threaded Stockfish WASM build running in a Web Worker.

export type Score = { type: 'cp' | 'mate'; value: number }; // from White's point of view

export type EngineLine = {
  multipv: number; // 1 = best
  depth: number;
  score: Score;
  pv: string[]; // UCI moves, e.g. ["e2e4", "e7e5"]
};

type Listener = (lines: EngineLine[], fen: string) => void;

const ENGINE_URL = `${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`;

export class Engine {
  private worker: Worker;
  private ready: Promise<void>;
  private lines: EngineLine[] = [];
  private fen = '';
  private whiteToMove = true;
  private listener: Listener | null = null;
  // While a "stop" is pending, the engine may still send output for the old position;
  // we ignore everything until its "bestmove" arrives.
  private searching = false;
  private pending: { fen: string; depth: number } | null = null;

  constructor() {
    this.worker = new Worker(ENGINE_URL);
    this.ready = new Promise((resolve) => {
      const onReady = (e: MessageEvent) => {
        if (e.data === 'readyok') {
          this.worker.removeEventListener('message', onReady);
          resolve();
        }
      };
      this.worker.addEventListener('message', onReady);
    });
    this.worker.addEventListener('message', (e) => this.onLine(String(e.data)));
    this.send('uci');
    this.send('setoption name MultiPV value 3');
    this.send('isready');
  }

  onUpdate(fn: Listener) {
    this.listener = fn;
  }

  async analyze(fen: string, depth: number) {
    await this.ready;
    if (this.searching) {
      // Queue the new request; start it once the old search reports "bestmove".
      this.pending = { fen, depth };
      this.send('stop');
      return;
    }
    this.start(fen, depth);
  }

  stop() {
    this.pending = null;
    if (this.searching) this.send('stop');
  }

  terminate() {
    this.worker.terminate();
  }

  private start(fen: string, depth: number) {
    this.fen = fen;
    this.whiteToMove = fen.split(' ')[1] === 'w';
    this.lines = [];
    this.searching = true;
    this.send(`position fen ${fen}`);
    this.send(`go depth ${depth}`);
  }

  private send(cmd: string) {
    this.worker.postMessage(cmd);
  }

  private onLine(line: string) {
    if (line.startsWith('bestmove')) {
      this.searching = false;
      if (this.pending) {
        const p = this.pending;
        this.pending = null;
        this.start(p.fen, p.depth);
      }
      return;
    }
    if (this.pending || !line.startsWith('info ') || !line.includes(' pv ')) return;

    const tokens = line.split(' ');
    const get = (key: string) => {
      const i = tokens.indexOf(key);
      return i >= 0 ? tokens[i + 1] : undefined;
    };
    const depth = Number(get('depth'));
    const multipv = Number(get('multipv') ?? 1);
    const scoreIdx = tokens.indexOf('score');
    if (scoreIdx < 0) return;
    const type = tokens[scoreIdx + 1] as 'cp' | 'mate';
    let value = Number(tokens[scoreIdx + 2]);
    if (!this.whiteToMove) value = -value; // engine reports from side-to-move
    const pv = tokens.slice(tokens.indexOf('pv') + 1);

    this.lines[multipv - 1] = { multipv, depth, score: { type, value }, pv };
    this.listener?.(this.lines.filter(Boolean), this.fen);
  }
}
