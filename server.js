const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'tg-app');
const PORT = 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
};

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, urlPath);
  const ext = path.extname(filePath);
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain', 'Access-Control-Allow-Origin': '*' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}).listen(PORT, () => {
  console.log('Сервер запущен!');
  console.log('');
  console.log('Кабинет Ольги:   http://localhost:3000/index.html?student=olga');
  console.log('Панель педагога: http://localhost:3000/teacher.html');
  console.log('');
  console.log('Не закрывай это окно.');
});
