# chess-teacher

A personal chess trainer for iPhone, installed as a web app (PWA). This is **Phase 0**: a board where you can play legal moves for both sides, with Stockfish analysis (eval bar plus the top 3 lines). It works offline after the first load.

Live URL: **https://dfberkiel.github.io/chess-teacher/**

## One-time GitHub setup (do this once)

1. On GitHub, open the repo → **Settings** → **Pages**.
2. Under **Build and deployment** → **Source**, choose **GitHub Actions**.
3. Open the **Actions** tab. If the "Deploy to GitHub Pages" run failed before you did step 2, open it and click **Re-run all jobs**. (You can also start it with **Run workflow**.)
4. When the run shows a green check (about 1 minute), the site is live at the URL above.

After this, every push to `main` redeploys automatically.

## Install on your iPhone

1. Open **Safari**. It must be Safari: Chrome and other browsers on iPhone can't add web apps to the Home Screen with offline support.
2. Go to **https://dfberkiel.github.io/chess-teacher/**.
3. Wait until the board appears and the engine lines show moves. That means everything, including the engine, has downloaded (about 1.3 MB).
4. Tap the **Share** button (the square with an up arrow) → scroll down → **Add to Home Screen** → make sure **Open as Web App** is on, if shown → **Add**.
5. Open **Chess** from your Home Screen once while you still have internet. This first launch saves the app for offline use.
6. **Offline test:** close the app (swipe it away), turn on **Airplane Mode**, and open it again. The board and engine should still work.

### Getting updates
After a new version is deployed, open the app while online. It downloads the update in the background, and the new version appears the **next** time you open it (close it and reopen).

### If something looks stuck
- Close the app fully (swipe up from the bottom, then swipe it away) and reopen.
- Last resort: delete the Home Screen icon, then go to iPhone **Settings → Apps → Safari → Advanced → Website Data**, remove `dfberkiel.github.io`, and install again.

## Using it

- Tap a piece, then a highlighted square (or drag). Both sides are played by you. Pawns promote to a queen automatically for now.
- **Undo** takes back one move. **Reset** goes back to the start.
- **Depth** sets how deep Stockfish searches (higher = stronger but slower). 16 is the default.
- The eval bar and scores are always from White's side: **+1.0** means White is about one pawn better, **M3** means mate in 3.

## Developing (on a computer)

```bash
npm install      # also copies the Stockfish engine into public/engine/
npm run dev      # local dev server
npm run build    # production build into dist/
npm run preview  # serve the production build at http://localhost:4173/chess-teacher/
```

Stack: Vite + React + TypeScript, [Chessground](https://github.com/lichess-org/chessground) board, [chess.js](https://github.com/jhlywa/chess.js) rules, [Stockfish 19 lite single-threaded WASM](https://github.com/nmrugg/stockfish.js) in a Web Worker, and `vite-plugin-pwa` for offline support.
