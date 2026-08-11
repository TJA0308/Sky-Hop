# Sky Hop

A browser pixel-platformer demo built with **Phaser 3** and **Vite**. Hop across floating sunset sky-islands, stomp Pufflings, collect golden stars, and reach the flag!

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build for production

```bash
npm run build
```

Static files are output to `dist/`. Preview locally with:

```bash
npm run preview
```

## Controls

| Key | Action |
|-----|--------|
| ← → or A D | Move |
| Space / W / ↑ | Jump (hold for higher jump) |
| Enter | Start / continue |
| R | Restart level (after death) |

## Deploy

The game is a static site — deploy the `dist/` folder to any static host.

### GitHub Pages

1. Build: `npm run build`
2. Push `dist/` contents to a `gh-pages` branch, or use GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

3. Enable GitHub Pages from the `gh-pages` branch in repo Settings → Pages.

### Netlify

1. Connect your repo at [netlify.com](https://netlify.com)
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Deploy — Netlify auto-detects Vite projects.

Or drag-and-drop the `dist/` folder into the Netlify dashboard.

### Vercel

1. Import the repo at [vercel.com](https://vercel.com)
2. Framework preset: Vite
3. Deploy — no extra config needed.

## Project structure

```
├── index.html
├── package.json
├── vite.config.js
├── public/assets/tilemaps/   # Level JSON data
├── scripts/generate-levels.mjs
└── src/
    ├── main.js
    ├── scenes/               # Boot, Menu, Game, UI
    ├── entities/             # Player, Puffling
    └── utils/                # Constants, SFX
```

Pixel art sprites and tilesets are generated programmatically at boot time — no external art tools required.

## Regenerate level maps

```bash
node scripts/generate-levels.mjs
```

## License

MIT — demo project, free to use and modify.
