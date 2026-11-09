/* Local QR encoder: byte mode, version 6, level L, mask 0.
   136 data codewords, two RS blocks of 68 + 18 codewords. No network. */
(function(root){
'use strict';
function encodeQR(text){
 const bytes=new TextEncoder().encode(text);
 if(bytes.length>134) throw Error('La URL supera 134 bytes. Utilice una dirección pública más corta.');
 const bits=[]; const put=(v,n)=>{for(let i=n-1;i>=0;i--)bits.push((v>>>i)&1);};
 put(4,4);put(bytes.length,8);bytes.forEach(b=>put(b,8));put(0,Math.min(4,1088-bits.length));while(bits.length%8)bits.push(0);
 const data=[];for(let i=0;i<bits.length;i+=8)data.push(bits.slice(i,i+8).reduce((a,b)=>a*2+b,0));
 for(let i=0;data.length<136;i++)data.push(i%2?0x11:0xec);
 const mul=(x,y)=>{let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11d);z^=((y>>>i)&1)*x;}return z;};
 let gen=[1],r=1;for(let i=0;i<18;i++){const next=Array(gen.length+1).fill(0);gen.forEach((g,j)=>{next[j]^=g;next[j+1]^=mul(g,r);});gen=next;r=mul(r,2);}
 const blocks=[data.slice(0,68),data.slice(68)];const ecc=blocks.map(b=>{const rem=Array(18).fill(0);for(const v of b){const f=v^rem.shift();rem.push(0);for(let j=0;j<18;j++)rem[j]^=mul(gen[j+1],f);}return rem;});
 const words=[];for(let i=0;i<68;i++)blocks.forEach(b=>words.push(b[i]));for(let i=0;i<18;i++)ecc.forEach(b=>words.push(b[i]));
 const n=41,m=Array.from({length:n},()=>Array(n).fill(null));
 function finder(x,y){for(let dy=-1;dy<=7;dy++)for(let dx=-1;dx<=7;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=n||yy>=n)continue;m[yy][xx]=dx>=0&&dx<=6&&dy>=0&&dy<=6&&(dx===0||dx===6||dy===0||dy===6||(dx>=2&&dx<=4&&dy>=2&&dy<=4));}}
 finder(0,0);finder(n-7,0);finder(0,n-7);
 for(let y=32;y<=36;y++)for(let x=32;x<=36;x++)m[y][x]=Math.max(Math.abs(x-34),Math.abs(y-34))!==1;
 for(let i=8;i<n-8;i++){if(m[6][i]===null)m[6][i]=i%2===0;if(m[i][6]===null)m[i][6]=i%2===0;}
 const fmt=0x77c4;
 for(let i=0;i<15;i++){const b=!!((fmt>>>i)&1);if(i<6)m[i][8]=b;else if(i<8)m[i+1][8]=b;else m[n-15+i][8]=b;if(i<8)m[8][n-i-1]=b;else if(i===8)m[8][7]=b;else m[8][14-i]=b;}
 m[n-8][8]=true;
 let k=0,up=true;for(let right=n-1;right>=1;right-=2){if(right===6)right--;for(let v=0;v<n;v++){const y=up?n-1-v:v;for(let d=0;d<2;d++){const x=right-d;if(m[y][x]!==null)continue;const b=k<words.length*8?((words[k>>>3]>>>(7-k%8))&1):0;k++;m[y][x]=!!(b^((x+y)%2===0?1:0));}}up=!up;}
 return m;
}
 root.encodeQR=encodeQR;
})(typeof window!=='undefined'?window:globalThis);
