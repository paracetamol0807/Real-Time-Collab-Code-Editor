# CodeShare — Real-Time Collaborative Code Editor

A real-time collaborative code editor built with React. Users create or join a "room" via a
shareable room ID, and everyone in that room is expected to edit the same document together in
real time.

**Status: early prototype / scaffold only.** The UI shell exists, but the collaboration engine
(the actual editor + websocket backend) has not been implemented yet. See
[Known Flaws](#known-flaws) below for the full list of gaps.

---

## Tech Stack

| Layer     | Choice                                              |
| --------- | --------------------------------------------------- |
| Framework | React 19                                             |
| Build     | Create React App (`react-scripts` 5.0.1)            |
| Routing   | `react-router-dom` v7 (`BrowserRouter`)              |
| IDs       | `uuid` v4 for room IDs                               |
| Feedback  | `react-hot-toast` (imported, but not mounted — bug)  |
| Styling   | Plain global CSS (`App.css`, `index.css`)            |
| Tests     | Jest + React Testing Library (boilerplate only)      |

Planned but **not** installed yet: a code editor (Monaco / CodeMirror 6) and a realtime transport
(`socket.io` or native WebSocket) plus a small Node server.

---

## Project Structure

```
src/
├── App.jsx                  # Router + route definitions
├── App.css                  # Home page styles (global)
├── index.js                 # React entry point
├── index.css                # Global resets/base styles
├── App.test.js              # Boilerplate test (currently failing)
├── reportWebVitals.js
└── Pages/
    ├── Home.jsx             # Create/join room form
    └── EditorPage.jsx       # Stub — renders the text "Editor Page"
public/
├── index.html
└── manifest.json
```

### Routing

| Route              | Component     | Purpose                          |
| ------------------ | ------------- | -------------------------------- |
| `/`                | `Home`        | Create a new room or join by ID  |
| `/editor/:roomId`  | `EditorPage`  | Intended collaborative editor    |

---

## Getting Started

```bash
npm install
npm start     # dev server on http://localhost:3000
npm test      # watch-mode test runner
npm run build # production bundle in ./build
```

Requirements: Node.js 18+ and npm.

> Note: this project uses `react-scripts`, which is deprecated and does not support React 19
> without warnings/potential build issues. Migrating to Vite is recommended (see flaws).

---

## Current Behaviour

1. Open `/` and enter a room ID and a username, then click **Join Room**.
2. Clicking **Create a new room** generates a UUID and fills the room ID field.
3. Navigating to `/editor/:roomId` renders only the placeholder `Editor Page`.

No editor, no persistence, and no realtime sync exist yet.

---

## Known Flaws

### Blocking / functional

1. **`joinRoom` can never navigate** — in `Home.jsx` the `navigate(...)` call sits *inside* the
   `if (!roomId || !username) { return; ... }` block. The validation branch returns early, so the
   success path is unreachable and the button silently does nothing on valid input. The redirect
   must be moved after the guard.
2. **`createNewRoom` never creates a room** — it only assigns a `uuid` to local state. There's no
   server call, no room registration, and it doesn't take the user to the room.
3. **`EditorPage` is a stub** — no editor, no websocket connection, no room awareness, no presence.
4. **No realtime backend** — the whole premise (collaboration) is unimplemented. There is no
   `server.js`, no `socket.io`/`ws` dependency, and no sync, conflict resolution, or persistence.
5. **The logo asset is missing** — `Home.jsx` references `/codesharelogo.png`, which does not exist
   in `public/`, so the header renders a broken image.
6. **Toasts are never displayed** — `<Toaster />` is commented out in `App.jsx`, so
   `toast.success` / `toast.error` calls in `Home.jsx` fire into the void. Users get no feedback.
7. **Username is never transmitted** — `Home.jsx` passes `username` via router `state`, but
   `EditorPage` ignores it entirely.
8. **`App.test.js` is failing** — it asserts on the text `/learn react/i`, which no longer exists
   in the app, so `npm test` fails out of the box.

### Correctness / robustness

9. **`createNewRoom` is wired to an `<a href="">`** — this triggers a navigation/reload on click,
   fighting the SPA router. It should be a `<button>` with proper `type="button"`.
10. **No input validation or trimming** — whitespace-only room IDs/usernames pass the check, and
    room IDs are not sanitised before being put into the URL.
11. **No error/redirect handling in `EditorPage`** — joining a nonexistent room shows the same page
    as a valid one; there's no 404 or "room not found" path.
12. **`roomId` state is reused as both input value and generated value** — typing after generating a
    room silently overwrites the new ID with no confirmation.

### Tooling / stack

13. **`react-scripts` 5.0.1 is deprecated and unmaintained** — it officially does not support
    React 19 and has known OpenSSL/Node 17+ build issues. Migrate to Vite.
14. **React 19 with older testing libraries** — `@testing-library/react` 16 and
    `@testing-library/user-event` 13 (v14+ is required for React 19) may misbehave.
15. **No test coverage** — one boilerplate test, no unit or integration coverage of room creation,
    joining, or the editor.
16. **No linting/formatting config beyond CRA defaults** — no Prettier, no ESLint rule customization,
    so `react-hooks/exhaustive-deps` issues pass silently.
17. **Mixed code style** — some files use semicolons and double quotes, others (e.g.
    `EditorPage.jsx`) omit both. Inconsistent formatting with no tool to enforce it.
18. **Dead code** — the entire CRA boilerplate remains: `logo.svg`, `App.test.js`, the `eject`
    script, and unused `App.css` rules for a UI that doesn't exist yet.
19. **No CI, no linting in CI, no deploy config** — no GitHub Actions, Docker, or hosting config.
20. **`.gitignore` is incomplete** — it ignores some env files but not `.env`, `*.local` broadly,
    IDE folders (`.vscode`, `.idea`), or `npm-debug.log` variants. `.DS_Store` files are actually
    committed to the repo.
21. **`uuid` v14 pulled in as a runtime dependency** — a small polyfill-free alternative such as
    `crypto.randomUUID()` is available in all supported browsers, removing a dependency.

### UX / accessibility

22. **No loading or connection state** — nothing indicates connecting, connected, or disconnected.
23. **No copy-to-clipboard for the room ID** — the main sharing affordance is manual copy/paste.
24. **No responsive or mobile handling** — the layout is untested at small widths.
25. **No accessibility passes** — form inputs have no `<label>` (only `id` and `placeholder`),
    buttons lack `aria-label`s, and focus styles/contrast aren't verified.
26. **No error boundary** — any render-time crash blanks the whole app.

---

## Roadmap

- [ ] Fix the `joinRoom` control-flow bug and wire up navigation
- [ ] Migrate from CRA to Vite
- [ ] Add a Node websocket server with room create/join
- [ ] Integrate a code editor (CodeMirror 6 or Monaco) with syntax highlighting
- [ ] Implement OT or CRDT-based sync with presence/participant list
- [ ] Mount `<Toaster />` and add real feedback/error states
- [ ] Add the missing logo asset
- [ ] Replace the boilerplate test with real tests; add CI

---

## License

MIT