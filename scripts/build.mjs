import {build} from 'esbuild';
import {resolve,sep} from 'node:path';
const coreOnly=process.argv.includes('--core-only'),arDirectory=resolve('assets/ar');
import {mkdir,cp,rm,readdir,stat} from 'node:fs/promises';
await build({entryPoints:['src/viewer.js'],bundle:true,minify:true,format:'iife',target:['safari16','chrome110'],outfile:'assets/app.js',legalComments:'eof'});
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const name of ['index.html','manifest.webmanifest','sw.js','offline-assets.json','assets','docs','guia.html','.nojekyll'])await cp(name,'dist/'+name,{recursive:true,filter:source=>!coreOnly||!(resolve(source)===arDirectory||resolve(source).startsWith(arDirectory+sep))});
console.log('Hipnos – Recorrido Guiado: static build ready.');
