'use strict';
let sectionGridScope='',sectionPreview,sectionPreviewCard=null,sectionPreviewPinned=false,sectionPreviewTimer,sectionScrollUntil=0;
function closeSectionPreview(){clearTimeout(sectionPreviewTimer);if(sectionPreview)sectionPreview.hidden=true;if(sectionPreviewCard)sectionPreviewCard.removeAttribute('aria-describedby');sectionPreviewCard=null;sectionPreviewPinned=false;}
// Consome apenas a distância disponível na lista e passa o restante à página.
// Também cobre eventos sobre a prévia, que fica fora do grid no DOM.
function scrollSectionResults(event){
 if(event.ctrlKey||event.shiftKey||!event.deltaY||Math.abs(event.deltaX)>Math.abs(event.deltaY))return;
 const grid=$('#section-results-grid');if(!grid||$('#neighborhood-section').hidden)return;
 const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?grid.clientHeight:1);
 sectionScrollUntil=performance.now()+300;closeSectionPreview();
 event.preventDefault();
 const before=grid.scrollTop,max=Math.max(0,grid.scrollHeight-grid.clientHeight);
 grid.scrollTop=Math.max(0,Math.min(max,before+delta));
 const remainder=delta-(grid.scrollTop-before);
 if(Math.abs(remainder)>.5)window.scrollBy({top:remainder,left:0,behavior:'instant'});
}
function initSectionPreview(){
 if(sectionPreview)return;
 sectionPreview=document.createElement('div');sectionPreview.id='section-preview';sectionPreview.className='section-preview';sectionPreview.hidden=true;sectionPreview.setAttribute('role','dialog');sectionPreview.setAttribute('aria-label','Resultado da seção');document.body.append(sectionPreview);
 sectionPreview.addEventListener('wheel',scrollSectionResults,{passive:false});
 $('#section-results-grid').addEventListener('wheel',scrollSectionResults,{passive:false});
 sectionPreview.onpointerenter=()=>clearTimeout(sectionPreviewTimer);
 sectionPreview.onpointerleave=()=>{if(!sectionPreviewPinned)sectionPreviewTimer=setTimeout(closeSectionPreview,180);};
 sectionPreview.onfocusin=()=>clearTimeout(sectionPreviewTimer);
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.section-tile, #section-preview'))closeSectionPreview();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){const card=sectionPreviewCard;closeSectionPreview();if(sectionPreview.contains(document.activeElement))card?.focus();closeSectionPreview();}});
 window.addEventListener('resize',closeSectionPreview);
 window.addEventListener('scroll',e=>{if(sectionPreviewCard&&!sectionPreview.contains(e.target))positionSectionPreview();},true);
}
function showSectionPreview(card,s,pinned=false){
 clearTimeout(sectionPreviewTimer);if(sectionPreviewCard&&sectionPreviewCard!==card)sectionPreviewCard.removeAttribute('aria-describedby');sectionPreviewCard=card;sectionPreviewPinned=pinned;
 const a=aggregate([s]),total=Object.values(s.votes).reduce((sum,n)=>sum+n,0),tied=a.ranking.length>1&&a.ranking[0][1]===a.ranking[1][1];
 const candidateLine=i=>{const result=a.ranking[i];if(!result)return '<div class="section-candidate empty">Sem '+(i+1)+'º candidato</div>';const [id,votes]=result;return `<div class="section-candidate" style="--candidate:${colors[id]||'#88939d'}"><span class="section-candidate-name"><i></i><span><small>${tied?'Empate':(i+1)+'º'}</small>${esc(names[id]||data.candidates[id].name)}</span></span><b>${fmt(votes)} <small>votos</small></b><strong>${pct(percent(votes,a.valid))}</strong></div>`;};
 sectionPreview.innerHTML=`<div class="section-preview-heading"><strong>Zona ${esc(String(s.zone).padStart(2,'0'))} · Seção ${esc(s.section.padStart(4,'0'))}</strong><button aria-label="Fechar resultado da seção" class="section-preview-close">×</button></div><p>${esc(title(s.place||'Local não informado'))}<small>${esc(data.neighborhoods[s.city][s.neighborhood]?.name||'Bairro não identificado')} · ${state.turn}º turno</small></p>${candidateLine(0)}${candidateLine(1)}<div class="section-total"><span>Votos totais da seção</span><strong>${fmt(total)}</strong></div><small class="section-preview-note">% dos votos válidos · total inclui brancos e nulos</small><button class="section-preview-detail">Detalhar seção ↗</button>`;
 sectionPreview.querySelector('.section-preview-close').onclick=closeSectionPreview;
 sectionPreview.querySelector('.section-preview-detail').onclick=()=>{closeSectionPreview();navigate({neighborhood:s.neighborhood,section:s.id});};
 sectionPreview.hidden=false;card.setAttribute('aria-describedby','section-preview');
 positionSectionPreview();
}
function positionSectionPreview(){
 if(!sectionPreviewCard)return;
 const r=sectionPreviewCard.getBoundingClientRect(),g=$('#section-results-grid').getBoundingClientRect(),w=sectionPreview.offsetWidth,h=sectionPreview.offsetHeight;
 if(r.bottom<Math.max(0,g.top)||r.top>Math.min(innerHeight,g.bottom)){closeSectionPreview();return;}
 sectionPreview.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+'px';
 sectionPreview.style.top=Math.max(8,Math.min(innerHeight-h-8,r.bottom+h+10<innerHeight?r.bottom+8:r.top-h-8))+'px';
}
function renderSectionGrid(){
 initSectionPreview();closeSectionPreview();
 const panel=$('#neighborhood-section');panel.hidden=!state.city;if(!state.city){sectionGridScope='';return;}
 const scope=[state.turn,state.city,state.neighborhood,state.section].join('|'),input=$('#section-grid-search'),grid=$('#section-results-grid');
 if(scope!==sectionGridScope){input.value='';grid.scrollTop=0;sectionGridScope=scope;}
 $('#neighborhood-context').textContent=[title(data.cities[state.city].name),state.neighborhood?data.neighborhoods[state.city][state.neighborhood].name:'Todos os bairros',state.turn+'º turno'].join(' · ');
 const neighborhoodName=s=>data.neighborhoods[s.city][s.neighborhood]?.name||'Bairro não identificado';
 const rows=selected().sort((a,b)=>(a.neighborhood==='sem-bairro')-(b.neighborhood==='sem-bairro')||neighborhoodName(a).localeCompare(neighborhoodName(b),'pt-BR')||Number(a.zone)-Number(b.zone)||Number(a.section)-Number(b.section)),query=normalized(input.value);
 const visible=rows.filter(s=>normalized(['Zona '+String(s.zone).padStart(2,'0'),'Zona '+s.zone,'Seção '+s.section.padStart(4,'0'),s.section,s.place,neighborhoodName(s)].join(' ')).includes(query));
 $('#section-grid-count').textContent=fmt(visible.length)+' de '+fmt(rows.length)+' seções';
 let previousNeighborhood=null;const counts={},byId=new Map(visible.map(s=>[s.id,s]));for(const s of visible)counts[s.neighborhood]=(counts[s.neighborhood]||0)+1;
 grid.innerHTML=visible.length?visible.map(s=>{
  const group=previousNeighborhood!==s.neighborhood?`<h3 class="section-neighborhood-heading">${esc(neighborhoodName(s))}<small>${fmt(counts[s.neighborhood])} seções</small></h3>`:'';previousNeighborhood=s.neighborhood;
  const a=aggregate([s]),tied=a.ranking.length>1&&a.ranking[0][1]===a.ranking[1][1],winnerColor=!tied&&a.valid?colors[a.ranking[0]?.[0]]||'#88939d':'#88939d';
  const fill=!tied&&a.valid?({'15':'#11766d','44':'#a45420'}[a.ranking[0]?.[0]]||'#'+[1,3,5].map(i=>Math.round(parseInt(winnerColor.slice(i,i+2),16)*.66).toString(16).padStart(2,'0')).join('')):'#586570';
  return `${group}<button class="section-tile${state.section===s.id?' selected':''}" style="--tile-color:${fill}" data-section-id="${esc(s.id)}" aria-haspopup="dialog" aria-label="Zona ${esc(s.zone)}, seção ${esc(s.section)}, ${esc(neighborhoodName(s))}. Ver resultado"><span>Z ${esc(String(s.zone).padStart(2,'0'))}</span><strong>${esc(s.section.padStart(4,'0'))}</strong></button>`;
 }).join(''):'<p class="section-grid-empty">Nenhuma seção encontrada neste recorte.</p>';
 const show=(card,pinned)=>{if(card)showSectionPreview(card,byId.get(card.dataset.sectionId),pinned);};
 input.oninput=()=>{grid.scrollTop=0;renderSectionGrid();};
 grid.onpointerover=e=>{const card=e.target.closest('.section-tile');if(performance.now()>=sectionScrollUntil&&e.pointerType==='mouse'&&card!==sectionPreviewCard)show(card,false);};
 grid.onpointermove=e=>{if(e.movementX||e.movementY)grid.onpointerover(e);};
 grid.onpointerout=e=>{if(!sectionPreviewPinned&&!e.relatedTarget?.closest('.section-tile, #section-preview'))sectionPreviewTimer=setTimeout(closeSectionPreview,180);};
 grid.onfocusin=e=>show(e.target.closest('.section-tile'),false);
 grid.onfocusout=e=>{if(!e.relatedTarget?.closest('.section-tile, #section-preview'))closeSectionPreview();};
 grid.onclick=e=>show(e.target.closest('.section-tile'),true);
}
