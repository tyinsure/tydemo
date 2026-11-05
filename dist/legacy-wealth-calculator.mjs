const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export function calculateLegacyWealth(data,input){
 const age=Number(input.age),amount=Number(input.amount),gender=input.gender,maxAge=data.maxAge??75,product=data.product??'wealth995',payYears=data.payToAge?data.payToAge-age:data.payYears??5;
 if(input.age===''||!Number.isInteger(age)||age<0||age>maxAge)throw Error(`กรุณาระบุอายุเต็มปีตั้งแต่ 0–${maxAge} ปี ตามตารางอัตราเบี้ย`);
 if(!['male','female'].includes(gender))throw Error('กรุณาเลือกเพศ');
 if(!['sum','premium'].includes(input.mode))throw Error('กรุณาเลือกวิธีคำนวณ');
 if(!Number.isFinite(amount)||amount<=0||amount>1e12)throw Error('กรุณาระบุจำนวนเงินมากกว่า 0 และไม่เกิน 1,000,000,000,000 บาท');
 const frequency=data.frequencies.find(f=>f.id===input.frequency);
 if(!frequency)throw Error('กรุณาเลือกงวดชำระเบี้ย');
 const rate=data.rates.find(row=>row.age===age)?.[gender]?.[frequency.rateIndex];
 if(!(rate>0))throw Error('ไม่มีอัตราเบี้ยสำหรับข้อมูลนี้');
 const sum=input.mode==='sum'?round(amount):round(amount*1000/rate);
 if(sum<10000000)throw Error(`${data.name} ทุนประกันขั้นต่ำ 10,000,000 บาท`);
 const premium=input.mode==='premium'?round(amount):round(sum*rate/1000),annualPaid=round(premium*frequency.payments),totalPaid=round(annualPaid*payYears),schedule=[];
 for(let year=0;age+year<99;year++){
  const paid=round(annualPaid*Math.min(year+1,payYears));
  schedule.push({age:age+year,policyYear:year+1,pay:year<payYears?annualPaid:0,paid,coverage:Math.max(sum,round(paid*1.01)),maturity:0});
 }
 const maturityAmount=Math.max(sum,round(totalPaid*1.01));
 schedule.push({age:99,policyYear:99-age,pay:0,paid:totalPaid,coverage:0,maturity:maturityAmount});
 return {type:'legacy',product,plan:{label:data.name,family:product},mode:input.mode,gender,age,rate,sum,premium,frequency,annualPaid,totalPaid,payYears,maturityAge:99,maturityAmount,initialCoverage:schedule[0].coverage,schedule};
}
export function legacyWealthSummary(r){
 const m=n=>n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
 return ['สรุปแผนสร้างมรดก TYINSURE',r.plan.label,`เพศ${r.gender==='male'?'ชาย':'หญิง'} อายุ ${r.age} ปี`,`ทุนประกัน ${m(r.sum)} บาท`,`เบี้ย${r.frequency.label} ${m(r.premium)} บาท/งวด · รวม ${m(r.annualPaid)} บาท/ปี`,`ชำระเบี้ย ${r.payYears} ปี (ปีที่ 0–${r.payYears-1}) รวม ${m(r.totalPaid)} บาท`,'คุ้มครองถึงอายุ 99 ปี','ประกันชีวิตขั้นต่ำ = ค่าสูงกว่าระหว่างทุนประกัน 100% และ 101% ของเบี้ยสัญญาหลักสะสม',`หากมีชีวิตอยู่ครบสัญญาอายุ 99 ปี รับ ${m(r.maturityAmount)} บาท: ค่าสูงกว่าระหว่างทุนประกัน 100% และ 101% ของเบี้ยสัญญาหลักที่ชำระแล้ว`,'ตารางรวมเบี้ยทุกงวดในแต่ละปี ความคุ้มครองนี้ยังไม่รวมการเปรียบเทียบมูลค่าเวนคืน','ทัก LINE @TYINSURE','https://line.me/R/ti/p/@tyinsure'].join('\n');
}
