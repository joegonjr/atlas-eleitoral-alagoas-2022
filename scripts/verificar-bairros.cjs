const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/?turn=2&city=27855&zone=54');await page.waitForFunction(()=>window.atlas);
 assert.equal(await page.locator('#zone').count(),0);assert(!(await page.locator('.filters').innerText()).includes('ZONA'));assert(!page.url().includes('zone='));
 assert((await page.locator('#kpis').innerText()).includes('451.971'));
 const result=await page.evaluate(()=>{const rs=atlas.selected(),groups=Object.groupBy(rs,s=>s.neighborhood);return {municipal:atlas.aggregate(rs).valid,byNeighborhood:Object.values(groups).reduce((n,rs)=>n+atlas.aggregate(rs).valid,0)};});assert.equal(result.municipal,result.byNeighborhood);
 await page.locator('#neighborhood').fill('benedito');await page.locator('#neighborhood').press('Enter');assert.equal(await page.locator('#neighborhood').inputValue(),'Benedito Bentes');assert(await page.locator('#section').isEnabled());
 const s=await page.evaluate(()=>atlas.selected()[0]);await page.locator('#section').fill('Seção '+s.section.padStart(4,'0'));await page.locator('#section').press('Enter');assert.equal(await page.evaluate(()=>atlas.selected().length),1);
 await page.reload();await page.waitForFunction(()=>window.atlas);assert.equal(await page.evaluate(()=>atlas.selected().length),1);await page.locator('[data-turn="1"]').click();assert.equal(await page.evaluate(()=>atlas.selected().length),1);
 await page.locator('[data-filter="neighborhood"] .search-select-clear').click();assert(await page.locator('#section').isDisabled());
 await page.locator('#neighborhood').fill('Farol');await page.locator('#neighborhood').press('Enter');await page.locator('#map-focus').click();assert(await page.evaluate(()=>echarts.getInstanceByDom(document.querySelector('#map-chart')).getOption().geo[0].zoom>1));
 await page.locator('#reset').click();await page.locator('#city').fill('Água Branca');await page.locator('#city').press('Enter');assert((await page.locator('#map-selection').innerText()).includes('tabela'));assert(await page.locator('#neighborhood').isEnabled());
 await page.locator('#city').fill('Maceió');await page.locator('#city').press('Enter');await page.locator('[data-turn="2"]').click();
 await page.locator('#table-search').fill('Farol');const downloadPromise=page.waitForEvent('download');await page.locator('#export').click();const download=await downloadPromise;await download.saveAs('dados/bairros-export.csv');
 const csv=await require('node:fs/promises').readFile('dados/bairros-export.csv','utf8');assert(csv.includes('Bairro'));assert(!csv.includes('"Zona"'));assert.equal(csv.trim().split('\r\n').length,2);
 await page.locator('#table-search').fill('');await page.waitForTimeout(300);await page.screenshot({path:'dados/bairros-desktop.png',fullPage:true});
 for(const width of [360,390,430]){await page.setViewportSize({width,height:844});await page.waitForTimeout(150);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#neighborhood').fill('ponta');const box=await page.locator('[data-filter="neighborhood"] .search-select-popup').boundingBox();assert(box.x>=0&&box.x+box.width<=width);await page.locator('#neighborhood').press('Escape');}
 await page.locator('.map-panel').screenshot({path:'dados/bairros-mobile.png'});assert.deepEqual(errors,[]);console.log('Bairros: navegação sem zona, totais preservados, filtros, seção única, URL, turnos, cidade sem malha, CSV e celular OK.');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
