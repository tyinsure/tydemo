import {elapsedYearLabel} from './elapsed-year.mjs';
import {scheduleUnit} from './schedule-premium-view.mjs';
import {schedulePremiumValues} from './legacy-schedule-view.mjs';
import {LINE_CONTACT_TEXT,addLineContactLink} from './pdf-contact-link.mjs';
const W=595.28,H=841.89,M=28,TABLE_BOTTOM=738,ROW=20;
const money=n=>Number(n).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
export function reportPageLayouts(r){
 const pages=[];let offset=0;
 while(offset<r.schedule.length){
  const first=pages.length===0,top=r.rider?(first?252:118):(first?226:100),capacity=Math.floor((TABLE_BOTTOM-top-36)/ROW);
  const rows=r.schedule.slice(offset,offset+capacity);pages.push({first,top,rows});offset+=rows.length;
 }
 return pages;
}
export function drawPDFPage(canvas,r,mode,layout,index,total,scale=3){
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
 text(legacy?'สรุปแผนสร้างมรดก':'สรุปแผนบำนาญ',W-M,37,{size:15,align:'right',bold:true});
 line(M,55,W-M,55,'#A13362');
 text(r.plan.label,M,71,{size:11,bold:true,maxWidth:W-2*M});
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
   text(`สัญญาเพิ่มเติม PA Easy Plan ${r.rider.name} · กลุ่มอาชีพ ${r.rider.occupation}${r.rider.holiday?' · เพิ่มเบี้ยวันหยุดแล้ว':''}`,M,219,{size:9,bold:true,color:'#A13362',maxWidth:W-2*M});
   text(`เบี้ย PA ปีแรก ${money(r.rider.premium)} บาท/งวด (${r.frequency.label}) · เบี้ยรวมปีแรก ${money(r.combinedFirstYearAnnual)} บาท/ปี`,M,235,{size:9,maxWidth:W-2*M});
  }else text(`PA Easy Plan ${r.rider.name} · เบี้ยสัญญาเพิ่มเติมปรับตามอายุ`,M,104,{size:8,color:'#A13362'});
 }
 const scheduleDisplay=r.schedulePremiumDisplay,unit=scheduleUnit(r,scheduleDisplay);
 const headers=withRider?[['อายุ','ปีที่ (เริ่ม 0)'],['เบี้ยประกันชีวิต',`(บาท/${unit})`],['เบี้ยPA',`(บาท/${unit})`],[scheduleDisplay?'เบี้ยประกันรวม':'เบี้ยหลักสะสม',scheduleDisplay?`(บาท/${unit})`:'(บาท)'],['ประกันชีวิต*','(บาท)'],['เงินครบสัญญา','(บาท)']]:legacy?[['อายุ','ปีที่ (เริ่ม 0)'],['เบี้ยในช่วง','(บาท)'],['เบี้ยสะสม','(บาท)'],['ประกันชีวิต*','(บาท)'],['เงินครบสัญญา','(บาท)']]:[['อายุ','ปีที่ (เริ่ม 0)'],['เบี้ยที่ชำระ',r.plan.kind==='single_premium'?'(บาท)':`(บาท/${unit})`],['อัตรา','บำนาญ'],['เงินบำนาญ','(บาท/ปี)'],['บำนาญสะสม','(บาท)'],['ประกันชีวิต*','(บาท)']];
 c.fillStyle='#A13362';c.fillRect(M,layout.top,W-2*M,36);
 let x=M;headers.forEach((lines,j)=>{lines.forEach((s,k)=>text(s,x+widths[j]/2,layout.top+11+k*14,{size:j===0&&k===1?6:9,color:'#FFFFFF',bold:true,align:'center'}));x+=widths[j];});
 layout.rows.forEach((row,i)=>{
  const y=layout.top+36+i*ROW,milestone=(legacy?[r.age,r.age+19,99]:[r.plan.pensionAge,71,76,81,86]).includes(row.age);
  c.fillStyle=milestone?'#F9EAF1':i%2?'#FCFAFB':'#FFFFFF';c.fillRect(M,y,W-2*M,ROW);
  const premiums=withRider?schedulePremiumValues(r,row,scheduleDisplay):null;
  let x=M;const values=withRider?[row.age,premiums.main?money(premiums.main):'-',premiums.rider===null?'ไม่มีอัตรา':money(premiums.rider),scheduleDisplay?(premiums.total===null?'ไม่มีอัตรา':money(premiums.total)):money(row.paid),row.coverage?money(row.coverage):'-',row.maturity?money(row.maturity):'-']:legacy?[row.age,row.pay?money(row.pay):'-',money(row.paid),row.coverage?money(row.coverage):'-',row.maturity?money(row.maturity):'-']:[row.age,row.pay?money(row.pay):'-',row.pct?`${Math.round(row.pct*100)}%`:'-',row.pension?money(row.pension):'-',row.received?money(row.received):'-',row.coverage===null?'-':row.coverage?money(row.coverage):'-'];
  values.forEach((v,j)=>{text(v,j===0?x+widths[j]/2:x+widths[j]-6,y+(j===0?6:ROW/2),{size:j===0?8:9,bold:milestone,align:j===0?'center':'right',color:(legacy?j===(withRider?4:3)&&row.coverage:j===3&&row.pension)?'#A13362':'#36283b',maxWidth:widths[j]-10});if(j===0)text(elapsedYearLabel(r,row),x+widths[j]/2,y+15,{size:6.5,align:'center',color:'#877b87',maxWidth:widths[j]-6});x+=widths[j];});
  line(M,y+ROW,W-M,y+ROW);
 });
 const bottom=layout.top+36+layout.rows.length*ROW;x=M;
 for(const width of [...widths,0]){line(x,layout.top,x,bottom);x+=width;}
 line(M,759,W-M,759,'#A13362');
 text(r.plan.family==='mt8560'?'* ก่อนบำนาญ: 100% ของทุนถึงอายุ 44 ปี อายุ 45–59 ปีเพิ่มเป็น 110–250%':legacy?'* ความคุ้มครองขั้นต่ำ = ค่าสูงกว่าระหว่างทุนและเบี้ยสะสม ยังไม่รวมมูลค่าเวนคืน':'* ก่อนรับบำนาญ: ความคุ้มครองขั้นต่ำ 105% ของเบี้ยประกันที่ชำระสะสม',M,774,{size:8});
 text(r.plan.family==='mt8560'?'อายุ 60–73 ปี: มูลค่าปัจจุบันตามตาราง × ทุน ÷ 1,000 · อายุ 74–85 ปี: -':legacy?'อายุ ณ ต้นปี เบี้ยสะสมคิดหลังชำระครบทุกงวดของปีนั้น แถวสุดท้ายครบอายุ 99 ปี':'หลังเริ่มรับบำนาญ: เบี้ยสะสมหักเงินบำนาญสะสมที่ได้รับแล้ว (ไม่ต่ำกว่า 0 บาท)',M,788,{size:8});
 if(withRider)text(scheduleDisplay==='modal'?'ตารางเบี้ยต่องวดตามโหมดชำระ กลุ่มอาชีพ 1 การต่ออายุขึ้นกับเงื่อนไข ไม่มีอัตราไม่ใช่เบี้ยฟรี':'ตาราง PA รวมทุกงวดต่อปีตามอายุ กลุ่มอาชีพ 1 การต่ออายุขึ้นกับเงื่อนไข ไม่มีอัตราไม่ใช่เบี้ยฟรี',M,800,{size:7.5,maxWidth:W-2*M});
 text(LINE_CONTACT_TEXT,M,withRider?819:809,{size:8,color:'#338169'});
 text(`หน้า ${index+1} / ${total}`,W-M,withRider?819:809,{size:8,color:'#877b87',align:'right'});
 return canvas;
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
