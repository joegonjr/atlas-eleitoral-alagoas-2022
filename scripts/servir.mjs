import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json','.txt':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}const ext=path.extname(target);if(!types[ext]||target.includes(path.sep+'brutos'+path.sep)){res.writeHead(404);res.end();return;}const content=await readFile(target);res.writeHead(200,{'Content-Type':types[ext],'Cache-Control':'no-cache'});res.end(content);}catch{res.writeHead(404);res.end('Arquivo não encontrado');}}).listen(4173,'127.0.0.1',()=>console.log('Atlas eleitoral: http://127.0.0.1:4173'));
