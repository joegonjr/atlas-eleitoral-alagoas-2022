"""Converte a malha municipal IBGE 2022 sem simplificar ou deslocar vértices."""
import io
import json
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.deps/geo'))
import shapefile

source = 'https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2022/UFs/AL/AL_Municipios_2022.zip'
with zipfile.ZipFile(ROOT / 'dados/brutos/AL_Municipios_2022.zip') as archive:
    # SIRGAS 2000 geográfico: longitude/latitude em graus, sem reprojeção visual.
    prj = archive.read('AL_Municipios_2022.prj').decode()
    assert '4674' in prj and 'UNIT["Degree"' in prj
    reader = shapefile.Reader(**{
        ext: io.BytesIO(archive.read(f'AL_Municipios_2022.{ext}'))
        for ext in ('shp', 'shx', 'dbf')
    }, encoding='utf-8')
    features = [{
        'type': 'Feature',
        'properties': {'codarea': record.record['CD_MUN']},
        'geometry': record.shape.__geo_interface__
    } for record in reader.iterShapeRecords()]
assert len(features) == 102
output = {'type': 'FeatureCollection', 'source': source, 'year': 2022,
          'coordinateSystem': 'SIRGAS 2000 / longitude, latitude (graus)',
          'features': features}
(ROOT / 'dados/alagoas.geojson').write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print('Malha municipal 2022: 102 municípios, vértices originais preservados.')
