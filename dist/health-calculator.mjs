import {addPARider} from './pa-easy.mjs';
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export function calculateLegacy(data,input){
 if(input.mainPlan==='wholelife50000')return calculateWholeLife50000(data,input);
 if(input.mainPlan&&input.mainPlan!=='smart9920')return calculateSmart9999(data,input);
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
 if(sum<200000)throw Error('สมาร์ท โพรเทคชั่น 99/20: ทุนประกันขั้นต่ำ 200,000 บาท');
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
 return ['สรุปแผนสร้างมรดก TYINSURE',r.plan.label,`เพศ${r.gender==='male'?'ชาย':'หญิง'} อายุ ${r.age} ปี`,`ทุนประกัน ${m(r.sum)} บาท`,`เบี้ย${r.frequency.label} ${m(r.premium)} บาท/งวด`,`ชำระเบี้ย ${r.payYears} ปี รวม ${m(r.totalPaid)} บาท`,`คุ้มครองถึงอายุ 99 ปี`, r.plan.family==='wholelife50000'?'กรณีเสียชีวิต: ความคุ้มครอง 100% ของทุนประกัน 50,000 บาทตามภาพ':r.plan.family==='smart9999'?'กรณีเสียชีวิต: จ่ายจำนวนที่สูงที่สุดระหว่างทุนประกัน มูลค่าเวนคืนขณะนั้น และ 101% ของเบี้ยประกันสะสมที่ชำระแล้ว':'กรณีเสียชีวิต: จ่ายจำนวนที่สูงที่สุดระหว่างทุนประกัน มูลค่าเวนคืนขณะนั้น และเบี้ยประกันสะสมที่ชำระแล้ว',`หากมีชีวิตอยู่ครบสัญญาอายุ 99 ปี รับ ${m(r.maturityAmount)} บาท`, r.plan.family==='wholelife50000'?'ความคุ้มครองและเงินครบสัญญา 100% ของทุนประกันตามภาพ เบี้ยสัญญาเพิ่มเติมรวมปีแรกต้องไม่น้อยกว่า 5,000 บาท':r.plan.family==='smart9999'?'ตารางแสดงค่าสูงกว่าระหว่างทุนกับ 101% ของเบี้ยสะสม ยังไม่รวมการเทียบมูลค่าเวนคืน เงินครบสัญญาใช้ค่าสูงกว่าระหว่างทุนกับ 101% ของเบี้ยที่ชำระทั้งหมด':'ตารางนี้แสดงความคุ้มครองขั้นต่ำจากทุนและเบี้ยสะสม ยังไม่รวมการเปรียบเทียบมูลค่าเวนคืน', ...(r.rider?['',`สัญญาเพิ่มเติม PA Easy Plan Rider ${r.rider.name} (กลุ่มอาชีพ ${r.rider.occupation})`,`เบี้ยสัญญาเพิ่มเติม${r.frequency.label} ปีแรก ${m(r.rider.premium)} บาท/งวด`,`เบี้ยหลักและสัญญาเพิ่มเติมรวมปีแรก ${m(r.combinedFirstYearPremium)} บาท/งวด`, `รวมชำระปีแรก ${m(r.combinedFirstYearAnnual)} บาท/ปี`,`อุบัติเหตุที่ไม่ใช่ขับขี่/โดยสารรถจักรยานยนต์ คุ้มครองสูงสุด ${m(r.rider.accident)} บาท`,`ค่ารักษาพยาบาลต่ออุบัติเหตุสูงสุด ${m(r.rider.medical)} บาท`,...(r.rider.holiday?['เลือกขยายความคุ้มครองวันหยุดนักขัตฤกษ์ รวมเบี้ยเพิ่มแล้ว']:[]),'เบี้ย PA ปรับตามช่วงอายุ การต่ออายุขึ้นกับเงื่อนไขสัญญา เบี้ย PA ไม่รวมในเบี้ยสะสมของสัญญาหลัก']:[]), 'ทัก LINE @TYINSURE','https://line.me/R/ti/p/@tyinsure'].join('\n');
}

export function calculateSmart9999(data,input){
 const age=Number(input.age),amount=Number(input.amount),gender=input.gender;
 if(input.age===''||!Number.isInteger(age)||age<0||age>90)throw Error('กรุณาระบุอายุ 0–90 ปี ตามตารางเบี้ย 99/99');
 if(age===0&&!input.mainAtLeast30Days)throw Error('สมาร์ท โพรเทคชั่น 99/99 เริ่มอายุ 30 วัน กรุณายืนยันอายุอย่างน้อย 30 วัน');
 if(!['male','female'].includes(gender))throw Error('กรุณาเลือกเพศ');
 if(!['sum','premium'].includes(input.mode))throw Error('กรุณาเลือกวิธีคำนวณ');
 if(!Number.isFinite(amount)||amount<=0)throw Error('กรุณาระบุจำนวนเงินมากกว่า 0');
 const small=input.mainPlan==='smart9999-small';
 if(!small&&input.mainPlan!=='smart9999-large')throw Error('กรุณาเลือกสัญญาหลัก');
 const frequency=data.frequencies.find(f=>f.id===input.frequency);
 if(!frequency)throw Error('กรุณาเลือกงวดชำระเบี้ย');
 const product=data.smart9999;if(!product)throw Error('โหลดอัตราเบี้ย 99/99 ไม่สำเร็จ');
 const inRange=sum=>sum>=(small?50001:200000)&&sum<=(small?199999:9999999.99);
 const candidates=[];
 for(const band of product.bands){
  const rate=band.rates.find(r=>r.age===age)?.[gender]?.[frequency.rateIndex];
  if(!(rate>0))continue;
  const sum=input.mode==='sum'?round(amount):round(amount*1000/rate);
  if(inRange(sum)&&sum>=band.min&&sum<band.maxExclusive)candidates.push({sum,rate,band});
 }
 if(!candidates.length)throw Error(small?'กรุณาระบุทุน 50,001–199,999 บาท หรือเบี้ยที่คำนวณได้ทุนในช่วงนี้':'กรุณาระบุทุน 200,000 ถึงน้อยกว่า 10,000,000 บาทตาม PDF หรือเบี้ยที่คำนวณได้ทุนในช่วงนี้');
 if(candidates.length>1)throw Error('เบี้ยนี้คำนวณได้ทุนหลายช่วงอัตรา กรุณาเลือกคำนวณจากทุนประกันเพื่อระบุแผนให้แน่นอน');
 const {sum,rate,band}=candidates[0],premium=input.mode==='premium'?round(amount):round(sum*rate/1000);
 const payYears=99-age,annualPaid=round(premium*frequency.payments),totalPaid=round(premium*frequency.payments*payYears),schedule=[];
 for(let year=1;year<=payYears;year++){
  const paid=round(premium*frequency.payments*year);
  schedule.push({age:age+year-1,policyYear:year,pay:annualPaid,paid,coverage:Math.max(sum,round(paid*1.01)),maturity:0});
 }
 const maturityAmount=Math.max(sum,round(totalPaid*1.01));
 schedule.push({age:99,policyYear:payYears,pay:0,paid:totalPaid,coverage:0,maturity:maturityAmount});
 return addPARider({type:'legacy',plan:{family:'smart9999',requiresPA:small,label:product.name+(small?' (ทุน50,001–199,999)':' (ทุน200,000ขึ้นไป)')},mode:input.mode,gender,age,rate,sum,premium,frequency,annualPaid,totalPaid,payYears,maturityAge:99,maturityAmount,schedule,initialCoverage:Math.max(sum,round(premium*1.01)),rateSource:product.source,rateBand:band},input);
}

export function calculateWholeLife50000(data,input){
 const age=Number(input.age),gender=input.gender;
 if(input.age===''||!Number.isInteger(age)||age<0||age>90)throw Error('กรุณาระบุอายุ 0–90 ปี ตามตารางเบี้ยคุ้มครองตลอดชีพ 99/99');
 if(!['male','female'].includes(gender))throw Error('กรุณาเลือกเพศ');
 if(input.mode!=='sum'||Number(input.amount)!==50000)throw Error('คุ้มครองตลอดชีพ 99/99 กำหนดทุนประกัน 50,000 บาทเท่านั้น');
 const frequency=data.frequencies.find(f=>f.id===input.frequency);
 if(!frequency)throw Error('กรุณาเลือกงวดชำระเบี้ย');
 const rate=data.wholelife50000?.rates.find(r=>r.age===age)?.[gender]?.[frequency.rateIndex];
 if(!(rate>0))throw Error('ไม่มีอัตราเบี้ยสำหรับข้อมูลนี้');
 const sum=50000,premium=round(sum*rate/1000),annualPaid=round(premium*frequency.payments),payYears=99-age,totalPaid=round(annualPaid*payYears),schedule=[];
 for(let year=1;year<=payYears;year++)schedule.push({age:age+year-1,policyYear:year,pay:annualPaid,paid:round(annualPaid*year),coverage:sum,maturity:0});
 schedule.push({age:99,policyYear:payYears,pay:0,paid:totalPaid,coverage:0,maturity:sum});
 return addPARider({type:'legacy',plan:{family:'wholelife50000',label:'คุ้มครองตลอดชีพ 99/99 (ทุน50,000)'},mode:'sum',gender,age,rate,sum,premium,frequency,annualPaid,totalPaid,payYears,maturityAge:99,maturityAmount:sum,schedule,initialCoverage:sum,rateSource:data.wholelife50000.source},input);
}
