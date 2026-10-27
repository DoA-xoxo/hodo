# Noël Ticket Studio — The Nutcracker

A browser-based ticket editor built with Next.js, React, TypeScript and SVG. No image editing API or upload server is used; imported portraits stay in the browser and are embedded as a local data URL in the design.

## Requirements
- Node.js 20.9+ (Node 22 recommended)
- npm

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Production build
```bash
npm run lint
npm run build
npm start
```

## Deploy to Vercel
1. Push this directory to a GitHub repository.
2. Import the repository in Vercel.
3. Keep the framework preset as Next.js and use the default build command (`npm run build`).
4. No environment variables are required.

## Included features
- 1:1 SVG artwork canvas and 1600×1600 PNG export in the browser
- Stamp-edge ticket shape, double border, antique medallion, Nutcracker and Christmas SVG ornaments
- Layer selection, drag, scale/rotate handles, layer ordering, add/delete, undo/redo
- Photo upload, ellipse clipping mask, pan/zoom/reset/replace/remove
- Editable title and ticket-holder text, font/size/position/rotation/spacing/alignment
- Independent colors and six palettes, canvas background and transparent PNG option
- Final artwork preview without editor controls

## Notes
- Fonts use local/system font fallbacks so the app still works when external web fonts cannot be reached. The UI imports a few Google Fonts for its own presentation, but the ticket export uses selected font stacks and does not require an API key.
- The project has no server routes, database, or cloud image storage. Design state is held in the current browser tab; refreshing resets to the default template.
