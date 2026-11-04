import {pensionRanges} from './calculator.mjs';
const money=n=>Number(n).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});

export function createCustomerSummary(r){
 if(!r)return '';
 const plan=r.plan.label.startsWith('90/5')?`เฟล็กซี่ รีไทร์ ${r.plan.label}`:r.plan.label;
 const pensions=pensionRanges(r.plan).map(({start,end})=>{
  const row=r.schedule.find(row=>row.age===start);
  return `• อายุ ${start===end?start:`${start}–${end}`} ปี: ปีละ ${money(row.pension)} บาท`;
 });
 return [
 'สรุปแผนบำนาญสำหรับคุณ',
 `แผน ${plan}`,
 `สำหรับเพศ${r.gender==='male'?'ชาย':'หญิง'} อายุเริ่มทำประกัน ${r.age} ปี`,
 '',
 'เบี้ยประกัน',
 r.frequency?`• เบี้ย${r.frequency.label} ${money(r.premium)} บาท/งวด (${r.frequency.payments} งวด/ปี) ชำระ ${r.payYears} ปี`:r.plan.kind==='single_premium'?`• เบี้ยชำระครั้งเดียว ${money(r.premium)} บาท (อายุ ${r.age} ปี)`:`• เบี้ยรายปี ${money(r.premium)} บาท ชำระ ${r.payYears} ปี (อายุ ${r.age}–${r.age+r.payYears-1} ปี)`,
 '',
 `เริ่มรับเงินบำนาญอายุ ${r.plan.pensionAge} ปี ถึงอายุ ${r.plan.maturityAge??90} ปี`,
 ...pensions,
 `รวมเงินบำนาญ ${money(r.totalReceived)} บาท`,
 '',
 'ความคุ้มครองกรณีเสียชีวิต',
 ...(r.plan.family==='mt8560'?['• ก่อนเริ่มรับบำนาญ: 100% ของทุนถึงอายุ 44 ปี อายุ 45–59 ปีเพิ่มปีละ 10% เป็น 110–250% ของทุน','• หลังรับบำนาญ อายุ 60–73 ปี: มูลค่าปัจจุบันของบำนาญที่ยังไม่ได้รับตามตารางรับรอง 15 ปี × ทุนประกัน ÷ 1,000 · อายุ 74–85 ปี: -']:['• ก่อนเริ่มรับบำนาญ: อย่างน้อย 105% ของเบี้ยประกันที่ชำระสะสม','• หลังเริ่มรับบำนาญ: เบี้ยประกันที่ชำระสะสม หักเงินบำนาญสะสมที่ได้รับแล้ว']),
 '',
 'ปรึกษาหรือสอบถามเพิ่มเติม ทัก LINE @TYINSURE',
 'https://line.me/R/ti/p/@tyinsure'
 ].join('\n');
}

export async function copyPlainText(text,{navigatorObject=globalThis.navigator,documentObject=globalThis.document}={}){
 if(!text.trim())throw Error('ไม่มีข้อความสำหรับคัดลอก');
 if(navigatorObject?.clipboard?.writeText){
  try{await navigatorObject.clipboard.writeText(text);return 'clipboard';}catch{}
 }
 if(!documentObject)throw Error('ไม่สามารถเข้าถึงคลิปบอร์ดได้');
 const previous=documentObject.activeElement;
 const temporary=documentObject.createElement('textarea');
 temporary.value=text;temporary.setAttribute('readonly','');temporary.style.position='fixed';temporary.style.left='-9999px';temporary.style.top='0';temporary.style.opacity='0';
 documentObject.body.appendChild(temporary);
 try{
  temporary.focus();temporary.select();temporary.setSelectionRange(0,text.length);
  if(!documentObject.execCommand?.('copy'))throw Error('กรุณาเลือกข้อความและคัดลอกด้วยตนเอง');
  return 'legacy';
 }finally{temporary.remove();previous?.focus?.({preventScroll:true});}
}
