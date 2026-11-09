'use strict';
const $=id=>document.getElementById(id);
const digits=v=>String(v).replace(/\D/g,'');
const escapeVCF=v=>String(v??'').replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
function makeVCF(a){
 const e=escapeVCF;
 const lines=['BEGIN:VCARD','VERSION:3.0',`N:${e(a.apellidos)};${e(a.nombres)};;;`,`FN:${e(a.nombre)}`,`ORG:${e(a.empresa)}`,`TITLE:${e(a.cargo)}`,`TEL;TYPE=CELL:${'+'+digits(a.celular)}`,`TEL;TYPE=WORK,VOICE:${'+'+digits(a.oficina)}`,`EMAIL;TYPE=INTERNET,WORK:${e(a.correo)}`,`ADR;TYPE=WORK:;;${e(a.direccion)};;;;`,`URL:${e(a.sitio)}`,`X-SOCIALPROFILE;TYPE=whatsapp:https://wa.me/${digits(a.whatsapp)}`,`NOTE:${e('WhatsApp: '+a.whatsapp)}`,'END:VCARD'];
 // RFC line folding: at most 75 UTF-8 octets per physical line.
 return lines.map(line=>{let out='',len=0;for(const c of line){const size=new TextEncoder().encode(c).length;if(len+size>75){out+='\r\n ';len=1;}out+=c;len+=size;}return out;}).join('\r\n')+'\r\n';
}
function publicURL(base,id){
 const u=new URL(base);const host=u.hostname.toLowerCase();
 if(u.protocol!=='https:'||u.username||u.password||!host.includes('.')||host.endsWith('.local')||host.endsWith('.localhost')||host.endsWith('.test')||host.endsWith('.invalid')||host.includes(':')||/^\d+\.\d+\.\d+\.\d+$/.test(host))throw Error('Configure primero una URL pública HTTPS en asesores.json; no use localhost ni direcciones de red local.');
 u.search='';u.hash='';u.searchParams.set('asesor',id);return u.href;
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
const paths={chat:'M21 11.5a8.5 8.5 0 0 1-12.8 7.3L3 21l1.8-5.2A8.5 8.5 0 1 1 21 11.5Z',phone:'M5 3h4l2 5-3 2a16 16 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 5a2 2 0 0 1 2-2Z',mail:'M3 5h18v14H3ZM3 5l9 8 9-8',office:'M5 21V3h14v18M9 7h2m2 0h2M9 11h2m2 0h2M10 21v-5h4v5',web:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18',facebook:'M14 21v-9h3l1-4h-4V6c0-1 1-2 3-2V1h-3c-3 0-5 2-5 5v2H6v4h3v9',instagram:'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM17 7h.01',linkedin:'M4 9v12M4 4v.01M10 21V9m0 5c0-7 10-7 10 0v7',youtube:'M3 6h18v12H3ZM10 9l5 3-5 3Z'};
function icon(type){const span=document.createElement('span');span.className='icon';span.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[type]||paths.web}"/></svg>`;return span;}
function https(value){try{return new URL(value).protocol==='https:';}catch{return false;}}
async function init(){
 try{
  const response=await fetch('asesores.json',{cache:'no-cache'});if(!response.ok)throw Error('No se pudo cargar la información. Intente nuevamente más tarde.');const config=await response.json();
  const id=new URLSearchParams(location.search).get('asesor')??config.asesorPredeterminado;
  const matches=config.asesores.filter(a=>a.id===id);if(matches.length!==1)throw Error('No encontramos esta tarjeta. Revise el enlace o solicite a su asesor su tarjeta actualizada.');const a=matches[0];
  $('name').textContent=a.nombre;$('role').textContent=a.cargo;$('company').textContent=a.empresa;$('address').textContent=a.direccion;document.title=`${a.nombre} | CEICA`;
  const entries=[['chat','WhatsApp',a.whatsapp,`https://wa.me/${digits(a.whatsapp)}`],['phone','Llamar al celular',a.celular,`tel:+${digits(a.celular)}`],['mail','Enviar correo',a.correo,`mailto:${a.correo}`],['office','Llamar a oficina',a.oficina,`tel:+${digits(a.oficina)}`],['web','Sitio web','www.ceica.com',a.sitio]];
  entries.forEach(([type,label,detail,url])=>{if(type==='web'&&!https(url))return;const link=document.createElement('a');link.href=url;if(url.startsWith('https:')){link.target='_blank';link.rel='noopener noreferrer';}link.append(icon(type));const text=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=label;small.textContent=detail;text.append(strong,small);link.append(text);$('contacts').append(link);});
  $('maps').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(a.direccion);
  for(const [key,label] of Object.entries({facebook:'Facebook',instagram:'Instagram',linkedin:'LinkedIn',youtube:'YouTube'})){const url=a.redes?.[key];if(!https(url))continue;const link=document.createElement('a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.append(icon(key),document.createTextNode(label));$('socials').append(link);$('socials').hidden=false;}
  $('save').addEventListener('click',()=>download(new Blob([makeVCF(a)],{type:'text/vcard;charset=utf-8'}),`${a.id}.vcf`));
  try{if(!config.urlPublica)throw Error('Primero configure la URL pública en asesores.json para generar el QR definitivo.');const url=publicURL(config.urlPublica,a.id),matrix=encodeQR(url),canvas=$('qr'),scale=12,quiet=4;canvas.width=canvas.height=(matrix.length+quiet*2)*scale;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#000';matrix.forEach((row,y)=>row.forEach((dark,x)=>{if(dark)ctx.fillRect((x+quiet)*scale,(y+quiet)*scale,scale,scale);}));canvas.hidden=false;$('public-url').href=url;$('public-url').textContent=url;$('public-url').hidden=false;$('download-qr').hidden=false;$('qr-status').textContent='Enlace listo para QR y NFC.';$('download-qr').onclick=()=>canvas.toBlob(blob=>{if(blob)download(blob,`${a.id}-qr.png`);},'image/png');}catch(error){$('qr-status').textContent=error.message;}
  $('status').hidden=true;$('profile').hidden=false;
 }catch(error){$('profile').hidden=true;$('status').textContent=location.protocol==='file:'?'Para abrir la tarjeta, ejecute INICIAR.bat y visite http://localhost:8000. No abra index.html con doble clic.':error.message;}
 finally{$('card').setAttribute('aria-busy','false');}
}
if(typeof document!=='undefined')init();
if(typeof module!=='undefined')module.exports={makeVCF,publicURL};
