"""Cruza locais de 2022 com os BUs e verifica coordenadas na malha municipal."""
import csv,io,json,zipfile,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
data=json.loads((ROOT/'dados/painel.json').read_text(encoding='utf-8'))
geo=json.loads((ROOT/'dados/alagoas.geojson').read_text(encoding='utf-8'))
features={f['properties']['codarea']:f['geometry'] for f in geo['features']}
def ring_contains(x,y,ring):
    inside=False
    for a,b in zip(ring,ring[1:]+ring[:1]):
        if (a[1]>y)!=(b[1]>y) and x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]:inside=not inside
    return inside
def contains(x,y,g):
    polygons=[g['coordinates']] if g['type']=='Polygon' else g['coordinates']
    return any(ring_contains(x,y,p[0]) and not any(ring_contains(x,y,r) for r in p[1:]) for p in polygons)
wanted={(str(s['turn']),s['city'],s['zone'],s['local']) for s in data['sections']}
locations={}
with zipfile.ZipFile(ROOT/'dados/brutos/locais_2022.zip') as z:
    with z.open('eleitorado_local_votacao_2022.csv') as f:
        for r in csv.DictReader(io.TextIOWrapper(f,encoding='latin1'),delimiter=';'):
            k=(r['NR_TURNO'],r['CD_MUNICIPIO'],r['NR_ZONA'],r['NR_LOCAL_VOTACAO'])
            if r['SG_UF']!='AL' or k not in wanted:continue
            try:lat,lon=float(r['NR_LATITUDE']),float(r['NR_LONGITUDE'])
            except ValueError:lat=lon=None
            valid=lat is not None and contains(lon,lat,features[data['cities'][k[1]]['ibge']])
            locations[k]={'turn':int(k[0]),'city':k[1],'zone':k[2],'local':k[3],'name':r['NM_LOCAL_VOTACAO'],'address':r['DS_ENDERECO'],'neighborhood':r['NM_BAIRRO'],'lat':lat,'lon':lon,'valid':valid,'generation':r['DT_GERACAO']}
output={'source':'https://dadosabertos.tse.jus.br/dataset/eleitorado-2022','note':'Base da eleição de 2022, gerada em 30/09/2024. Somente pontos contidos na malha municipal do IBGE são exibidos. A checagem não confirma o endereço físico; divergências de borda da malha também podem excluir pontos.','locations':list(locations.values()),'audit':{}}
for t in ['1','2']:
    relevant={k:v for k,v in locations.items() if k[0]==t}
    output['audit'][t]={'expected':sum(k[0]==t for k in wanted),'matched':len(relevant),'insideMunicipality':sum(v['valid'] for v in relevant.values())}
with (ROOT/'dados/brutos/locais_2022.zip').open('rb') as f:output['sha256']=hashlib.file_digest(f,'sha256').hexdigest()
(ROOT/'dados/locais-votacao.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(output['audit'])
