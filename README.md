# Notes App

## File Structure
```
notes-app/
├── index.html              # Shell HTML — edit this for layout/UI changes
├── css/
│   └── app.css             # All styling — edit for design changes
├── js/
│   ├── app.js              # Core: state, providers, nav, mic, streaming API
│   ├── prompts.js          # ✏️  SD + coding prompts — EDIT HERE for prompt changes
│   ├── render.js           # renderSD() + renderCoding() — edit for output UI
│   ├── debate.js           # LLM Debate Arena — full debate engine
│   └── collection.js       # My Collection — COLLECTION_DATA + nav functions
└── collection/
    ├── cms.html            # Count-Min Sketch (original file, unmodified)
    ├── topk.html           # Top-K System Design (original file, unmodified)
    └── ai_handbook.html    # AI Leadership Handbook (original file, unmodified)
```

## Making Changes

| What you want to change | File to edit |
|---|---|
| SD or coding prompt content | `js/prompts.js` |
| How SD results are rendered | `js/render.js` |
| Debate Arena behaviour | `js/debate.js` |
| Add/remove collection items | `js/collection.js` + add HTML to `collection/` |
| Update a collection item | Replace `collection/<name>.html` |
| Styling / colors / fonts | `css/app.css` |
| Homepage layout, new tool buttons | `index.html` |
| API providers, models | `js/app.js` (PROVIDERS config at top) |

## Running Locally

Collection items load via `fetch()` so you need a local server (not `file://`):

```bash
# Option 1 — Python
python3 -m http.server 8080

# Option 2 — Node
npx serve .
```

Then open `http://localhost:8080`

## GitHub Pages

Push to a repo and enable GitHub Pages (Settings → Pages → Deploy from branch → main).
All `fetch()` calls resolve correctly on GitHub Pages.
