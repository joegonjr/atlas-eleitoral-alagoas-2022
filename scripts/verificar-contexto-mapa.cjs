const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/?turn=2&city=27057');await page.waitForFunction(()=>window.atlas);
 for(const turn of [2,1]){
  await page.locator(`[data-turn="${turn}"]`).click();
  const checks=await page.evaluate(()=>{const option=echarts.getInstanceByDom(document.querySelector('#map-chart')).getOption().geo[0];return option.regions.filter(r=>r.name.startsWith('city:')).map(r=>{const id=Object.keys(atlas.data.cities).find(id=>'city:'+atlas.data.cities[id].ibge===r.name);const a=atlas.aggregate(atlas.data.sections.filter(s=>s.turn===atlas.state.turn&&s.city===id));return {id,fill:r.itemStyle.areaColor,winner:a.ranking[0][0]};});});
  assert.equal(checks.length,102);const colors={'15':[23,139,130],'44':[223,153,99],'14':[108,130,154],'55':[103,141,180]};
  for(const r of checks)assert.equal(r.fill,`rgba(${colors[r.winner].join(',')},${r.id==='27057'?.28:.13})`);
 }
 await page.locator('[data-turn="2"]').click();await page.locator('.map-panel').screenshot({path:'dados/mapa-contexto-desktop.png'});
 // Localiza um município de contexto por hit test real do renderizador e clica nele.
 const target=await page.evaluate(()=>{const c=echarts.getInstanceByDom(document.querySelector('#map-chart')),zr=c.getZr();for(let y=25;y<c.getHeight()-25;y+=15)for(let x=25;x<c.getWidth()-25;x+=15){const el=zr.handler.findHover(x,y).target;let p=el;while(p){for(const key of Object.keys(p)){const meta=p[key];if(key.startsWith('__ec')&&meta?.eventData?.name?.startsWith('city:')&&meta.eventData.name!=='city:'+atlas.data.cities[atlas.state.city].ibge)return {x,y,name:meta.eventData.name};}p=p.parent;}}return null;});
 assert(target,'Município vizinho deve estar visível e interativo');const box=await page.locator('#map-chart').boundingBox();await page.mouse.click(box.x+target.x,box.y+target.y);await page.waitForFunction(name=>'city:'+atlas.data.cities[atlas.state.city].ibge===name,target.name);
 assert.equal(await page.evaluate(()=>atlas.state.neighborhood),'');await page.locator('#map-clear').click();assert.equal(await page.evaluate(()=>atlas.state.city),'');assert.deepEqual(errors,[]);
 console.log('Contexto municipal: cores dos 102 municípios nos dois turnos, foco, transparências, clique real no entorno e retorno ao estado OK.');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
