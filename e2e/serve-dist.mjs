// Static server for the web export with an index.html SPA fallback. The web
// export is `output: 'single'` (one dist/index.html + client-side expo-router),
// so any client route (/launch, /disclaimer, /gate) must be served index.html —
// a plain static server 404s them. Zero deps (no runtime `npx serve` fetch), so
// the e2e webServer is deterministic in CI.
//   node e2e/serve-dist.mjs <root=dist> <port=8080>
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = process.argv[2] ?? 'dist';
const PORT = Number(process.argv[3] ?? 8080);
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.ico': 'image/x-icon', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.map': 'application/json',
};

const index = () => readFile(join(ROOT, 'index.html'));

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://x');
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const candidates = [join(ROOT, rel)];
  if (extname(rel) === '') candidates.push(join(ROOT, 'index.html')); // SPA fallback
  for (const p of candidates) {
    try {
      const buf = await readFile(p);
      res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' });
      return res.end(buf);
    } catch {
      /* try next */
    }
  }
  res.writeHead(200, { 'content-type': 'text/html' });
  res.end(await index());
}).listen(PORT, () => console.log(`e2e static server on http://localhost:${PORT} (root=${ROOT})`));
