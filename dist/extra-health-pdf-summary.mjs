import {LINE_CONTACT_TEXT} from './pdf-contact-link.mjs';
import {dhealthBenefits,DHEALTH_WAITING} from './dhealth-pdf-summary.mjs';
const W=595.28,H=841.89,M=28,WIDTH=W-2*M;
export const ELITE_LIMITS=[20000000,40000000,75000000,100000000];
const money=n=>n.toLocaleString('th-TH');
export function eliteBenefits(plan){
 return dhealthBenefits(5000000).map(([title,amount,note])=>{
  if(title.startsWith('1. ')){amount=`${money([10000,12000,15000,25000][plan-1])} บาท/วัน\nหรือห้องเดี่ยวมาตรฐาน\n(แล้วแต่จำนวนใดสูงกว่า)\nICU จ่ายตามจริง`;note='ห้องทั่วไปและ ICU รวมสูงสุด 365 วัน/ครั้ง · อัตราห้องเดี่ยวมาตรฐานในประเทศไทย';}
  if(title.startsWith('2.4 '))amount='100,000 บาท\nสำหรับกิน 30 วัน';
  if(title.startsWith('3. ')){amount='จ่ายตามจริง';note='สูงสุด 365 วันต่อการเข้าพักรักษาตัวเป็นผู้ป่วยในครั้งหนึ่ง';}
  if(title.startsWith('4. '))note+=' (เปลี่ยนอวัยวะ 1 ครั้งตลอดชีวิต)';
  if(title.startsWith('6.2 ')||title.startsWith('8. '))amount='จ่ายตามจริง\n(ไม่จำกัดครั้งใน 30 วัน)';
  if(/^9\. |^10\. |^11\. /.test(title))amount='จ่ายตามจริง';
  if(title.startsWith('11. ')){title='11. ค่าเคมีบำบัดและการรักษามะเร็งแบบออกฤทธิ์จำเพาะเจาะจง (Targeted Therapy)';}
  return [title,amount,note];
 });
}
// Four plan columns transcribed from the supplied extension-benefit table.
export const ELITE_EXTRA=[
 ['section','1. ผลประโยชน์กรณีผู้ป่วยใน'],
 ['ค่าปรึกษาแพทย์เฉพาะทางต่อการนอนโรงพยาบาลครั้งหนึ่ง รวมหมวด 3 สูงสุด 365 วัน',['จ่ายตามจริง','จ่ายตามจริง','จ่ายตามจริง','จ่ายตามจริง']],
 ['ค่าห้องพักในโรงพยาบาลสำหรับบิดาหรือมารดา (ห้องเสริม)',['ไม่คุ้มครอง','5,000 บาท/วัน','5,000 บาท/วัน','5,000 บาท/วัน']],
 ['ค่าฟื้นฟูสภาพผู้ป่วยใน สูงสุด 28 วัน/โรค/รอบปีกรมธรรม์',['ไม่คุ้มครอง','จ่ายตามจริง','จ่ายตามจริง','จ่ายตามจริง']],
 ['ค่าเครื่องมือทางการแพทย์และอุปกรณ์เทียม',['ไม่คุ้มครอง','ตามจริง\nสูงสุด 100,000 บาท\nตลอดชีวิต','ตามจริง\nสูงสุด 150,000 บาท\nตลอดชีวิต','ตามจริง\nสูงสุด 200,000 บาท\nตลอดชีวิต']],
 ['ค่าพยาบาลส่วนตัวตามคำแนะนำแพทย์ หลังนอนโรงพยาบาล สูงสุด 40 วัน/ปีกรมธรรม์',['ไม่คุ้มครอง','3,000 บาท/วัน','4,000 บาท/วัน','5,000 บาท/วัน']],
 ['ค่ารักษาทางจิตเวชแบบผู้ป่วยในต่อ 1 โรค',['ไม่คุ้มครอง','ไม่คุ้มครอง','75,000 บาท\nสูงสุด 300,000 บาท\nตลอดชีวิต','100,000 บาท\nสูงสุด 400,000 บาท\nตลอดชีวิต']],
 ['section','2. ผลประโยชน์กรณีรักษาพยาบาลแบบฉุกเฉิน'],
 ['ค่ารักษาทางทันตกรรมจากการบาดเจ็บเนื่องจากอุบัติเหตุ',['จ่ายตามจริง','จ่ายตามจริง','จ่ายตามจริง','จ่ายตามจริง']],
 ['ค่าบริการเคลื่อนย้ายฉุกเฉินทางการแพทย์',['จ่ายตามจริง','จ่ายตามจริง','จ่ายตามจริง','จ่ายตามจริง']],
 ['section','3. ผลประโยชน์กรณีผู้ป่วยนอก'],
 ['ค่าการวินิจฉัยขั้นสูง (MRI / CT SCAN / PET SCAN)',['จ่ายตามจริง','จ่ายตามจริง','จ่ายตามจริง','จ่ายตามจริง']],
 ['ค่าธรรมเนียมแพทย์ทั่วไป/เฉพาะทาง รวมค่าตรวจวินิจฉัยและยา สูงสุด 2 ครั้ง/วัน',['ไม่คุ้มครอง','20,000 บาท\nต่อปีกรมธรรม์','40,000 บาท\nต่อปีกรมธรรม์','จ่ายตามจริง\nสูงสุด 360 ครั้ง\nต่อปีกรมธรรม์']],
 ['การฝังเข็ม ธรรมชาติบำบัด กระดูกและกล้ามเนื้อบำบัด และการจัดกระดูกต่อปีกรมธรรม์',['ไม่คุ้มครอง','ไม่คุ้มครอง','10,000 บาท','40,000 บาท']],
 ['section','ผลประโยชน์สูงสุดต่อรอบปีกรมธรรม์ (ส่วนหลักและส่วนขยายรวมกัน)'],
 ['วงเงินรวม',[...ELITE_LIMITS.map(n=>money(n)+' บาท')]]
];
export const CARE_TREATMENTS={
 cancer:['รังสีรักษา (Radiotherapy)','รังสีร่วมรักษา (Interventional Radiological Treatment)','เวชศาสตร์นิวเคลียร์รักษา (Nuclear Medicine)','เคมีบำบัด (Cytotoxic Chemotherapy)','ภูมิคุ้มกันบำบัด (Immunotherapy)','ฮอร์โมนบำบัด (Hormonal Therapy)','การปลูกถ่ายเซลล์ต้นกำเนิด (Stem Cell Transplantation)','การรักษาแบบออกฤทธิ์จำเพาะเจาะจงต่อเซลล์มะเร็ง (Targeted Therapy)','ศัลยกรรมถอนรากถอนโคน (Radical Surgery)','รังสีศัลยกรรม (Radiosurgery)'],
 kidney:['การล้างไตผ่านเส้นเลือด อย่างน้อย 3 ครั้งต่อสัปดาห์ (Regular Hemodialysis)','การล้างไตทางช่องท้อง (Peritoneal Dialysis)','การล้างไตแบบประสิทธิภาพสูง (Online Hemodiafiltration)','การปลูกถ่ายไต (Kidney (Renal) Transplantation)','การผ่าตัดเส้นเลือดฟอกไต (Vascular Access)']
};
export function careBenefits(care){
 const names=care.condition==='both'?['โรคมะเร็ง','ไตวายเรื้อรัง']:[care.condition==='cancer'?'โรคมะเร็ง':'ไตวายเรื้อรัง'];
 return [
  [`1. ค่าบริการทางการแพทย์เพื่อบำบัดรักษา${names.join('และ')}`,'จ่ายตามจริง','ตรวจวินิจฉัยรวม CT Scan, MRI, PET และ Gait scans\nบำบัดรักษา โลหิตและส่วนประกอบของโลหิต และบริการทางการพยาบาล\nยา อาหารทางหลอดเลือด และเวชภัณฑ์ · แพทย์ตรวจรักษา · ผ่าตัดและหัตถการ'],
  ['ยาและเวชภัณฑ์กลับบ้านเพื่อรักษาต่อเนื่อง','100,000 บาท','สูงสุด 30 วัน ต่อการรักษาพยาบาลครั้งหนึ่ง'],
  ['2. ค่าบริการทางการแพทย์เพื่อบำบัดรักษาโรคทางจิตเวช',`${money(care.benefit===1000000?10000:50000)} บาท/ปี`,'ค่าตรวจวินิจฉัย/บำบัดโดยแพทย์ที่ได้รับการรับรองในประเทศไทย ยาทางจิตเวช จิตบำบัด\nค่ารักษาผู้ป่วยในแผนกจิตเวช ค่าห้องและค่าอาหาร ต่อรอบปีกรมธรรม์'],
  ['ผลประโยชน์สูงสุดต่อรอบปีกรมธรรม์',money(care.benefit)+' บาท',care.condition==='both'?'วงเงินรวมร่วมกันสำหรับมะเร็งและไตวายเรื้อรัง':'']
 ];
}
function painter(canvas,scale){
 canvas.width=Math.ceil(W*scale);canvas.height=Math.ceil(H*scale);const c=canvas.getContext('2d');c.scale(scale,scale);c.fillStyle='#FFF';c.fillRect(0,0,W,H);
 const seg=new Intl.Segmenter('th',{granularity:'word'});
 const text=(s,x,y,size=9,color='#36283b',bold=false)=>{c.font=`${bold?'bold ':''}${size}px Sarabun`;c.fillStyle=color;c.textAlign='left';c.textBaseline='alphabetic';c.fillText(s,x,y);};
 const wrap=(s,width,size)=>{c.font=`${size}px Sarabun`;const result=[];for(const p of s.split('\n')){let line='';for(const {segment} of seg.segment(p)){if(line&&c.measureText(line+segment).width>width){result.push(line);line=segment;}else line+=segment;}if(line)result.push(line);}return result;};
 const para=(s,x,y,width=WIDTH,size=8,leading=11)=>{for(const line of wrap(s,width,size)){text(line,x,y,size);y+=leading;}return y;};
 function table(rows,y,col=397){for(const [i,[title,amount,note='']] of rows.entries()){const a=wrap(title,col-M-14,8.5),b=wrap(note,col-M-14,7.7),v=wrap(amount,W-M-col-14,8.1),height=Math.max(23,a.length*11.5+b.length*10+8,v.length*11.5+8);c.fillStyle=i%2?'#FFF':'#F9F3F6';c.fillRect(M,y,WIDTH,height);let ty=y+12;for(const s of a){text(s,M+7,ty,8.5);ty+=11.5;}for(const s of b){text(s,M+7,ty,7.7,'#766775');ty+=10;}v.forEach((s,j)=>text(s,col+7,y+12+j*11.5,8.1));y+=height;c.fillStyle='#DDD4DA';c.fillRect(M,y-.5,WIDTH,.5);}return y;}
 function header(title,detail){text('TYINSURE',M,37,18,'#A13362',true);text(title,M,64,14,'#A13362',true);return para(detail,M,84,WIDTH,9,13)+9;}
 function band(title,y){c.fillStyle='#A13362';c.fillRect(M,y,WIDTH,22);text(title,M+7,y+15,9,'#FFF',true);return y+22;}
 function footer(y,index,total){if(y>790)throw Error('สรุปความคุ้มครองเกินพื้นที่ A4');text('สรุปเพื่อประกอบการพิจารณา รายละเอียดเป็นไปตามเงื่อนไขสัญญาเพิ่มเติม',M,799,7.5,'#766775');text(LINE_CONTACT_TEXT,M,819,8,'#338169');text(`หน้า ${index+1} / ${total}`,W-95,819,8,'#877b87');}
 return {c,text,wrap,para,table,header,band,footer};
}
export function drawExtraHealthSummary(canvas,r,kind,index,total,scale=3){
 const p=painter(canvas,scale);let y;
 if(kind==='elite'){
  const limit=ELITE_LIMITS[r.health.plan-1];y=p.header('Elite Health Plus · สรุปผลประโยชน์โดยย่อ',`${r.health.detail} · วงเงิน ${money(limit)} บาท/ปีกรมธรรม์`);
  y=p.band('หมวดความคุ้มครองหลัก',y);p.text('วงเงินตามแผนที่เลือก',404,y-7,9,'#FFF',true);y=p.table(eliteBenefits(r.health.plan),y);
  y=p.para(`ผลประโยชน์ส่วนหลักและส่วนขยายรวมสูงสุด ${money(limit)} บาทต่อรอบปีกรมธรรม์`,M,y+15,WIDTH,8.3);
  y=p.band('ระยะเวลาที่ไม่คุ้มครอง (Waiting period)',y+6);
  for(const [period,conditions] of DHEALTH_WAITING){p.text(period,M,y+12,8.1,'#A13362',true);y=p.para(conditions,M+54,y+12,WIDTH-54,7.8,10.5)+3;}
  y=p.para('นับจากวันเริ่มมีผลคุ้มครอง หรือการต่ออายุครั้งสุดท้าย แล้วแต่กรณีใดเกิดขึ้นภายหลัง · กลุ่มโรค 120 วัน รวมโรคแทรกซ้อน',M,y+3,WIDTH,7.5,10.5);
 }else if(kind==='elite-extra'){
  const planIndex=r.health.plan-1,limit=ELITE_LIMITS[planIndex];
  y=p.header('Elite Health Plus · ผลประโยชน์ส่วนขยาย',`${r.health.detail} · วงเงิน ${money(limit)} บาท/ปีกรมธรรม์`);
  y=p.band('รายละเอียด',y);p.text(`วงเงิน ${limit/1000000} ล้านบาท`,404,y-7,9,'#FFF',true);
  let group=[];
  for(const [title,values] of ELITE_EXTRA){
   if(title==='section'){
    y=p.table(group,y);group=[];
    p.c.fillStyle='#EDE4EA';p.c.fillRect(M,y,WIDTH,23);p.text(values,M+7,y+15,8.2,'#A13362',true);y+=23;
   }else group.push([title,values[planIndex]]);
  }
  y=p.table(group,y);
 }else{
  const care=r.care??r.health;y=p.header('Care Plus · สรุปผลประโยชน์โดยย่อ',care.detail);y=p.band('ผลประโยชน์สำหรับผู้ป่วยในและผู้ป่วยนอก',y);p.text('วงเงินตามแผนที่เลือก',404,y-7,9,'#FFF',true);y=p.table(careBenefits(care),y);
  const conditions=care.condition==='both'?['cancer','kidney']:[care.condition];
  for(const condition of conditions){
   y=p.band(condition==='cancer'?'การรักษาโรคมะเร็ง':'การรักษาไตวายเรื้อรัง',y+15);y+=6;
   CARE_TREATMENTS[condition].forEach((s,i)=>{
    const lines=p.wrap(s,WIDTH-46,8.6),height=Math.max(24,lines.length*12+12);
    p.c.fillStyle=i%2?'#FFFFFF':'#F9F3F6';p.c.fillRect(M,y,WIDTH,height);
    p.text(String(i+1).padStart(2,'0'),M+9,y+16,8.4,'#A13362',true);
    lines.forEach((line,j)=>p.text(line,M+34,y+16+j*12,8.6));
    y+=height;p.c.fillStyle='#E8DEE4';p.c.fillRect(M,y-.5,WIDTH,.5);
   });
  }
 }
 p.footer(y,index,total);return canvas;
}
