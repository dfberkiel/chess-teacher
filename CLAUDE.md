# Chess Teacher app

## What this is
A personal chess-training app for one user (Dan), iPhone only, never released publicly. Installed as a PWA from GitHub Pages via Safari "Add to Home Screen".
Goal: an opening-repertoire trainer (spaced repetition, guided learning paths) with Stockfish analysis and short plain-English "why" explanations. Puzzles and endgames come later. Full games vs engine are out of scope for now.
Planning docs live in the claude.ai Project "Dans Chess Teacher" (build-plan-v1.md, requirements.md, opening-learning-paths-spec.md). If you can access them, read the relevant one before starting a major feature.

## About the user
- Not a professional developer; has built apps with vibe-coding tools. Explain things in plain language and define jargon in a few words.
- Wants direct, efficient communication. Push back honestly if an idea is a bad one. Don't just agree.
- Plays ~1100-1400 (Lichess). Explanation tone in the app: concrete ideas and threats, minimal jargon.

## Stack and constraints
- Vite + React + TypeScript. Chessground (board), chess.js (rules).
- Stockfish: single-thread, lightweight WASM in a Web Worker (GitHub Pages can't send headers needed for multithreading).
- Static hosting on GitHub Pages. Data on-device in IndexedDB. No backend, no accounts.
- Never commit secrets. API keys and Lichess tokens are entered in the app and stored on the device only.
- Keep dependencies minimal; ask before adding a large one. Keep the app small; offline use must work.
- Add an export/backup feature for user data (iOS can clear web-app storage).

## How to work
- For anything beyond a tiny change: write a short plan first and wait for my OK.
- One task at a time. Do exactly what was asked. If you spot a good extra idea, mention it; don't build it.
- If a request is vague or involves a choice that matters, ask before building.
- After each working step: tell me how to test it on my iPhone, then commit with a clear message.
- If something I ask will cause problems later, say so before doing it.

## Session-health reminders (keeps my usage low)
- When a task is finished, remind me this is a good time to run /clear before starting something unrelated.
- If the session has gotten long, or you've failed twice at the same bug, suggest /compact or a fresh session, and give me a 3-line summary to paste into the new one.
- Don't read huge files or logs in full; search for the part you need.
- If a task is simple (rename, small edit), suggest I switch to a lighter model with /model.
- At the end of a session, update "Current status" below.

## Current status (update at the end of each session; keep it to ~5 lines)
- Phase 0 (board + Stockfish + PWA install on iPhone): DONE. Live on GitHub Pages and confirmed working by Dan.
- Engine: Stockfish 19 lite single-thread (~1.8 MB wasm), copied from npm `stockfish` into public/engine/ by scripts/copy-engine.mjs (not in git).
- Deploy: push to main → .github/workflows/deploy.yml → https://dfberkiel.github.io/chess-teacher/ (base path /chess-teacher/).
- Next: Vienna Game pilot course (data format + drill screen). Opponent moves are auto-played from the course file, not by Stockfish.
