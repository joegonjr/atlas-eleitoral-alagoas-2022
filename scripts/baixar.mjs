import {mkdir, writeFile, rename, access} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
const base='https://cdn.tse.jus.br/estatistica/sead/';
const files={
 'dados/bairros-ibge.geojson':'https://dados.al.gov.br/catalogo/dataset/821e5f37-0be4-4a5e-948c-59d95e538773/resource/dea6577b-8aa8-460e-89bb-30d6a1242fb6/download/bairros.geojson',
 'dados/brutos/locais_2022.zip':base+'odsele/eleitorado_locais_votacao/eleitorado_local_votacao_2022.zip',
 'dados/brutos/bu_1t.zip':base+'eleicoes/eleicoes2022/buweb/bweb_1t_AL_051020221321.zip',
 'dados/brutos/bu_2t.zip':base+'eleicoes/eleicoes2022/buweb/bweb_2t_AL_311020221535.zip',
 'dados/brutos/votacao_secao.zip':base+'odsele/votacao_secao/votacao_secao_2022_AL.zip',
 'dados/brutos/perfil_secao.zip':base+'odsele/perfil_eleitor_secao/perfil_eleitor_secao_2022_AL.zip',
 'vendor/echarts.min.js':'https://cdn.jsdelivr.net/npm/echarts@6.0.0/dist/echarts.min.js',
 'vendor/ECHARTS-LICENSE.txt':'https://cdn.jsdelivr.net/npm/echarts@6.0.0/LICENSE',
 'dados/brutos/AL_Municipios_2022.zip':'https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_municipais/municipio_2022/UFs/AL/AL_Municipios_2022.zip',
 'dados/municipios-ibge.json':'https://servicodados.ibge.gov.br/api/v1/localidades/estados/27/municipios',
 'dados/censo-raca.json':'https://apisidra.ibge.gov.br/values/t/9605/n6/in%20n3%2027/v/93/p/2022/c86/all'
};
await Promise.all(Object.entries(files).map(async([path,url])=>{
 await mkdir(path.slice(0,path.lastIndexOf('/')),{recursive:true});
 try {await access(path); console.log('Existe:',path); return;}catch{}
 const r=await fetch(url); if(!r.ok)throw Error(`${r.status}: ${url}`);
 await pipeline(Readable.fromWeb(r.body),createWriteStream(path+'.part'));
 await rename(path+'.part',path); console.log('OK',path);
}));
