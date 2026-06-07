import { createReadStream, existsSync, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, normalize } from 'node:path';

const host = '0.0.0.0';
const port = 4173;
const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, 'dist');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

const server = createServer(async (req, res) => {
  const url = req.url ?? '/';
  const pathname = url.split('?')[0];
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(root, safePath.replace(/^[/\\]+/, ''));

  const shouldServeIndex =
    safePath === '/' ||
    safePath === '\\' ||
    !existsSync(filePath) ||
    statSync(filePath).isDirectory();

  if (shouldServeIndex) {
    filePath = join(root, 'index.html');
  }

  try {
    const extension = extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': contentTypes[extension] ?? 'application/octet-stream',
      'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=3600',
    });

    if (extension === '.html') {
      res.end(await readFile(filePath));
      return;
    }

    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(port, host, () => {
  console.log(`Static server running at http://127.0.0.1:${port}`);
});
