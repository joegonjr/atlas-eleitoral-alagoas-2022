'use strict';
// Combobox compartilhado pelos três níveis territoriais.
class SearchSelect {
 constructor({id,label,all,placeholder,onChange}) {
  this.id=id;this.all=all;this.onChange=onChange;this.options=[];this.value='';this.active=-1;this.opened=false;
  this.root=document.querySelector(`[data-filter="${id}"]`);
  this.root.innerHTML=`<label class="field-label" id="${id}-label" for="${id}">${label}</label><div class="search-select-control"><span class="search-select-icon" aria-hidden="true">⌕</span><input id="${id}" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-list" autocomplete="off" spellcheck="false" placeholder="${placeholder}"><button class="search-select-clear" type="button" aria-label="Limpar ${label.toLowerCase()}" hidden>×</button><button class="search-select-toggle" type="button" aria-label="Abrir lista de ${label.toLowerCase()}" tabindex="-1">⌄</button></div><div class="search-select-popup" hidden><div class="search-select-heading"><span>Digite para pesquisar</span><span class="search-select-count" role="status" aria-live="polite"></span></div><div id="${id}-list" class="search-select-list" role="listbox" aria-labelledby="${id}-label"></div><div class="search-select-footer"><span>↑ ↓ navegar</span><span>Enter selecionar</span></div></div>`;
  this.input=this.root.querySelector('input');this.popup=this.root.querySelector('.search-select-popup');this.list=this.root.querySelector('[role="listbox"]');this.clear=this.root.querySelector('.search-select-clear');this.toggle=this.root.querySelector('.search-select-toggle');
  this.input.addEventListener('focus',()=>{this.show();this.input.select()});
  this.input.addEventListener('click',()=>{if(!this.opened)this.show()});
  this.input.addEventListener('input',()=>{this.show(this.input.value);});
  this.input.addEventListener('keydown',e=>this.keydown(e));
  this.input.addEventListener('blur',()=>{if(!this.opened)return;const exact=this.options.find(o=>this.normalize(o.label)===this.normalize(this.input.value));if(exact&&exact.value!==this.value)this.choose(exact.value);else this.close();});
  this.toggle.addEventListener('mousedown',e=>e.preventDefault());
  this.toggle.addEventListener('click',()=>{if(this.opened)this.close();else{this.input.focus();this.show();}});
  this.clear.addEventListener('mousedown',e=>e.preventDefault());this.clear.addEventListener('click',()=>this.choose(''));
  this.list.addEventListener('mousedown',e=>e.preventDefault());
  this.list.addEventListener('click',e=>{const option=e.target.closest('[role="option"]');if(option)this.choose(this.visible[+option.dataset.index].value);});
  document.addEventListener('pointerdown',e=>{if(this.opened&&!this.root.contains(e.target))this.close();});
 }
 normalize(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}
 escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 update(options,value,disabled=false,hint='') {
  this.options=options;this.value=value;this.input.disabled=disabled;this.toggle.disabled=disabled;this.root.classList.toggle('is-disabled',disabled);this.root.title=disabled?hint:'';this.input.placeholder=disabled?hint:this.all;this.clear.hidden=!value;this.close();
 }
 show(query='') {
  if(this.input.disabled)return;
  this.opened=true;this.popup.hidden=false;this.input.setAttribute('aria-expanded','true');this.root.classList.add('is-open');
  const q=this.normalize(query),matches=this.options.filter(o=>q.split(/\s+/).every(word=>this.normalize(o.label+' '+(o.detail||'')+' '+o.value).includes(word)));
  if(/^\d+$/.test(q))matches.sort((a,b)=>(+b.value===+q)-(+a.value===+q));
  this.visible=[...(!q?[{value:'',label:this.all,detail:'Sem restrição neste nível'}]:[]),...matches];
  this.active=q?(this.visible.length?0:-1):this.visible.findIndex(o=>o.value===this.value);
  this.root.querySelector('.search-select-count').textContent=`${matches.length} ${matches.length===1?'opção':'opções'}`;
  this.list.innerHTML=this.visible.length?this.visible.map((o,i)=>`<div role="option" id="${this.id}-option-${i}" data-index="${i}" aria-selected="${o.value===this.value}" class="search-select-option${o.value===this.value?' is-selected':''}"><div><span>${this.escape(o.label)}</span><small>${this.escape(o.detail||'')}</small></div><span class="option-check" aria-hidden="true">${o.value===this.value?'✓':''}</span></div>`).join(''):'<div class="search-select-empty">Nenhum resultado encontrado.<small>Tente outro nome ou número.</small></div>';
  this.highlight();
 }
 highlight(){this.list.querySelectorAll('[role="option"]').forEach((el,i)=>el.classList.toggle('is-active',i===this.active));const el=this.list.children[this.active];if(el&&this.active>=0){this.input.setAttribute('aria-activedescendant',el.id);el.scrollIntoView({block:'nearest'});}else this.input.removeAttribute('aria-activedescendant');}
 close(){this.opened=false;this.popup.hidden=true;this.input.setAttribute('aria-expanded','false');this.input.removeAttribute('aria-activedescendant');this.root.classList.remove('is-open');this.input.value=this.options.find(o=>o.value===this.value)?.label||'';}
 choose(value){this.value=value;this.close();this.onChange(value);}
 keydown(e){
  if(e.key==='Escape'){e.preventDefault();this.close();return;}
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();if(!this.opened){this.show();return;}this.active=Math.max(0,Math.min(this.visible.length-1,this.active+(e.key==='ArrowDown'?1:-1)));this.highlight();}
  if(e.key==='Enter'&&this.opened){e.preventDefault();if(this.visible[this.active])this.choose(this.visible[this.active].value);}
  if(e.key==='Tab'&&this.opened){const exact=this.options.find(o=>this.normalize(o.label)===this.normalize(this.input.value));if(exact)this.choose(exact.value);else this.close();}
 }
}
window.SearchSelect=SearchSelect;
