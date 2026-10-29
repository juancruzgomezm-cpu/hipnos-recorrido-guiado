import {readFile,copyFile,mkdir} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
const assets=JSON.parse(await readFile('asset-integrity.json','utf8'));
for(const [path,hash] of Object.entries(assets)){
 let bytes;try{bytes=await readFile(path);}catch{bytes=await readFile(join(process.argv[2],path));await mkdir(dirname(path),{recursive:true});await copyFile(join(process.argv[2],path),path);}
 if(createHash('sha256').update(bytes).digest('hex')!==hash)throw new Error('Asset integrity mismatch: '+path);
}
console.log('Original assets copied and verified; no changes to the original repository.');
