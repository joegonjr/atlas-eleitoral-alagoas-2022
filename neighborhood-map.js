'use strict';
let mapCityKey='',cityMapMode='bairros',pickedLocations=[],refreshCityClusters=null;
// Município e bairros compartilham os mesmos limites e a mesma transformação.
function cityMapBounds(){const id=data.cities[state.city].ibge;return mapBounds([...geo.features.filter(f=>f.properties.codarea===id),...neighborhoodGeo.features.filter(f=>f.properties.CD_MUN===id)]);}
function cityMapLayout(){const b=cityMapBounds(),w=$('#map-chart').clientWidth,h=$('#map-chart').clientHeight,aspect=Math.cos((b[1]+b[3])/2*Math.PI/180),ratio=(b[2]-b[0])*aspect/(b[3]-b[1]);return {boundingCoords:[[b[0],b[3]],[b[2],b[1]]],layoutCenter:['50%','50%'],layoutSize:.82*(ratio>=1?Math.min(w-42,(h-36)*ratio):Math.min(h-36,(w-42)/ratio)),aspectScale:aspect};}
function renderCityMap(){
 const city=data.cities[state.city],municipality=geo.features.find(f=>f.properties.codarea===city.ibge),areas=neighborhoodGeo.features.filter(f=>f.properties.CD_MUN===city.ibge),b=cityMapBounds();
 const rows=data.sections.filter(s=>s.turn===state.turn&&s.city===state.city),by={};for(const s of rows)(by[s.neighborhood]??=[]).push(s);
 const stats=Object.fromEntries(Object.entries(by).map(([k,v])=>[k,aggregate(v)]));
 const winner=id=>{const a=stats[id];return a?.ranking.length&&a.ranking.filter(x=>x[1]===a.ranking[0][1]).length===1?a.ranking[0][0]:null;};
 const fill=id=>voteHeat(stats[id]);
 // Contexto municipal no mesmo sistema geográfico dos bairros, preservado no zoom.
 const municipalRows={};for(const row of data.sections)if(row.turn===state.turn)(municipalRows[row.city]??=[]).push(row);
 const municipalStats=Object.fromEntries(Object.entries(municipalRows).map(([id,rs])=>[id,aggregate(rs)]));
 const cityByRegion=Object.fromEntries(Object.entries(data.cities).map(([id,c])=>['city:'+c.ibge,id]));
 const municipalWinner=id=>{const a=municipalStats[id];return a?.valid&&a.ranking[0]?.[1]!==a.ranking[1]?.[1]?a.ranking[0][0]:null;};
 const municipalColor=id=>voteHeat(municipalStats[id]);
 const translucent=(hex,alpha)=>`rgba(${[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(',')},${alpha})`;
 const municipalFeatures=[...geo.features.filter(f=>f.properties.codarea!==city.ibge),municipality];
 const shape={type:'FeatureCollection',features:[...municipalFeatures.map(f=>({...f,properties:{name:'city:'+f.properties.codarea}})),...areas.map(f=>({...f,properties:{...f.properties,name:f.properties.CD_BAIRRO}}))]};
 const key='neighborhoods-'+state.city;echarts.registerMap(key,shape);
 $('.map-panel h2').textContent='O voto por bairro';$('#map-metric').hidden=true;$('#zone-map-mode').hidden=false;$('#zone-map-mode').textContent='Cor por vencedor';
 $('.map-tools > span').textContent=title(city.name)+' · '+(areas.length?'clique em um bairro':'malha de bairros indisponível');
 $('#neighborhood-section').hidden=false;$('#neighborhood-context').textContent=title(city.name)+' · '+state.turn+'º turno';
 const regions=[...municipalFeatures.map(f=>{
  const name='city:'+f.properties.codarea,id=cityByRegion[name],focused=id===state.city,color=municipalColor(id);
  const itemStyle={areaColor:translucent(color,focused?.28:.13),borderColor:translucent(color,focused?.8:.32),borderWidth:focused?1.5:.7};
  const label={show:true,formatter:()=>title(data.cities[id].name),color:focused?'#173544':'#627c79',fontSize:focused?12:9,fontWeight:focused?700:400,textBorderColor:'#fff',textBorderWidth:3,backgroundColor:focused?'rgba(255,255,255,.9)':'transparent',padding:focused?[4,6]:0,borderRadius:4};
  return {name,itemStyle,label,emphasis:{label,itemStyle:{...itemStyle,areaColor:translucent(color,focused?.34:.23)}},select:{itemStyle,label}};
 }),...areas.map(f=>({name:f.properties.CD_BAIRRO,selected:state.neighborhood===f.properties.CD_BAIRRO,itemStyle:{areaColor:fill(f.properties.CD_BAIRRO),opacity:state.neighborhood&&state.neighborhood!==f.properties.CD_BAIRRO?.4:1},select:{itemStyle:{areaColor:fill(f.properties.CD_BAIRRO),borderColor:'#173e43',borderWidth:2.5}}}))];
 const tooltip=p=>{const id=p.name;if(cityByRegion[id]){const c=cityByRegion[id],a=municipalStats[c],win=municipalWinner(c);return `<b>${esc(title(data.cities[c].name))}</b><br>${win?esc(names[win])+' · '+pct(percent(a.votes[win],a.valid)):'Empate ou sem votos'}<br>Vantagem: ${decimal.format(voteMargin(a))} p.p.<br>${fmt(a?.valid||0)} votos válidos<br><small>Resultado municipal${c!==state.city?' · clique para explorar':''}</small>`;}if(!data.neighborhoods[state.city][id])return '';const a=stats[id],label=data.neighborhoods[state.city][id].name;return `<b>${esc(label)}</b>`+(a?.valid?`<br>${winner(id)?esc(names[winner(id)]):'Empate'} · ${pct(percent(a.ranking[0][1],a.valid))}<br>Vantagem: ${decimal.format(voteMargin(a))} p.p.<br>${fmt(a.valid)} votos válidos<br>${fmt(a.count)} seções com boletim`:'<br>Sem votos vinculados a este bairro')+'<br><small>Votos nos locais do bairro</small>';};
 const chart=setChart('map-chart',{tooltip:{...chartBase.tooltip,formatter:tooltip},geo:{map:key,...cityMapLayout(),zoom:mapView.zoom,center:mapView.center||[(b[0]+b[2])/2,(b[1]+b[3])/2],roam:false,scaleLimit:{min:1,max:10},selectedMode:'single',regions,itemStyle:{borderColor:'#fff',borderWidth:1},label:{show:false},emphasis:{label:{show:true,formatter:p=>cityByRegion[p.name]?title(data.cities[cityByRegion[p.name]].name):data.neighborhoods[state.city][p.name]?.name||'',color:'#173544',fontSize:10,textBorderColor:'#fff',textBorderWidth:3},itemStyle:{borderColor:'#173e43',borderWidth:2}},select:{label:{show:true,formatter:p=>cityByRegion[p.name]?title(data.cities[cityByRegion[p.name]].name):data.neighborhoods[state.city][p.name]?.name||'',color:'#173544',fontSize:10,textBorderColor:'#fff',textBorderWidth:3}}},series:[]});
 chart.off('click');chart.on('click',p=>{if(cityByRegion[p.name]){if(cityByRegion[p.name]!==state.city)navigate({city:cityByRegion[p.name],neighborhood:'',section:''});return;}if(p.name&&data.neighborhoods[state.city][p.name])navigate({neighborhood:p.name,section:''});});
 chart.off('georoam');chart.on('georoam',()=>{const g=chart.getOption().geo[0];mapView={zoom:g.zoom,center:g.center};updateMapControls();});updateMapControls();
 const active=state.neighborhood;
 $('#map-clear').hidden=false;$('#map-clear').onclick=()=>navigate({city:'',neighborhood:'',section:''});
 const winners=[...new Set([...Object.keys(municipalStats).map(municipalWinner),...areas.map(f=>winner(f.properties.CD_BAIRRO))].filter(Boolean))];
 $('#map-legend').innerHTML=winners.map(n=>`<span><i class="legend-dot" style="background:${colors[n]}"></i>${esc(names[n])}</span>`).join('')+'<span><i class="legend-dot" style="background:#e1e7e5"></i>Sem votos vinculados</span><span class="map-context-key">Entorno esmaecido · bairros em primeiro plano</span>'+(areas.some(f=>stats[f.properties.CD_BAIRRO]?.valid&&!winner(f.properties.CD_BAIRRO))?'<span>Empate</span>':'')+heatLegend();$('#map-legend').onclick=null;
 $('.map-foot span:first-child').textContent='MUNICÍPIOS E BAIRROS · IBGE 2022';$('.map-foot span:last-child').textContent='IBGE / Alagoas em Dados';
 $('#map-location-detail').hidden=true;
 if(active){const list=selected(),locations=new Map();for(const s of list){const key=s.zone+'|'+s.local;if(!locations.has(key))locations.set(key,{name:s.place,sections:[]});locations.get(key).sections.push(s);}
 const box=$('#map-location-detail');box.hidden=false;box.innerHTML=`<div class="field-label">LOCAIS E SEÇÕES DO BAIRRO · ${locations.size} LOCAIS</div>`+[...locations.values()].map(l=>`<div class="location-entry"><strong>${esc(title(l.name||'Local não informado'))}</strong><div class="location-sections">${l.sections.sort((a,b)=>a.section-b.section).map(s=>`<button data-section="${s.id}" class="${state.section===s.id?'selected':''}">Seção ${s.section}</button>`).join('')}</div></div>`).join('');box.onclick=e=>{const button=e.target.closest('[data-section]');if(button)navigate({section:button.dataset.section});};}
}
