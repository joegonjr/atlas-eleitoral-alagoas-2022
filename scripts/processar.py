"""Consolida BU de governador e perfil cadastral; valida contra votação por seção."""
import csv, io, json, zipfile, re, unicodedata, hashlib
from pathlib import Path
from collections import Counter, defaultdict
from datetime import datetime, timezone
ROOT=Path(__file__).resolve().parents[1]
def rows(file):
    with zipfile.ZipFile(ROOT/'dados/brutos'/file) as z:
        with z.open(next(n for n in z.namelist() if n.endswith('.csv'))) as f:
            yield from csv.DictReader(io.TextIOWrapper(f,encoding='latin1'),delimiter=';')
def norm(s):
    return ''.join(c for c in unicodedata.normalize('NFD',s.upper()) if unicodedata.category(c)!='Mn').replace("'",'').replace('-',' ')
def key(r):return '|'.join(r[x] for x in ['CD_MUNICIPIO','NR_ZONA','NR_SECAO'])
sections={}; candidates={}; cities={}; dates={}; raw_counts={}
for turn in [1,2]:
    count=0
    for r in rows(f'bu_{turn}t.zip'):
        if r['CD_CARGO_PERGUNTA']!='3':continue
        assert r['SG_UF']=='AL' and r['NR_TURNO']==str(turn)
        count+=1; k=f'{turn}|'+key(r)
        dates[str(turn)]=r['DT_GERACAO']
        if k not in sections:
            sections[k]={'turn':turn,'city':r['CD_MUNICIPIO'],'zone':r['NR_ZONA'],'section':r['NR_SECAO'],'local':r['NR_LOCAL_VOTACAO'],'apt':int(r['QT_APTOS']),'attendance':int(r['QT_COMPARECIMENTO']),'absent':int(r['QT_ABSTENCOES']),'votes':{},'aggregated':[s for s in re.findall(r'\d+',r['DS_AGREGADAS']) if int(s)>0], 'place':''}
        s=sections[k]
        assert (s['apt'],s['attendance'],s['absent'])==tuple(int(r[x]) for x in ['QT_APTOS','QT_COMPARECIMENTO','QT_ABSTENCOES'])
        n=r['NR_VOTAVEL']; v=int(r['QT_VOTOS'])
        assert n not in s['votes'],f'Duplicidade BU {k} {n}'
        s['votes'][n]=v
        candidates[n]={'name':r['NM_VOTAVEL'],'party':r['SG_PARTIDO'],'type':r['DS_TIPO_VOTAVEL']}
        cities[r['CD_MUNICIPIO']]={'name':r['NM_MUNICIPIO']}
    raw_counts[str(turn)]=count
    print('BU',turn,count,'linhas',flush=True)

official={}
for r in rows('votacao_secao.zip'):
    if r['CD_CARGO']!='3':continue
    k=r['NR_TURNO']+'|'+key(r)
    n=r['NR_VOTAVEL']
    official.setdefault(k,{})[n]=official.setdefault(k,{}).get(n,0)+int(r['QT_VOTOS'])
    if k in sections:sections[k]['place']=r['NM_LOCAL_VOTACAO']
diff=[]
for k in set(sections)|set(official):
    bu=sections.get(k,{}).get('votes',{})
    of=official.get(k,{})
    for n in set(bu)|set(of):
        if bu.get(n,0)!=of.get(n,0):diff.append([k,n,bu.get(n,0),of.get(n,0)])
print('Divergencias BU x votacao:',len(diff),flush=True)
assert not diff, 'Há divergências de votos. Investigar antes de publicar o painel.'

profiles={}; labels={'sex':{},'age':{},'education':{}}; race=Counter()
dimensions={'sex':('CD_GENERO','DS_GENERO'),'age':('CD_FAIXA_ETARIA','DS_FAIXA_ETARIA'),'education':('CD_GRAU_ESCOLARIDADE','DS_GRAU_ESCOLARIDADE')}
for r in rows('perfil_secao.zip'):
    k=key(r); q=int(r['QT_ELEITORES_PERFIL']); race[r['DS_RACA_COR']]+=q
    p=profiles.setdefault(k,{'total':0,'sex':Counter(),'age':Counter(),'education':Counter()})
    p['total']+=q
    for d,(code,label) in dimensions.items():
        p[d][r[code]]+=q; labels[d][r[code]]=r[label].strip()
print('Perfis',len(profiles),flush=True)
missing=[]; mismatches=[]; assigned={1:set(),2:set()}
for k,s in sections.items():
    members=set([s['section']]+s['aggregated']); p={'total':0,'sex':Counter(),'age':Counter(),'education':Counter()}
    for member in members:
        pk='|'.join([s['city'],s['zone'],str(int(member))])
        if pk in assigned[s['turn']]:raise ValueError(f'Perfil contado duas vezes: {pk}')
        assigned[s['turn']].add(pk)
        if pk not in profiles:missing.append([k,pk]);continue
        src=profiles[pk]; p['total']+=src['total']
        for d in dimensions:p[d].update(src[d])
    s['profile']=p
    if p['total']!=s['apt']:mismatches.append([k,p['total'],s['apt']])
    assert s['apt']==s['attendance']+s['absent']
    assert sum(s['votes'].values())==s['attendance'],f'Votos != comparecimento {k}'
ibge=json.loads((ROOT/'dados/municipios-ibge.json').read_text(encoding='utf-8'))
lookup={norm(c['nome']):str(c['id']) for c in ibge}
for c in cities.values():
    c['ibge']=lookup.get(norm(c['name']))
    assert c['ibge'],f"Sem IBGE: {c['name']}"
totals={str(t):dict(sum((Counter(s['votes']) for s in sections.values() if s['turn']==t),Counter())) for t in [1,2]}
assert totals['2']['15']==834278 and totals['2']['44']==759984
audit={'created':datetime.now(timezone.utc).isoformat(),'buRows':raw_counts,'sections':{str(t):sum(s['turn']==t for s in sections.values()) for t in [1,2]},'cities':len(cities),'voteDifferences':diff,'profileMissing':missing,'profileAptDifferences':mismatches,'raceCategories':dict(race),'totals':totals,'sha256':{p.name:hashlib.file_digest(p.open('rb'),'sha256').hexdigest() for p in (ROOT/'dados/brutos').glob('*.zip')}}
data={'year':2022,'cities':cities,'candidates':candidates,'labels':labels,'sections':list(sections.values()),'dates':dates,'audit':{k:v for k,v in audit.items() if k not in ['sha256','voteDifferences','profileMissing','profileAptDifferences']},'profileDifferences':len(mismatches)}
(ROOT/'dados/painel.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(ROOT/'dados/auditoria.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in audit.items() if k not in ['sha256','voteDifferences','profileMissing','profileAptDifferences']},ensure_ascii=False),flush=True)
print('Perfil faltante',len(missing),'Diferencas de aptos',len(mismatches),flush=True)
