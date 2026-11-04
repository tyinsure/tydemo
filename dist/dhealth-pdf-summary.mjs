import {LINE_CONTACT_TEXT} from './pdf-contact-link.mjs';
const W=595.28,H=841.89,M=28,COL=411;
export function dhealthBenefits(benefit){
 const room=benefit===5000000?'4,000':'2,000';
 return [
  ['1. ค่าห้อง ค่าอาหาร และค่าบริการโรงพยาบาล (ผู้ป่วยใน)',`ห้องทั่วไป ${room} บาท/วัน\nICU จ่ายตามจริง`, 'ห้องทั่วไปและ ICU รวมสูงสุด 180 วัน/ครั้ง · ICU สูงสุด 60 วัน/ครั้ง'],
  ['2. ค่าตรวจวินิจฉัย รักษา ยา สารอาหารทางหลอดเลือด เลือด และเวชภัณฑ์','จ่ายตามจริง','2.1 ตรวจวินิจฉัย · 2.2 รักษา ยา และบริการทางการแพทย์ · 2.3 เลือดและเวชภัณฑ์'],
  ['2.4 ยาและเวชภัณฑ์กลับบ้าน','20,000 บาท\nสำหรับกิน 14 วัน',''],
  ['3. ค่าผู้ประกอบวิชาชีพเวชกรรม (แพทย์) ตรวจรักษาผู้ป่วยใน',`${room} บาท/วัน`,'สูงสุด 180 วันต่อการเข้าพักรักษาตัวเป็นผู้ป่วยในครั้งหนึ่ง'],
  ['4. ค่าผ่าตัดและหัตถการ','จ่ายตามจริง','4.1 ห้องผ่าตัด/หัตถการ · 4.2 ยา เลือด เวชภัณฑ์ และอุปกรณ์\n4.3 แพทย์ผ่าตัดและผู้ช่วย · 4.4 วิสัญญีแพทย์ · 4.5 ผ่าตัดเปลี่ยนอวัยวะ'],
  ['5. การผ่าตัดใหญ่ที่ไม่ต้องนอนโรงพยาบาล (Day Surgery)','จ่ายตามจริง',''],
  ['6. ค่ารักษาก่อนและหลังการเข้าพักรักษาตัวเป็นผู้ป่วยใน','',''],
  ['6.1 ตรวจวินิจฉัยที่เกี่ยวข้องโดยตรง','จ่ายตามจริง','ภายใน 30 วันก่อน/หลังนอนโรงพยาบาล'],
  ['6.2 รักษาผู้ป่วยนอกต่อเนื่อง','จ่ายตามจริง\n(ไม่จำกัดครั้งใน 30 วัน)','ภายใน 30 วันหลังออกจากโรงพยาบาล (ไม่รวมค่าตรวจวินิจฉัย)'],
  ['7. ค่ารักษาการบาดเจ็บจากอุบัติเหตุแบบผู้ป่วยนอก','จ่ายตามจริง','ภายใน 24 ชั่วโมงของการเกิดอุบัติเหตุแต่ละครั้ง'],
  ['8. ค่าเวชศาสตร์ฟื้นฟู (กายภาพบำบัด) หลังเข้าพักรักษาตัวเป็นผู้ป่วยใน','จ่ายตามจริง\n(ไม่จำกัดครั้ง)','แต่ละครั้งต่อการเข้าพักรักษาตัวเป็นผู้ป่วยในครั้งหนึ่ง'],
  ['9. ค่าล้างไตผ่านทางเส้นเลือด เพื่อรักษาโรคไตเรื้อรัง','ไม่คุ้มครอง\n(สามารถใช้ Care Plus ช่วยได้)',''],
  ['10. ค่ารังสีรักษา รังสีร่วมรักษา และเวชศาสตร์นิวเคลียร์รักษามะเร็ง','ไม่คุ้มครอง\n(สามารถใช้ Care Plus ช่วยได้)',''],
  ['11. ค่าเคมีบำบัดรักษาโรคมะเร็ง','ไม่คุ้มครอง\n(สามารถใช้ Care Plus ช่วยได้)',''],
  ['12. ค่าบริการรถพยาบาลฉุกเฉิน','จ่ายตามจริง',''],
  ['13. ค่ารักษาพยาบาลโดยการผ่าตัดเล็ก','จ่ายตามจริง','']
 ];
}
export const DHEALTH_WAITING=[
 ['30 วัน','การเจ็บป่วยใด ๆ'],
 ['120 วัน','เนื้องอก ถุงน้ำ หรือมะเร็งทุกชนิด · ริดสีดวงทวาร · ไส้เลื่อนทุกชนิด · ต้อเนื้อหรือต้อกระจก · การตัดทอนซิลหรืออดีนอยด์ · นิ่วทุกชนิด · เส้นเลือดขอดที่ขา · เยื่อบุโพรงมดลูกเจริญผิดที่']
];
export function drawDHealthBenefits(canvas,r,index,total,scale){
 canvas.width=Math.ceil(W*scale);canvas.height=Math.ceil(H*scale);
 const c=canvas.getContext('2d');c.scale(scale,scale);c.fillStyle='#FFFFFF';c.fillRect(0,0,W,H);
 const text=(s,x,y,size=9,color='#36283b',bold=false)=>{c.font=`${bold?'bold ':''}${size}px Sarabun`;c.fillStyle=color;c.textAlign='left';c.textBaseline='alphabetic';c.fillText(s,x,y);};
 const segments=new Intl.Segmenter('th',{granularity:'grapheme'});
 function wrap(s,width,size){c.font=`${size}px Sarabun`;const lines=[];for(const part of s.split('\n')){let line='';for(const {segment} of segments.segment(part)){if(line&&c.measureText(line+segment).width>width){lines.push(line);line=segment;}else line+=segment;}if(line)lines.push(line);}return lines;}
 function paragraph(s,x,y,width,size=8.4,leading=12,color='#36283b'){const lines=wrap(s,width,size);for(const line of lines){text(line,x,y,size,color);y+=leading;}return y;}
 text('TYINSURE',M,37,18,'#A13362',true);
 text('D Health Lite · สรุปผลประโยชน์โดยย่อ',M,64,14,'#A13362',true);
 text(r.health.detail,M,84,9);
 let y=paragraph('จ่ายค่ารักษาที่จำเป็นทางการแพทย์ตามจริง ภายใต้วงเงินและเงื่อนไขสัญญา หักส่วนแรก/ส่วนร่วมจ่าย (ถ้ามี)',M,101,W-2*M,8.2);
 c.fillStyle='#A13362';c.fillRect(M,y-2,W-2*M,23);
 text('หมวดความคุ้มครอง',M+7,y+13,9,'#FFFFFF',true);text(`แผน ${r.health.benefit===5000000?'5':'1'} ล้านบาท`,COL+7,y+13,9,'#FFFFFF',true);y+=21;
 for(const [i,[title,amount,note]] of dhealthBenefits(r.health.benefit).entries()){
  const titles=wrap(title,COL-M-14,8.7),notes=wrap(note,COL-M-14,7.9),amounts=wrap(amount,W-M-COL-14,8.3);
  const height=Math.max(23,titles.length*12+notes.length*10.5+8,amounts.length*12+8);
  c.fillStyle=i%2?'#FFFFFF':'#F9F3F6';c.fillRect(M,y,W-2*M,height);
  let ty=y+13;for(const s of titles){text(s,M+7,ty,8.7);ty+=12;}for(const s of notes){text(s,M+7,ty,7.9,'#766775');ty+=10.5;}
  amounts.forEach((s,j)=>text(s,COL+7,y+13+j*12,8.3,amount.startsWith('ไม่คุ้มครอง')?'#A13362':'#36283b'));
  y+=height;c.fillStyle='#DDD4DA';c.fillRect(M,y-0.5,W-2*M,.5);
 }
 y+=16;text(`วงเงินรวมต่อการนอนโรงพยาบาลหนึ่งครั้ง: ${r.health.benefit.toLocaleString('th-TH')} บาท`,M,y,9,'#A13362',true);
 y=paragraph('รวมหมวด 1–8 และ 12–13 ภายใต้วงเงินย่อยแต่ละหมวด · ผลประโยชน์สูงสุดต่อรอบปีกรมธรรม์: ไม่มี',M,y+14,W-2*M,8);
 y+=7;text('ระยะเวลาที่ไม่คุ้มครอง (Waiting period)',M,y,9,'#A13362',true);y+=14;
 for(const [period,conditions] of DHEALTH_WAITING){text(period,M,y,8.3,'#A13362',true);y=paragraph(conditions,M+54,y,W-2*M-54,8.1,11.5)+3;}
 y=paragraph('นับจากวันเริ่มมีผลคุ้มครองตามสัญญาเพิ่มเติม หรือการต่ออายุครั้งสุดท้าย แล้วแต่กรณีใดเกิดขึ้นภายหลัง · กลุ่มโรค 120 วัน รวมทั้งโรคแทรกซ้อน',M,y+2,W-2*M,7.6,11);
 if(y>799)throw Error('สรุป D Health Lite เกินพื้นที่ A4');
 text('สรุปเพื่อประกอบการพิจารณา รายละเอียดเป็นไปตามเงื่อนไขสัญญาเพิ่มเติม',M,799,7.5,'#766775');
 text(LINE_CONTACT_TEXT,M,819,8,'#338169');text(`หน้า ${index+1} / ${total}`,W-95,819,8,'#877b87');
 return canvas;
}
