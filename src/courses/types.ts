// Course data format. One JSON file per opening (see vienna.json).
//
// The course is a move tree: each node is one move (in SAN, e.g. "Nf3"),
// and `next` lists the possible replies. The path through the tree gives the
// position, so a position is never written down twice.

export type Side = 'white' | 'black';

/** Where a frequency number came from. */
export type FreqSource = 'lichess' | 'estimate';

export type MoveNode = {
  /** The move in standard algebraic notation, e.g. "e4", "Nxe4", "O-O". */
  move: string;
  /** Short plain-English reason. Only at key decision points. */
  why?: string;
  /**
   * Share of games (0-1) where this move is played, among its siblings,
   * at the target rating range (~1000-1600). Mostly for opponent moves.
   */
  freq?: number;
  /**
   * Labels:
   * - "spine": part of the Stage 1 main line
   * - "mistake": an opponent move that can be punished
   * - "concept:<id>": illustrates an overview concept
   */
  tags?: string[];
  next?: MoveNode[];
};

export type Concept = { id: string; title: string; text: string };

export type Trap = {
  title: string;
  /** Full move list from the starting position, in SAN. */
  moves: string[];
  /** What happens and why it works. */
  text: string;
};

export type Overview = {
  idea: string;
  structure: string;
  plans: string[];
  concepts: Concept[];
  traps: Trap[];
};

export type Course = {
  id: string;
  name: string;
  /** The side the user plays. */
  side: Side;
  /** One line: which opponent replies this course covers. */
  scope: string;
  freqSource: FreqSource;
  overview: Overview;
  /** First moves of the tree (from the normal starting position). */
  tree: MoveNode[];
};
