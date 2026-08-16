# MAGA Defense: The Tremendous Tower

Satirical client-side 2D tower defense. No backends, no paid APIs, no runtime asset generation — canvas, SVG, CSS, and a Web Audio synthesizer.

## Play locally

```bash
npm install
npm run dev
```

## Build for GitHub Pages

```bash
npm run build
```

The Vite `base` is `./`, so the `dist/` folder can be published as a project site.

In the repo settings, set Pages to deploy from GitHub Actions or from `/docs` after copying `dist`.

A one-shot Pages workflow:

```yaml
name: pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.d.outputs.page_url }}
    steps:
      - id: d
        uses: actions/deploy-pages@v4
```

## Controls

- Tap / click a tower card, then tap grass to place (on phones: first tap previews range, second tap confirms)
- `1–4` select towers
- `Space` send next wave
- `S` sell selected tower
- `Esc` pause
