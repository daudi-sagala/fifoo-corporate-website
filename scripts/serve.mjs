/* Local preview only. Deploy site/ to a static host; do not use this as a production server. */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.resolve(root, process.env.SITE_DIR || 'site');
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535.');
const config = JSON.parse(await fs.readFile(path.join(directory,'staticwebapp.config.json'),'utf8'));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.json':'application/json; charset=utf-8'};
const server = http.createServer(async(req,res)=>{
 try {
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405,{'Allow':'GET, HEAD'});res.end();return;}
  const url = new URL(req.url,'http://localhost');
  let pathname = decodeURIComponent(url.pathname);
  const file = path.resolve(directory,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  if (file!==directory && !file.startsWith(directory+path.sep)) {res.writeHead(403);res.end('Forbidden');return;}
  let body;let status=200;let ext=path.extname(file);
  try {body=await fs.readFile(file);} catch(error) {
   if (!['ENOENT','EISDIR','ENOTDIR'].includes(error.code)) throw error;
   body=await fs.readFile(path.join(directory,'404.html'));status=404;ext='.html';
  }
  res.writeHead(status,{...config.globalHeaders,'Content-Type':types[ext]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(req.method==='HEAD'?undefined:body);
 } catch {res.writeHead(400,{'Content-Type':'text/plain; charset=utf-8'});res.end('Unable to serve request.');}
});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Local preview: http://127.0.0.1:${port}`));
