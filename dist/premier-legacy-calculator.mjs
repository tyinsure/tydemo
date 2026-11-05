const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export function calculatePremierLegacy(data,input){
 const age=Number(input.age),amount=Number(input.amount),gender=input.gender;
 if(input.age===''||!Number.isInteger(age)||age<0||age>80)throw Error('กรุณาระบุอายุเต็มปีตั้งแต่ 0–80 ปี ตามตารางอัตราเบี้ย');
 if(age===0&&!input.premierAtLeast30Days)throw Error('Premier Legacy 99/1 (มูลค่าเวนคืนคงที่) เริ่มรับประกันอายุ 30 วัน กรุณายืนยันอายุอย่างน้อย 30 วัน');
 if(!['male','female'].includes(gender))throw Error('กรุณาเลือกเพศ');
 if(!['sum','premium'].includes(input.mode))throw Error('กรุณาเลือกวิธีคำนวณ');
 if(input.frequency!=='annual')throw Error('Premier Legacy 99/1 (มูลค่าเวนคืนคงที่) มีเฉพาะเบี้ยรายปี ชำระครั้งเดียว');
 if(!Number.isFinite(amount)||amount<=0||amount>1e12)throw Error('กรุณาระบุจำนวนเงินมากกว่า 0 และไม่เกิน 1,000,000,000,000 บาท');
 const rate=data.rates.find(row=>row.age===age)?.[gender]?.[0];
 if(!(rate>0))throw Error('ไม่มีอัตราเบี้ยสำหรับข้อมูลนี้');
 const sum=input.mode==='sum'?round(amount):round(amount*1000/rate);
 if(sum<10000000)throw Error('Premier Legacy 99/1 (มูลค่าเวนคืนคงที่) ทุนประกันขั้นต่ำ 10,000,000 บาท');
 const premium=input.mode==='premium'?round(amount):round(sum*rate/1000),benefit=Math.max(sum,round(premium*1.01)),schedule=[];
 for(let year=0;age+year<99;year++)schedule.push({age:age+year,policyYear:year+1,pay:year===0?premium:0,paid:premium,coverage:benefit,maturity:0});
 schedule.push({age:99,policyYear:99-age,pay:0,paid:premium,coverage:0,maturity:benefit});
 return {type:'legacy',product:'premier991',plan:{label:data.name,kind:'single_premium',family:'premier991'},mode:input.mode,gender,age,rate,sum,premium,frequency:data.frequencies[0],annualPaid:premium,totalPaid:premium,payYears:1,maturityAge:99,maturityAmount:benefit,initialCoverage:benefit,schedule};
}
export function premierLegacySummary(r){
 const m=n=>n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
 return ['สรุปแผนสร้างมรดก TYINSURE',r.plan.label,`เพศ${r.gender==='male'?'ชาย':'หญิง'} อายุ ${r.age} ปี`,`ทุนประกัน ${m(r.sum)} บาท`,`เบี้ยรายปี ชำระครั้งเดียว ${m(r.premium)} บาท ณ อายุ ${r.age} ปี (ปีที่ 0)`,'คุ้มครองถึงอายุ 99 ปี',`ประกันชีวิตขั้นต่ำ ${m(r.initialCoverage)} บาท: ค่าสูงกว่าระหว่างทุนประกัน 100% และ 101% ของเบี้ยสัญญาหลักสะสม`,`หากมีชีวิตอยู่ครบสัญญาอายุ 99 ปี รับ ${m(r.maturityAmount)} บาท: ค่าสูงกว่าระหว่างทุนประกัน 100% และ 101% ของเบี้ยสัญญาหลักที่ชำระแล้ว`,'ความคุ้มครองนี้ยังไม่รวมการเปรียบเทียบมูลค่าเวนคืน','ทัก LINE @TYINSURE','https://line.me/R/ti/p/@tyinsure'].join('\n');
}
