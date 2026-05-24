import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const host = '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const root = fileURLToPath(new URL('..', import.meta.url));

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const resolveFilePath = (requestUrl = '/') => {
  const url = new URL(requestUrl, `http://${host}:${port}`);
  const pathname = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const absolutePath = path.resolve(root, `.${pathname}`);
  const relativePath = path.relative(root, absolutePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return null;
  }

  return absolutePath;
};

const server = http.createServer(async (request, response) => {
  const filePath = resolveFilePath(request.url);

  if (!filePath) {
    response.writeHead(403, {
      'Content-Type': 'text/plain; charset=utf-8',
    });
    response.end('Forbidden');
    return;
  }

  try {
    const content = await readFile(filePath);
    const extension = path.extname(filePath);

    response.writeHead(200, {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
    });
    response.end(content);
  } catch {
    response.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
    });
    response.end('Not Found');
  }
});

server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
