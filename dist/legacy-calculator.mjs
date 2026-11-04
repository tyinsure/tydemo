import {addPARider} from './pa-easy.mjs';
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export function calculateLegacy(data,input){
 const age=Number(input.age),amount=Number(input.amount),gender=input.gender;
 if(input.age===''||!Number.isInteger(age)||age<0||age>70)throw Error('กรุณาระบุอายุเต็มปีตั้งแต่ 0–70 ปี ตามตารางอัตราเบี้ย');
 if(!['male','female'].includes(gender))throw Error('กรุณาเลือกเพศ');
 if(!['sum','premium'].includes(input.mode))throw Error('กรุณาเลือกวิธีคำนวณ');
 if(!Number.isFinite(amount)||amount<.01||amount>1e12)throw Error('กรุณาระบุจำนวนเงินระหว่าง 0.01–1,000,000,000,000 บาท');
 const frequency=data.frequencies.find(f=>f.id===input.frequency);
 if(!frequency)throw Error('กรุณาเลือกงวดชำระเบี้ย');
 const rate=data.rates.find(row=>row.age===age)?.[gender]?.[frequency.rateIndex];
 if(!(rate>0))throw Error('ไม่มีอัตราเบี้ยสำหรับข้อมูลนี้');
 const sum=input.mode==='sum'?round(amount):round(amount*1000/rate);
 const premium=input.mode==='premium'?round(amount):round(sum*rate/1000);
 if(sum<.01||premium<.01)throw Error('จำนวนเงินน้อยเกินกว่าจะคำนวณเป็นทศนิยม 2 ตำแหน่ง');
 const periods=frequency.payments,annualPaid=round(premium*periods),totalPaid=round(premium*periods*20),schedule=[];
 // Each policy-year row aggregates all scheduled instalments for that year.
 // Age is age at the start of the policy year; maturity has its own final row.
 for(let year=1;year<=99-age;year++){
  const paid=round(premium*periods*Math.min(year,20));
  schedule.push({age:age+year-1,policyYear:year,pay:year<=20?annualPaid:0,paid,coverage:Math.max(sum,paid),maturity:0});
 }
 schedule.push({age:99,policyYear:99-age,pay:0,paid:totalPaid,coverage:0,maturity:sum});

 return addPARider({type:'legacy',plan:{label:data.name},mode:input.mode,gender,age,rate,sum,premium,frequency,annualPaid,totalPaid,payYears:20,maturityAge:99,maturityAmount:sum,schedule,initialCoverage:Math.max(sum,premium)},input);
}
export function legacySummary(r){
 const m=n=>n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
 return ['สรุปแผนสร้างมรดก TYINSURE',r.plan.label,`เพศ${r.gender==='male'?'ชาย':'หญิง'} อายุ ${r.age} ปี`,`ทุนประกัน ${m(r.sum)} บาท`,`เบี้ย${r.frequency.label} ${m(r.premium)} บาท/งวด`,`ชำระเบี้ย 20 ปี รวม ${m(r.totalPaid)} บาท`,`คุ้มครองถึงอายุ 99 ปี`, 'กรณีเสียชีวิต: จ่ายจำนวนที่สูงที่สุดระหว่างทุนประกัน มูลค่าเวนคืนขณะนั้น และเบี้ยประกันสะสมที่ชำระแล้ว',`หากมีชีวิตอยู่ครบสัญญาอายุ 99 ปี รับ ${m(r.maturityAmount)} บาท`, 'ตารางนี้แสดงความคุ้มครองขั้นต่ำจากทุนและเบี้ยสะสม ยังไม่รวมการเปรียบเทียบมูลค่าเวนคืน', ...(r.rider?['',`สัญญาเพิ่มเติม PA Easy Plan Rider ${r.rider.name} (กลุ่มอาชีพ ${r.rider.occupation})`,`เบี้ยสัญญาเพิ่มเติม${r.frequency.label} ปีแรก ${m(r.rider.premium)} บาท/งวด`,`เบี้ยหลักและสัญญาเพิ่มเติมรวมปีแรก ${m(r.combinedFirstYearPremium)} บาท/งวด`, `รวมชำระปีแรก ${m(r.combinedFirstYearAnnual)} บาท/ปี`,`อุบัติเหตุที่ไม่ใช่ขับขี่/โดยสารรถจักรยานยนต์ คุ้มครองสูงสุด ${m(r.rider.accident)} บาท`,`ค่ารักษาพยาบาลต่ออุบัติเหตุสูงสุด ${m(r.rider.medical)} บาท`,...(r.rider.holiday?['เลือกขยายความคุ้มครองวันหยุดนักขัตฤกษ์ รวมเบี้ยเพิ่มแล้ว']:[]),'เบี้ย PA ปรับตามช่วงอายุ การต่ออายุขึ้นกับเงื่อนไขสัญญา เบี้ย PA ไม่รวมในเบี้ยสะสมของสัญญาหลัก']:[]), 'ทัก LINE @TYINSURE','https://line.me/R/ti/p/@tyinsure'].join('\n');
}
