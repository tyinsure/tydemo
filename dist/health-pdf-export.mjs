import {drawPDFFooter} from './pdf-contact-link.mjs';
import {elapsedYearLabel} from './elapsed-year.mjs';
import {drawMaochaiExtra} from './maochai-extra-pdf.mjs';
import {drawConvertibleSummary} from './convertible-pdf-summary.mjs';
import {drawOPDBenefits} from './opd-pdf-summary.mjs';
import {scheduleUnit} from './schedule-premium-view.mjs';
import {LINE_CONTACT_TEXT,addLineContactLink} from './pdf-contact-link.mjs';
import {CI_TERMS,CI_PROJECTION_NOTE} from './ci-perfect-care.mjs';
import {DAILY_TERMS} from './daily-compensation.mjs';
import {drawDHealthBenefits} from './dhealth-pdf-summary.mjs';
import {drawExtraHealthSummary} from './extra-health-pdf-summary.mjs';
const W=595.28,H=841.89,M=28,TABLE_BOTTOM=738,ROW=20;
const money=n=>Number(n).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
export function reportPageLayouts(r){
 const pages=[];let offset=0;
 while(offset<r.schedule.length){
  const first=pages.length===0,top=r.rider?(first?252:118):(first?226:100),capacity=Math.floor((TABLE_BOTTOM-top-36)/ROW);
  const rows=r.schedule.slice(offset,offset+capacity);pages.push({first,top,rows});offset+=rows.length;
 }
 if(r.health?.product==='dhealth')pages.push({kind:'dhealth',first:false,top:100,rows:[]});
 if(r.health?.product==='maochai-extra')pages.push({kind:'maochai-extra',first:false,top:100,rows:[]});
 if(r.health?.convertibleChanges?.length)pages.push({kind:'convertible',first:false,top:100,rows:[]});
 if(r.health?.product==='elite')for(const kind of ['elite','elite-extra'])pages.push({kind,first:false,top:100,rows:[]});
 if(r.care||r.health?.product==='care')pages.push({kind:'care',first:false,top:100,rows:[]});
 if(r.opd)pages.push({kind:'opd',first:false,top:100,rows:[]});
 if(r.ci)pages.push({kind:'ci',first:false,top:100,rows:[]});
 if(r.daily)pages.push({kind:'daily',first:false,top:100,rows:[]});
 return pages;
}
function drawCIBenefits(canvas,r,index,total,scale){
 canvas.width=Math.ceil(W*scale);canvas.height=Math.ceil(H*scale);
 const c=canvas.getContext('2d');c.scale(scale,scale);c.fillStyle='#FFFFFF';c.fillRect(0,0,W,H);
 const text=(value,x,y,size=10,color='#36283b',width=W-2*M)=>{c.font=`${size}px Sarabun`;c.fillStyle=color;c.textAlign='left';c.fillText(String(value),x,y,width);};
 text('TYINSURE',M,37,18,'#A13362');text('ซีไอ เพอร์เฟค แคร์ · ผลประโยชน์ตามทุน ณ วันเริ่มสัญญา',M,75,14,'#A13362');
 text(`${r.gender==='male'?'ชาย':'หญิง'} อายุเริ่ม ${r.age} ปี · ${r.ci.detail}`,M,105,11);
 text(`เบี้ย${r.frequency.label} ${money(r.ci.premium)} บาท/งวด · รวมต่อปี ${money(r.ci.annual)} บาท`,M,130,11);
 r.ci.benefits.forEach((b,i)=>{const y=158+i*49;c.fillStyle=i%2?'#FFFFFF':'#F9F3F6';c.fillRect(M,y,W-2*M,49);text(b.label,M+8,y+19,10,'#36283b',W-2*M-155);text(`${b.pct*100}% ของทุน`,M+8,y+36,9,'#877b87');text(`${money(b.amount)} บาท`,W-170,y+27,11,'#A13362',140);});
 text('เงื่อนไขผลประโยชน์',M,481,11,'#A13362');
 const notes=[...CI_TERMS,CI_PROJECTION_NOTE];
 notes.forEach((note,i)=>{
  const pieces=[...note];let line='',lines=[];
  c.font='10px Sarabun';
  for(const ch of pieces){if(c.measureText(line+ch).width>W-2*M-14){lines.push(line);line=ch;}else line+=ch;}
  if(line)lines.push(line);
  lines.forEach((line,j)=>text(line,M,507+i*52+j*16,10));
 });

 drawPDFFooter(canvas.getContext('2d'),index,total);return canvas;
}
function drawDailyBenefits(canvas,r,index,total,scale){
 canvas.width=Math.ceil(W*scale);canvas.height=Math.ceil(H*scale);
 const c=canvas.getContext('2d');c.scale(scale,scale);c.fillStyle='#FFFFFF';c.fillRect(0,0,W,H);
 const text=(value,x,y,size=10,color='#36283b',width=W-2*M)=>{c.font=`${size}px Sarabun`;c.fillStyle=color;c.textAlign='left';c.fillText(String(value),x,y,width);};
 text('TYINSURE',M,37,18,'#A13362');text('ค่าชดเชยรายวัน · ตัวอย่างผลประโยชน์รวมต่อวัน',M,75,14,'#A13362');
 text(`${r.gender==='male'?'ชาย':'หญิง'} อายุเริ่ม ${r.age} ปี · ${r.daily.detail}`,M,105,11);
 text(`เบี้ย${r.frequency.label} ${money(r.daily.premium)} บาท/งวด · รวมชำระ ${money(r.daily.annual)} บาท/ปี`,M,130,11);
 r.daily.benefits.forEach((b,i)=>{const y=158+i*59;c.fillStyle=i%2?'#FFFFFF':'#F9F3F6';c.fillRect(M,y,W-2*M,59);text(b.label,M+8,y+23,10,'#36283b',W-2*M-155);text(`${money(b.amount)} บาท/วัน`,W-170,y+40,10,'#A13362',145);});
 text('เงื่อนไขความคุ้มครอง',M,424,11,'#A13362');
 let y=450;
 for(const note of DAILY_TERMS){
  c.font='10px Sarabun';let line='';
  for(const ch of note){if(c.measureText(line+ch).width>W-2*M-14){text(line,M,y,10);y+=17;line=ch;}else line+=ch;}
  if(line){text(line,M,y,10);y+=17;}y+=12;
 }

 drawPDFFooter(canvas.getContext('2d'),index,total);return canvas;
}
export function drawPDFPage(canvas,r,mode,layout,index,total,scale=3){
 if(['elite','elite-extra','care'].includes(layout.kind))return drawExtraHealthSummary(canvas,r,layout.kind,index,total,scale);
 if(layout.kind==='maochai-extra')return drawMaochaiExtra(canvas,r,index,total,scale);
 if(layout.kind==='convertible')return drawConvertibleSummary(canvas,r,index,total,scale);
 if(layout.kind==='dhealth')return drawDHealthBenefits(canvas,r,index,total,scale);
 if(layout.kind==='opd')return drawOPDBenefits(canvas,r,index,total,scale);
 if(layout.kind==='ci')return drawCIBenefits(canvas,r,index,total,scale);
 if(layout.kind==='daily')return drawDailyBenefits(canvas,r,index,total,scale);
 const legacy=r.type==='legacy',withRider=legacy&&!!r.rider,widths=withRider?[45,100,86,110,100,98.28]:legacy?[50,122,122,122,123.28]:[34,99,61,110,112,123.28];
 canvas.width=Math.ceil(W*scale);canvas.height=Math.ceil(H*scale);
 const c=canvas.getContext('2d');c.scale(scale,scale);c.fillStyle='#FFFFFF';c.fillRect(0,0,W,H);
 function text(value,x,y,{size=10,color='#36283b',bold=false,align='left',maxWidth}={}){
  c.font=`${bold?'bold ':''}${size}px Sarabun`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';
  // Keep unusually large amounts inside their own cells.
  if(maxWidth&&c.measureText(String(value)).width>maxWidth)c.fillText(String(value),x,y,maxWidth);else c.fillText(String(value),x,y);
 }
 function line(x1,y1,x2,y2,color='#CBC3C8'){c.beginPath();c.strokeStyle=color;c.lineWidth=.5;c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
 text('TYINSURE',M,37,{size:18,bold:true,color:'#A13362'});
 text(legacy?'สรุปแผนประกันสุขภาพ':'สรุปแผนบำนาญ',W-M,37,{size:15,align:'right',bold:true});
 line(M,55,W-M,55,'#A13362');
 text(r.ci||r.daily?`${r.reportMainLabel} + สัญญาเพิ่มเติมที่เลือก`:r.plan.label,M,71,{size:11,bold:true,maxWidth:W-2*M});
 if(layout.first){
  text(mode==='premium'?(legacy?`คำนวณจากเบี้ย${r.frequency.label}`:r.frequency?'คำนวณจากเบี้ยต่องวด':r.plan.kind==='single_premium'?'คำนวณจากเบี้ยชำระครั้งเดียว':'คำนวณจากเบี้ยประกันรายปี'):'คำนวณจากทุนประกัน',M,91,{size:9,color:'#877b87'});
  const meta=[['เพศ',r.gender==='male'?'ชาย':'หญิง','อายุเริ่มทำประกัน',`${r.age} ปี`],['ทุนประกัน',`${money(r.sum)} บาท`,(legacy||r.frequency)?`เบี้ย${r.frequency.label}`:r.plan.kind==='single_premium'?'เบี้ยครั้งเดียว':'เบี้ยรายปี',`${money(r.premium)} บาท`],['ระยะชำระเบี้ย',r.plan.kind==='single_premium'?'ครั้งเดียว':`${r.payYears} ปี`,r.plan.family==='mt8560'?'ช่วงรับบำนาญ':legacy?'ครบสัญญาที่อายุ':'เริ่มรับบำนาญ',r.plan.family==='mt8560'?'60–85 ปี':`${legacy?99:r.plan.pensionAge} ปี`],[withRider?'เบี้ยหลักที่ชำระรวม':'เบี้ยที่ชำระรวม',`${money(r.totalPaid)} บาท`,legacy?'เงินครบสัญญา':'เงินบำนาญรวม',`${money(legacy?r.maturityAmount:r.totalReceived)} บาท`]];
  meta.forEach(([a,b,d,e],i)=>{const y=107+i*25,half=(W-2*M)/2;
   c.fillStyle=i%2?'#FFFFFF':'#F9F3F6';c.fillRect(M,y,W-2*M,25);
   text(a,M+7,y+12.5,{size:9,color:'#766775'});text(b,M+half-9,y+12.5,{size:9,align:'right',maxWidth:165});
   text(d,M+half+8,y+12.5,{size:9,color:'#766775'});text(e,W-M-7,y+12.5,{size:9,align:'right',maxWidth:160});
   line(M,y+25,W-M,y+25);
  });
 }else text(`${r.gender==='male'?'ชาย':'หญิง'} อายุเริ่ม ${r.age} ปี | เบี้ย${(legacy||r.frequency)?r.frequency.label:r.plan.kind==='single_premium'?'ครั้งเดียว':'รายปี'} ${money(r.premium)} บาท`,M,88,{size:9});
 if(withRider){
  if(layout.first){
   text(`สัญญาเพิ่มเติม ${r.ci||r.daily||r.opd?r.reportRiderLabel:r.rider.name}${r.rider.occupation==='—'?'':' · กลุ่มอาชีพ '+r.rider.occupation}${r.rider.holiday?' · เพิ่มเบี้ยวันหยุดแล้ว':''}`,M,219,{size:9,bold:true,color:'#A13362',maxWidth:W-2*M});
   text(`เบี้ยเพิ่มเติม ปีแรก ${money(r.rider.premium)} บาท/งวด (${r.frequency.label}) · เบี้ยรวมปีแรก ${money(r.combinedFirstYearAnnual)} บาท/ปี`,M,235,{size:9,maxWidth:W-2*M});
  }else text(`สัญญาเพิ่มเติม ${r.ci||r.daily||r.opd?r.reportRiderLabel:r.rider.name} · ${r.daily?'เบี้ยค่าชดเชยรายวันคงที่ตามอายุเริ่มสัญญา':'เบี้ยสัญญาเพิ่มเติมปรับตามอายุ'}`,M,104,{size:8,color:'#A13362',maxWidth:W-2*M});
 }
 const unit=scheduleUnit(r,r.schedulePremiumDisplay);
 const headers=withRider?[['อายุ'],['เบี้ยประกันชีวิต',`(บาท/${unit})`],['เบี้ยเพิ่มเติม',`รวม (บาท/${unit})`],['เบี้ยประกันรวม',`(บาท/${unit})`],['ประกันชีวิต*','(บาท)'],['เงินครบสัญญา','(บาท)']]:legacy?[['อายุ'],['เบี้ยในช่วง',`(บาท/${unit})`],['เบี้ยประกันรวม',`(บาท/${unit})`],['ประกันชีวิต*','(บาท)'],['เงินครบสัญญา','(บาท)']]:[['อายุ'],['เบี้ยที่ชำระ',r.plan.kind==='single_premium'?'(บาท)':'(บาท/ปี)'],['อัตรา','บำนาญ'],['เงินบำนาญ','(บาท/ปี)'],['บำนาญสะสม','(บาท)'],['ประกันชีวิต*','(บาท)']];
 c.fillStyle='#A13362';c.fillRect(M,layout.top,W-2*M,36);
 let x=M;headers.forEach((lines,j)=>{lines.forEach((s,k)=>text(s,x+widths[j]/2,layout.top+11+k*14,{size:j===0&&k===1?6:9,color:'#FFFFFF',bold:true,align:'center'}));x+=widths[j];});
 layout.rows.forEach((row,i)=>{
  const y=layout.top+36+i*ROW,milestone=(legacy?[r.age,r.age+r.payYears-1,99]:[r.plan.pensionAge,71,76,81,86]).includes(row.age);
  c.fillStyle=milestone?'#F9EAF1':i%2?'#FCFAFB':'#FFFFFF';c.fillRect(M,y,W-2*M,ROW);
  let x=M;const values=withRider?[row.age,row.pay?money(row.pay):'-',row.riderPremium===null?'ไม่มีอัตรา':money(row.riderPremium),row.totalPremium===null?'ไม่มีอัตรา':money(row.totalPremium),row.coverage?money(row.coverage):'-',row.maturity?money(row.maturity):'-']:legacy?[row.age,row.pay?money(row.pay):'-',row.totalPremium===null?'ไม่มีอัตรา':money(row.totalPremium),row.coverage?money(row.coverage):'-',row.maturity?money(row.maturity):'-']:[row.age,row.pay?money(row.pay):'-',row.pct?`${Math.round(row.pct*100)}%`:'-',row.pension?money(row.pension):'-',row.received?money(row.received):'-',row.coverage===null?'-':row.coverage?money(row.coverage):'-'];
  values.forEach((v,j)=>{text(v,j===0?x+widths[j]/2:x+widths[j]-6,y+(j===0?6:ROW/2),{size:j===0?8:9,bold:milestone,align:j===0?'center':'right',color:(legacy?j===(withRider?4:3)&&row.coverage:j===3&&row.pension)?'#A13362':'#36283b',maxWidth:widths[j]-10});if(j===0)text(elapsedYearLabel(r,row),x+widths[j]/2,y+15,{size:6.5,align:'center',color:'#877b87',maxWidth:widths[j]-6});x+=widths[j];});
  line(M,y+ROW,W-M,y+ROW);
 });
 const bottom=layout.top+36+layout.rows.length*ROW;x=M;
 for(const width of [...widths,0]){line(x,layout.top,x,bottom);x+=width;}
 line(M,759,W-M,759,'#A13362');
 text(r.plan.family==='mt8560'?'* ก่อนบำนาญ: 100% ของทุนถึงอายุ 44 ปี อายุ 45–59 ปีเพิ่มเป็น 110–250%':legacy?(r.plan.family==='wholelife50000'?'* ประกันชีวิต 100% ของทุน = 50,000 บาท ตามภาพผลประโยชน์ที่แนบ':r.plan.family==='smart9999'?'* ประกันชีวิต = ค่าสูงกว่าระหว่างทุนกับ 101% ของเบี้ยสะสม ยังไม่รวมมูลค่าเวนคืน':'* ความคุ้มครองขั้นต่ำ = ค่าสูงกว่าระหว่างทุนและเบี้ยสะสม ยังไม่รวมมูลค่าเวนคืน'):'* ก่อนรับบำนาญ: ความคุ้มครองขั้นต่ำ 105% ของเบี้ยประกันที่ชำระสะสม',M,772,{size:8});
 text(r.plan.family==='mt8560'?'อายุ 60–73 ปี: มูลค่าปัจจุบันตามตาราง × ทุน ÷ 1,000 · อายุ 74–85 ปี: -':legacy?(r.plan.family==='wholelife50000'?'ครบสัญญาอายุ 99 ปี 100% ของทุน = 50,000 บาท · เบี้ยรวมเฉพาะปีนั้น':r.plan.family==='smart9999'?'ครบสัญญา: ค่าสูงกว่าระหว่างทุนกับ 101% ของเบี้ยที่ชำระทั้งหมด · เบี้ยรวมเฉพาะปีนั้น':'เบี้ยประกันรวม: เบี้ยหลักและสัญญาเพิ่มเติมเฉพาะปีนั้น ไม่สะสมข้ามปี'):'หลังเริ่มรับบำนาญ: เบี้ยสะสมหักเงินบำนาญสะสมที่ได้รับแล้ว (ไม่ต่ำกว่า 0 บาท)',M,784,{size:8});
 if(withRider)text(r.schedulePremiumDisplay==='modal'?'ตารางเบี้ยเพิ่มเติมต่องวดตามโหมดชำระ กลุ่มอาชีพ 1–2 การต่ออายุขึ้นกับเงื่อนไข ไม่มีอัตราไม่ใช่เบี้ยฟรี':'ตารางเบี้ยเพิ่มเติม รวมทุกงวดต่อปีตามอายุ กลุ่มอาชีพ 1–2 การต่ออายุขึ้นกับเงื่อนไข ไม่มีอัตราไม่ใช่เบี้ยฟรี',M,796,{size:7.5,maxWidth:W-2*M});


 drawPDFFooter(canvas.getContext('2d'),index,total);return canvas;
}
export async function createPDFReport(r,mode,{createCanvas=()=>document.createElement('canvas'),loadFont=()=>document.fonts.load('11px Sarabun','สรุปแผนบำนาญ')}={}){
 const [{PDFDocument,PDFString}]=await Promise.all([import('./assets/pdf-lib.min.mjs'),loadFont()]);
 const pdf=await PDFDocument.create();pdf.setTitle(`TYINSURE - ${r.plan.label}`);pdf.setAuthor('TYINSURE');pdf.setSubject('สรุปผลประโยชน์และความคุ้มครองรายปี');
 const layouts=reportPageLayouts(r);
 for(let i=0;i<layouts.length;i++){
  const canvas=drawPDFPage(createCanvas(),r,mode,layouts[i],i,layouts.length);
  const png=await pdf.embedPng(canvas.toDataURL('image/png'));
  const page=pdf.addPage([W,H]);page.drawImage(png,{x:0,y:0,width:W,height:H});
  const c=canvas.getContext('2d');c.font='8px Sarabun';
  addLineContactLink(pdf,page,PDFString,{withRider:r.type==='legacy'&&!!r.rider,textWidth:c.measureText(LINE_CONTACT_TEXT).width});
  canvas.width=0;canvas.height=0;
 }
 return new Blob([await pdf.save()],{type:'application/pdf'});
}
