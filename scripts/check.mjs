import assert from 'node:assert/strict';
import {readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {Window} from 'happy-dom';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// CPU/DOM integration checks. No GPU rendering or physical iPhone is claimed.
const meta=JSON.parse(await readFile('assets/models/model.json','utf8'));
const compressed=Buffer.concat(await Promise.all(meta.parts.map(p=>readFile('assets/models/'+p))));
const model=gunzipSync(compressed);assert.equal(model.length,meta.bytes);
const digest=createHash('sha256').update(model).digest('hex');if(meta.sha256)assert.equal(digest,meta.sha256);
const win=new Window({url:'http://hipnos.test/',settings:{disableJavaScriptEvaluation:true,disableJavaScriptFileLoading:true,disableCSSFileLoading:true}});
for(const key of ['window','document','navigator','HTMLElement','HTMLCanvasElement','Event','KeyboardEvent','PointerEvent'])Object.defineProperty(globalThis,key,{value:key==='window'?win:win[key],configurable:true});
Object.defineProperty(globalThis,'self',{value:win,configurable:true});
Object.defineProperty(globalThis,'innerWidth',{get:()=>win.innerWidth,configurable:true});Object.defineProperty(globalThis,'innerHeight',{get:()=>win.innerHeight,configurable:true});
win.innerWidth=1440;win.innerHeight=900;globalThis.matchMedia=()=>({matches:false});
globalThis.createImageBitmap=async()=>({width:256,height:256,close(){}});
const ctx=new Proxy({measureText:t=>({width:t.length*10})},{get:(o,k)=>k in o?o[k]:()=>{}});
win.HTMLCanvasElement.prototype.getContext=()=>ctx;
document.write((await readFile('index.html','utf8')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*>/gi,''));
const cfg=JSON.parse(await readFile('assets/config.json','utf8'));
const loader=new GLTFLoader();const gltf=await new Promise((resolve,reject)=>loader.parse(model.buffer.slice(model.byteOffset,model.byteOffset+model.byteLength),'',resolve,reject));
const root=gltf.scene,scene=new THREE.Scene();scene.add(root);scene.updateMatrixWorld(true);
const originals=[];root.traverse(o=>{if(o.isMesh)originals.push({object:o,hash:createHash('sha256').update(Buffer.from(o.geometry.attributes.position.array.buffer,o.geometry.attributes.position.array.byteOffset,o.geometry.attributes.position.array.byteLength)).digest('hex')});});
let clock=0;Object.defineProperty(performance,'now',{value:()=>clock,configurable:true});
const camera=new THREE.PerspectiveCamera(cfg.fov,1440/900,.02,80),controls={target:new THREE.Vector3(...cfg.target),maxDistance:14,minDistance:.48,enabled:true,addEventListener(){}};
camera.position.set(...cfg.camera);const canvas=document.createElement('canvas');document.getElementById('stage').append(canvas);
const renderer={domElement:canvas,shadowMap:{needsUpdate:false}};
const setView=(position,target,fov)=>{camera.position.set(...position);controls.target.set(...target);camera.fov=fov;camera.lookAt(controls.target);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);};
const home=()=>setView(cfg.camera,cfg.target,cfg.fov),invalidate=()=>{};
const {installHipnosInteractions}=await import('../src/interactions.js');
const interactions=installHipnosInteractions({scene,root,camera,controls,renderer,cfg,setView,home,invalidate});
const {installWebExperience}=await import('../src/web-experience.js');
// These browser environment APIs are not part of the guided navigation.
globalThis.location=win.location;win.HIPNOS_BUFFER=model;win.HIPNOS_READY={};
const web=installWebExperience({THREE,scene,root,camera,controls,renderer,cfg,setView,home,invalidate,interactions});win.HIPNOS_WEB=web;
let timerId=0;const timers=new Map();const originalSetTimeout=globalThis.setTimeout;const originalClearTimeout=globalThis.clearTimeout;
globalThis.setTimeout=(fn,delay=0)=>{const id=++timerId;timers.set(id,{fn,due:clock+delay});return id;};globalThis.clearTimeout=id=>timers.delete(id);
const {installGuidedTour,CHAPTERS,tourRect}=await import('../src/guided-tour.js');
const tour=installGuidedTour({scene,root,camera,controls,renderer,cfg,setView,home,invalidate,interactions,web,lighting:{setNight:on=>document.body.dataset.theme=on?'night':'day'}});
async function advance(ms){const end=clock+ms;while(clock<end){clock=Math.min(clock+50,end);for(const [id,t] of [...timers])if(t.due<=clock){timers.delete(id);t.fn();}interactions.update(clock);web.update(clock);tour.update(clock);await Promise.resolve();}scene.updateMatrixWorld(true);}
const report={kind:'CPU/DOM integration with original GLB; not a GPU test',sourceSHA256:digest,modelBytes:model.length,originalMeshes:originals.length,steps:[],gpuBrowserVerified:false,physicalIPhoneVerified:false};
await advance(1000);
for(let i=0;i<CHAPTERS.length;i++){
 assert.equal(tour.inspect().chapter,i);assert.equal(tour.inspect().busy,false);assert.equal(tour.inspect().freeCamera,false);
 assert.equal(document.getElementById('tour-progress').getAttribute('aria-valuenow'),String(i+1));
 if(i===1){await advance(6000);assert.deepEqual(win.HIPNOS_EXPLORATION.inspect().temperatures,[26,18]);}
 if(i===2){await advance(15500);assert.equal(win.HIPNOS_EXPLORATION.inspect().selectedLayer,3);}
 if(i===3){assert.equal(win.HIPNOS_EXPLORATION.inspect().waterView,true);assert.equal(win.HIPNOS_EXPLORATION.inspect().flowEnabled,true);}
 if(i===4){await advance(7000);assert.equal(win.HIPNOS_EXPLORATION.inspect().mode,'hub');assert.ok(win.HIPNOS_EXPLORATION.inspect().hub.opening>.99);assert.ok(document.getElementById('tour-detail').textContent.length>20);assert.ok(win.HIPNOS_EXPLORATION.inspect().hub.selected);}
 if(i===5)assert.equal(web.remote.visible,true);
 if(i===6){for(let n=0;n<3;n++){await advance(4600);assert.ok(['double','queen','king'].includes(web.inspect().size));}assert.equal(document.querySelectorAll('.size-list span').length,3);}
 if(i===7)assert.equal(document.body.dataset.theme,'night');
 assert.ok(camera.position.toArray().every(Number.isFinite));assert.ok(Number.isFinite(camera.fov));
 report.steps.push({index:i,id:CHAPTERS[i].id,mode:win.HIPNOS_EXPLORATION.inspect().mode,detail:document.getElementById('tour-detail').textContent,copyHTML:document.getElementById('tour-copy').outerHTML});
 if(i<7){document.getElementById('tour-next').click();const index=tour.inspect().chapter;document.getElementById('tour-next').click();assert.equal(tour.inspect().chapter,index,'Rapid clicks may not skip stages');await advance(7000);}
}
document.getElementById('tour-prev').click();await advance(7000);assert.equal(tour.inspect().chapter,6);
document.getElementById('tour-next').click();await advance(7000);assert.equal(tour.inspect().chapter,7);
document.getElementById('tour-next').click();await advance(7000);assert.equal(tour.inspect().chapter,0);
for(const {object,hash} of originals)assert.equal(createHash('sha256').update(Buffer.from(object.geometry.attributes.position.array.buffer,object.geometry.attributes.position.array.byteOffset,object.geometry.attributes.position.array.byteLength)).digest('hex'),hash,'Original mesh buffers must remain unchanged');
report.geometryPreserved=true;report.forwardBackRestart=true;report.noSkippedSteps=true;
for(const [width,height] of [[390,844],[375,667],[844,390],[1440,900]]){win.innerWidth=width;win.innerHeight=height;const rect=tourRect(width,height);assert.ok(rect.right>rect.left&&rect.bottom>rect.top&&rect.bottom<=height);}
globalThis.setTimeout=originalSetTimeout;globalThis.clearTimeout=originalClearTimeout;
await writeFile('docs/guided-validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,steps:report.steps.length,modelBytes:model.length,geometryPreserved:true,scope:report.kind}));
await win.happyDOM.close();
