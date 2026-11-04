import {LINE_CONTACT_TEXT} from './pdf-contact-link.mjs';
import {extraBenefits,EXTRA_TERMS} from './maochai-extra.mjs';
const W=595.28,H=841.89,M=28,COL=430;
export function drawMaochaiExtra(canvas,r,index,total,scale){
 canvas.width=Math.ceil(W*scale);canvas.height=Math.ceil(H*scale);
 const c=canvas.getContext('2d');c.scale(scale,scale);c.fillStyle='#FFFFFF';c.fillRect(0,0,W,H);
 const text=(s,x,y,size=8,color='#36283b',bold=false)=>{c.font=`${bold?'bold ':''}${size}px Sarabun`;c.fillStyle=color;c.textAlign='left';c.textBaseline='alphabetic';c.fillText(s,x,y);};
 const wrap=(s,width,size)=>{c.font=`${size}px Sarabun`;let line='';const lines=[];for(const {segment} of new Intl.Segmenter('th',{granularity:'grapheme'}).segment(s)){if(line&&c.measureText(line+segment).width>width){lines.push(line);line=segment;}else line+=segment;}if(line)lines.push(line);return lines;};
 text('TYINSURE',M,37,18,'#A13362',true);text('เหมาจ่าย Extra · สรุปความคุ้มครอง',M,64,14,'#A13362',true);
 text(r.health.detail,M,84,8.5);
 let layout,size;
 for(size of [8.2,8,7.8,7.6,7.4]){
  layout=extraBenefits(r.health.plan).map(([label,amount,note])=>{const labels=wrap(label,COL-M-14,size),notes=wrap(note,COL-M-14,size-.5),amounts=wrap(amount,W-M-COL-14,size);return {label,labels,notes,amounts,height:Math.max(18,(labels.length+notes.length)*9+7,amounts.length*10+7)};});
  if(layout.reduce((h,row)=>h+row.height,0)<=565)break;
 }
 let y=103;c.fillStyle='#A13362';c.fillRect(M,y,W-2*M,24);text('ผลประโยชน์โดยย่อ',M+7,y+16,9,'#FFFFFF',true);text('ผลประโยชน์',COL+7,y+16,9,'#FFFFFF',true);y+=24;
 for(const [i,row] of layout.entries()){
  c.fillStyle=i%2?'#FFFFFF':'#F9F3F6';c.fillRect(M,y,W-2*M,row.height);let ty=y+12;
  for(const s of row.labels){text(s,M+7,ty,size);ty+=9;}
  for(const s of row.notes){text(s,M+7,ty,size-.5,'#766775');ty+=9;}
  row.amounts.forEach((s,j)=>text(s,COL+7,y+12+j*10,size,row.amounts.includes('ไม่คุ้มครอง')?'#A13362':'#36283b'));
  y+=row.height;c.fillStyle='#DDD4DA';c.fillRect(M,y-.5,W-2*M,.5);
 }
 y+=15;text('เงื่อนไขการรับประกัน',M,y,9,'#A13362',true);y+=13;
 for(const note of EXTRA_TERMS){for(const s of wrap(note,W-2*M,7.8)){text(s,M,y,7.8);y+=10;}y+=3;}
 if(y>790)throw Error('สรุปเหมาจ่าย Extra เกินพื้นที่ A4');
 text('สรุปเพื่อประกอบการพิจารณา รายละเอียดเป็นไปตามเงื่อนไขสัญญา',M,800,7.3,'#766775');
 text(LINE_CONTACT_TEXT,M,819,8,'#338169');text(`หน้า ${index+1} / ${total}`,W-95,819,8,'#877b87');
 return canvas;
}
