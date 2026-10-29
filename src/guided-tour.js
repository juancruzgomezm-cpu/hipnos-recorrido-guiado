import * as THREE from 'three';
import {fitCameraToRect,boxCorners} from './camera_fit.js';

export const CHAPTERS=[
 {id:'welcome',label:'Una nueva forma de descansar',title:'Dos microclimas.\nUn mejor descanso.',text:'Conocé Hipnos, paso a paso. Un cubrecolchón térmico y un Hub que permiten regular cada lado de la cama de forma independiente.',note:'Una experiencia guiada en ocho etapas.'},
 {id:'thermal',label:'01 / Tu lado, tu temperatura',title:'Compartir la cama.\nElegir tu microclima.',text:'Dos circuitos independientes permiten representar distintas temperaturas en cada lado, entre 16 y 28 °C.',note:'Simulación visual. No controla un dispositivo físico.'},
 {id:'layers',label:'02 / El cover, por dentro',title:'Cuatro capas.\nUna experiencia.',text:'El despiece del visor original revela cómo conviven la superficie textil, el acolchado, el sistema térmico y la base.',note:'La capa destacada cambia automáticamente.'},
 {id:'water',label:'03 / El agua conecta todo',title:'Un recorrido de ida.\nY otro de vuelta.',text:'Seguí el suministro y el retorno de agua entre el Hub y los dos lados del cover. Las conexiones llegan por detrás de la cama.',note:'Animación explicativa de los circuitos hidráulicos.'},
 {id:'hub',label:'04 / El corazón de Hipnos',title:'La tecnología,\na la vista.',text:'El interior se abre para mostrar los componentes y su relación dentro de cada circuito.',note:'Arquitectura interna ilustrativa del proyecto original.'},
 {id:'remote',label:'05 / Control RF',title:'Dos lados.\nUn control.',text:'La representación del control RF muestra los ajustes de cada lado. La regulación se realiza de manera independiente.',note:'Representación funcional incluida en el visor original.'},
 {id:'sizes',label:'06 / Tu medida',title:'El mismo sistema.\nEn tres tamaños.',text:'El recorrido presenta automáticamente las tres medidas comerciales. El Hub conserva sus proporciones.',note:'Adaptación dimensional del modelo original; no son CAD de fabricación.'},
 {id:'end',label:'07 / El descanso, a tu manera',title:'Dos microclimas.\nUn mejor descanso.',text:'Un sistema compartido, dos lados independientes. Así es Hipnos by Piero.',note:'Fin del recorrido. Podés volver sobre cada etapa.'}
];

export function tourRect(width=innerWidth,height=innerHeight){
 const compact=width<=760,copy=document.querySelector('#tour-copy')?.getBoundingClientRect(),footer=document.querySelector('.tour-footer')?.getBoundingClientRect();
 if(compact){const bottom=Math.min(height-160,footer?.top>0?footer.top-66:height-160);return{left:12,right:width-12,top:Math.min(copy?.bottom+18||300,bottom-80),bottom};}
 return{left:Math.min(width-180,Math.max(330,(copy?.right||396)+30)),right:width-36,top:112,bottom:height-124};
}
window.HIPNOS_GUIDED_RECT=()=>tourRect();

export function installGuidedTour({scene,root,camera,controls,renderer,cfg,setView,home,invalidate,interactions,web,lighting}){
 const $=id=>document.getElementById(id);let current=0,busy=false,ready=false,serial=0,timers=[],enteredAt=0,lastCycle=-1;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const parts=['pumps','tank','block','peltier','sink','fans','controller','sensors','power','hydraulics'];
 const sizes=[['double','Dos plazas','1,40 × 1,90 m'],['queen','Queen','1,60 × 2,00 m'],['king','King','2,00 × 2,00 m']];
 controls.enabled=false;controls.autoRotate=false;controls.enableZoom=false;controls.enablePan=false;controls.enableRotate=false;
 renderer.domElement.style.pointerEvents='none';renderer.domElement.tabIndex=-1;
 function later(fn,ms){const token=serial;timers.push(setTimeout(()=>{if(token===serial)fn();},reduced?Math.min(ms,50):ms));}
 function clearTimers(){timers.forEach(clearTimeout);timers=[];}
 function paint(){
  const c=CHAPTERS[current];$('tour-eyebrow').textContent=c.label;$('tour-title').textContent=c.title;$('tour-text').textContent=c.text;$('tour-note').textContent=c.note;
  $('tour-count').textContent=String(current+1).padStart(2,'0')+' / 08';$('tour-progress').style.setProperty('--progress',(current+1)/CHAPTERS.length);$('tour-progress').setAttribute('aria-valuenow',String(current+1));$('tour-progress').setAttribute('aria-valuetext',`Etapa ${current+1} de 8: ${c.label}`);
  $('tour-prev').disabled=current===0||busy;$('tour-next').disabled=busy||!ready;$('tour-next-label').textContent=current===0?'Comenzar el recorrido':current===7?'Volver al inicio':'Continuar';
  $('tour-prev').hidden=current===0;$('tour-rail-label').textContent=current===7?'Recorrido completo':'Un paso a la vez';
  document.body.dataset.chapter=c.id;document.body.dataset.tourBusy=String(busy);
  $('tour-copy').setAttribute('aria-busy',String(busy));$('tour-detail').replaceChildren();delete $('tour-detail').dataset.temps;
 }
 function detail(label,title,text=''){
  const before=$('tour-copy').getBoundingClientRect().height;const d=$('tour-detail');d.replaceChildren();
  for(const [tag,value] of [['span',label],['strong',title],['p',text]]){if(!value)continue;const n=document.createElement(tag);n.textContent=value;d.append(n);}
  if(innerWidth<=760&&Math.abs($('tour-copy').getBoundingClientRect().height-before)>4)later(()=>{if(current===4&&lastCycle>=0)window.HIPNOS_EXPLORATION.selectComponent(parts[lastCycle]);else focus();},120);
 }
 function frameObject(object,direction=[-.7,.8,1.1],fov=34){
  scene.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(object);if(b.isEmpty())return;
  const center=b.getCenter(new THREE.Vector3()),p=center.clone().add(new THREE.Vector3(...direction).normalize().multiplyScalar(Math.max(.13,b.getSize(new THREE.Vector3()).length()*1.9)));
  const points=boxCorners([b.min.x,b.max.x],[b.min.y,b.max.y],[b.min.z,b.max.z]);
  const fit=fitCameraToRect(p.toArray(),center.toArray(),fov,points,{width:innerWidth,height:innerHeight},tourRect(),13.7);setView(fit.position,fit.target,fit.fov);
 }
 function focus(){
  if(current===5)frameObject(web.remote,[-.6,1.2,1.1],35);
  else if([1,2,3,4].includes(current))interactions.cameraForCurrent();else home();
 }
 async function general(){await new Promise(resolve=>window.HIPNOS_EXPLORATION.go('general',resolve));}
 async function show(index,{initial=false}={}){
  if(busy&&!initial)return;busy=true;serial++;clearTimers();lastCycle=-1;current=index;paint();$('tour-copy').classList.add('changing');
  await general();web.setSizeGuided('queen');lighting.setNight(current===7);window.HIPNOS_EXPLORATION.setFlow(true);
  if(current===1){window.HIPNOS_EXPLORATION.setTemperature(0,22);window.HIPNOS_EXPLORATION.setTemperature(1,22);window.HIPNOS_EXPLORATION.go('thermal');later(()=>{window.HIPNOS_EXPLORATION.setTemperature(0,26);window.HIPNOS_EXPLORATION.setTemperature(1,18);},1200);}
  else if(current===2)window.HIPNOS_EXPLORATION.go('layers');
  else if(current===3)window.HIPNOS_EXPLORATION.showCircuits();
  else if(current===4)window.HIPNOS_EXPLORATION.go('hub');
  else if(current===5){window.HIPNOS_EXPLORATION.setTemperature(0,26);window.HIPNOS_EXPLORATION.setTemperature(1,18);}
  enteredAt=performance.now();focus();
  later(()=>{busy=false;paint();$('tour-copy').classList.remove('changing');focus();},initial?450:current===4?2750:[1,2].includes(current)?1800:500);
 }
 function next(){if(!busy&&ready)show(current===7?0:current+1);}
 function previous(){if(!busy&&current>0)show(current-1);}
 $('tour-next').addEventListener('click',next);$('tour-prev').addEventListener('click',previous);
 window.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey||e.target?.matches('input,textarea,select'))return;
  if(e.key===' '&&e.target?.closest('button'))return;
  if(['ArrowRight','PageDown','ArrowLeft','PageUp','Escape',' '].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(['ArrowRight','PageDown',' '].includes(e.key))next();else if(['ArrowLeft','PageUp'].includes(e.key))previous();}
 },true);
 const inspect=()=>({name:'Hipnos – Recorrido Guiado',chapter:current,id:CHAPTERS[current].id,total:CHAPTERS.length,busy,ready,linear:true,freeCamera:controls.enabled,source:'Hipnos_Web_GitHub_Pages.zip',scene:window.HIPNOS_EXPLORATION.inspect(),viewport:tourRect()});
 function update(now){
  if(!ready||busy)return;const elapsed=now-enteredAt,api=window.HIPNOS_EXPLORATION,state=api.inspect();
  if(current===1){const temps=state.shownTemperatures.map(Math.round);const text=`${temps[0]} °C  /  ${temps[1]} °C`;if($('tour-detail').dataset.temps!==text){detail('IZQUIERDO / DERECHO',text,'Un ajuste independiente para cada lado.');$('tour-detail').dataset.temps=text;}}
  else if(current===2){const cycle=Math.min(3,Math.floor(elapsed/4300));if(cycle!==lastCycle){lastCycle=cycle;api.selectLayer(cycle,false);detail(`CAPA ${cycle+1} DE 4`,$('layer-name').textContent,$('layer-composition').textContent+' · '+$('layer-function').textContent);}}
  else if(current===3&&lastCycle<0){lastCycle=0;detail('SUMINISTRO + RETORNO','Dos circuitos separados','El agua circula desde el Hub hacia el cover y regresa a su depósito.');}
  else if(current===4){const cycle=Math.min(parts.length-1,Math.max(0,Math.floor((elapsed-4500)/5800)));if(cycle!==lastCycle){lastCycle=cycle;api.selectComponent(parts[cycle]);detail(`COMPONENTE ${cycle+1} DE ${parts.length}`,$('component-name').textContent,$('component-function').textContent);}}
  else if(current===5&&lastCycle<0){lastCycle=0;detail('CONTROL POR RADIOFRECUENCIA','26 °C  /  18 °C','Los valores corresponden a esta demostración.');}
  else if(current===6){const cycle=Math.floor(elapsed/4500)%3;if(cycle!==lastCycle){lastCycle=cycle;web.animateSize(sizes[cycle][0]);detail('MEDIDAS COMERCIALES',sizes[cycle][1],sizes[cycle][2]);const list=document.createElement('div');list.className='size-list';sizes.forEach((s,i)=>{const p=document.createElement('span');p.textContent=s[1]+' · '+s[2];p.className=i===cycle?'active':'';list.append(p);});$('tour-detail').append(list);}}
 }
 window.HIPNOS_GUIDED={next,previous,inspect,resize:()=>{if(!busy){if(current===4&&lastCycle>=0)window.HIPNOS_EXPLORATION.selectComponent(parts[lastCycle]);else focus();}}};
 ready=true;paint();show(0,{initial:true});return{update,inspect};
}
