import { createElement as h } from 'react';
import { ImageResponse } from 'next/og.js';
import { readFile, writeFile } from 'node:fs/promises';

const font = await readFile(new URL('../app/fonts/Hanken-Bold.ttf', import.meta.url));
const teal = '#0F766E';
const image = new ImageResponse(h('div', {style:{display:'flex',flexDirection:'column',width:'100%',height:'100%',padding:'58px 68px',background:'#FAF9F6',color:'#242824',fontFamily:'Hanken',fontWeight:700}},
  h('div',{style:{display:'flex',alignItems:'center',gap:16}},
    h('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',gap:6,width:64,height:64,borderRadius:14,background:teal}},
      ...[18,32,44,32,18].map((height,i)=>h('div',{key:i,style:{width:6,height,borderRadius:3,background:'#F59E0B'}}))),
    h('div',{style:{fontSize:42,color:teal}},'Ontor')),
  h('div',{style:{display:'flex',flexDirection:'column',marginTop:52,fontSize:76,lineHeight:1.08,letterSpacing:-3}},
    h('div',{style:{color:teal}},'Smart breaks for'),
    h('div',{},'healthy computer work.')),
  h('div',{style:{display:'flex',justifyContent:'space-between',marginTop:'auto',paddingTop:24,borderTop:'1px solid #DCDDD6',fontSize:24,color:'#5D665F'}},
    h('div',{},'On-device analysis · Optional cloud backup'),h('div',{},'ontor.ai'))
),{width:1200,height:630,fonts:[{name:'Hanken',data:font,weight:700,style:'normal'}]});
await writeFile(new URL('../public/og-smart-breaks.png',import.meta.url),Buffer.from(await image.arrayBuffer()));
console.log('Generated public/og-smart-breaks.png (1200 × 630)');
