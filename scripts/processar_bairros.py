"""Associa seções ao bairro cadastrado do local; não infere residência do eleitor."""
import json,unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(p):return json.loads((ROOT/p).read_text(encoding='utf-8'))
def norm(s):return ''.join(c for c in unicodedata.normalize('NFD',s.strip().upper()) if unicodedata.category(c)!='Mn')
d=read('dados/painel.json');loc=read('dados/locais-votacao.json')['locations'];geo=read('dados/bairros-ibge.geojson')
lookup={(f['properties']['CD_MUN'],norm(f['properties']['NM_BAIRRO'])):f['properties'] for f in geo['features']}
aliases={'BENEDITO BENTES I':'BENEDITO BENTES','BENEDITO BENTES II':'BENEDITO BENTES','CLIMA BOM I':'CLIMA BOM','CLIMA BOM II':'CLIMA BOM','TABULEIRO DO MARTINS':'TABULEIRO DO MARTINS'}
neighborhoods={};bylocal={};audit={'aliases':{},'unmappedNames':{},'withoutLocal':0}
for l in loc:
    city=l['city'];raw=l['neighborhood'].strip();name=norm(raw)
    if city=='27855' and name in aliases:
        name=aliases[name];audit['aliases'][raw]=name
    p=lookup.get((d['cities'][city]['ibge'],name))
    if p:nid=p['CD_BAIRRO'];label=p['NM_BAIRRO']
    else:nid='cadastro:'+name;label=raw.title() if raw and not raw.startswith('#') else 'Bairro não informado';audit['unmappedNames'][city+'|'+raw]=label
    neighborhoods.setdefault(city,{})[nid]={'name':label,'mapped':bool(p)}
    bylocal[(l['turn'],city,l['zone'],l['local'])]=nid
for s in d['sections']:
    k=(s['turn'],s['city'],s['zone'],s['local']);nid=bylocal.get(k,'sem-bairro')
    if nid=='sem-bairro':audit['withoutLocal']+=1;neighborhoods.setdefault(s['city'],{})[nid]={'name':'Bairro não identificado','mapped':False}
    s['neighborhood']=nid;s['id']=s['zone']+'-'+s['section']
for f in geo['features']:
    city=next((k for k,v in d['cities'].items() if v['ibge']==f['properties']['CD_MUN']),None)
    if city:neighborhoods.setdefault(city,{})[f['properties']['CD_BAIRRO']]={'name':f['properties']['NM_BAIRRO'],'mapped':True}
d['neighborhoods']=neighborhoods
(ROOT/'dados/painel-bairros.json').write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(ROOT/'dados/auditoria-bairros.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
print('Seções',len(d['sections']),'sem vínculo local',audit['withoutLocal'],'malha',len(geo['features']))
