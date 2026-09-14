import {mkdir,copyFile,writeFile,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=['index.html','styles.css','app.js','filters.js','neighborhood-map.js','section-grid.js','vendor/echarts.min.js','vendor/ECHARTS-LICENSE.txt','dados/painel-bairros.json','dados/alagoas.geojson','dados/bairros-ibge.geojson','dados/censo-raca.json','dados/locais-votacao.json','dados/auditoria.json','dados/auditoria-bairros.json'];
let size=0;
for(const file of files){const dest=path.join(root,'_site',file);await mkdir(path.dirname(dest),{recursive:true});await copyFile(path.join(root,file),dest);size+=(await stat(dest)).size;}
await writeFile(path.join(root,'_site','.nojekyll'),'');
const html=await readFile(path.join(root,'index.html'),'utf8');
for(const [,ref]of html.matchAll(/(?:src|href)="([^"]+)"/g)){if(/^(?:https?:|#|mailto:)/.test(ref))continue;if(!files.includes(ref))throw Error('Referência não publicada: '+ref);}
const data=JSON.parse(await readFile(path.join(root,'dados/painel-bairros.json'),'utf8'));
if(Object.keys(data.cities).length!==102||data.sections.length!==13252)throw Error('Cobertura de dados inesperada');
const audit=JSON.parse(await readFile(path.join(root,'dados/auditoria.json'),'utf8'));
if(audit.voteDifferences.length)throw Error('Divergências de votos');
console.log(`${files.length} arquivos preparados em _site/ · ${(size/1e6).toFixed(2)} MB · referências e conciliação verificadas.`);
