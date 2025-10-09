const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname === '/jsonUpdates.asp') {
    // simple simulation: always return 200 OK JSON
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, query: parsed.query }));
    return;
  }
  // serve static files from disk for everything else
  // (very small, naive static file serve)
  const fs = require('fs');
  const path = require('path');
  let filePath = path.join(process.cwd(), parsed.pathname === '/' ? '/row-updater/test.html' : parsed.pathname);
  if (!filePath.startsWith(process.cwd())) {
    res.writeHead(403); return res.end('Forbidden');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200); res.end(data);
  });
});

server.listen(3000, () => console.log('Mock server listening on http://localhost:3000'));