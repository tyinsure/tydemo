import {LINE_CONTACT_TEXT} from './pdf-contact-link.mjs';
export function drawOPDBenefits(canvas,r,index,total,scale=3){
 const W=595.28,H=841.89,M=28;canvas.width=Math.ceil(W*scale);canvas.height=Math.ceil(H*scale);
 const c=canvas.getContext('2d');c.scale(scale,scale);c.fillStyle='#fff';c.fillRect(0,0,W,H);
 const text=(value,x,y,size=10,color='#36283b',bold=false)=>{c.font=`${bold?'bold ':''}${size}px Sarabun`;c.fillStyle=color;c.textBaseline='top';c.textAlign='left';c.fillText(String(value),x,y);};
 const terms=r.opd.terms;let y=190;
 const paragraph=(value,size=9.5,gap=10)=>{
  c.font=`${size}px Sarabun`;const segments=[...new Intl.Segmenter('th',{granularity:'word'}).segment(value)].map(s=>s.segment);let line='';
  for(const segment of segments){if(c.measureText(line+segment).width>W-2*M-16&&line){text(line,M+8,y,size);y+=15;line='';}line+=segment;}
  if(line){text(line,M+8,y,size);y+=15;}y+=gap;
 };
 const m=n=>n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
 text('TYINSURE',M,28,18,'#a13362',true);text(r.opd.label+' · ผลประโยชน์ผู้ป่วยนอก',M,65,14,'#a13362',true);
 text(`${r.gender==='male'?'ชาย':'หญิง'} อายุ ${r.age} ปี · กลุ่มอาชีพ 1 และ 2`,M,96,10);
 text(r.opd.product==='per-visit'?`ครั้งละ ${m(r.opd.benefit)} บาท · รวมสูงสุด ${m(r.opd.annualLimit)} บาทต่อปี`:`วงเงิน ${m(r.opd.benefit)} บาทต่อปีกรมธรรม์`,M,119,12,'#a13362',true);
 text(`เบี้ย${r.frequency.label} ${m(r.opd.premium)} บาท/งวด · รวมต่อปี ${m(r.opd.annual)} บาท`,M,144,10);
 c.fillStyle='#f9edf3';c.fillRect(M,175,W-2*M,108);
 paragraph(r.opd.benefitText,10,8);paragraph(terms[0],9.5,12);
 y=Math.max(y,305);text(r.opd.product==='per-visit'?'เงื่อนไขความคุ้มครอง':'ระยะไม่คุ้มครองและเงื่อนไข',M,y,11,'#a13362',true);y+=25;
 for(const term of terms.slice(1))paragraph(term,9.5,9);
 if(y>756)throw Error('ข้อความ OPD เกินพื้นที่ A4');
 text(LINE_CONTACT_TEXT,M,819,8,'#338169');text(`หน้า ${index+1} / ${total}`,510,819,8,'#877b87');
 return canvas;
}
