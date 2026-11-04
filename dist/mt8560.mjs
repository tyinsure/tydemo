export const PAYMENT_FREQUENCIES=[{id:'annual',label:'รายปี',payments:1,index:0},{id:'semiannual',label:'ราย 6 เดือน',payments:2,index:1},{id:'quarterly',label:'ราย 3 เดือน',payments:4,index:2},{id:'monthly',label:'รายเดือน',payments:12,index:3}];
const round=n=>Math.round((n+Number.EPSILON*Math.max(1,Math.abs(n)))*100)/100;
// Present value per 1,000 baht sum assured after Y pension payments (supplied G15 table).
export const G15_REMAINING_PENSION_PV = [1396.19,1314.48,1230.31,1143.62,1054.33,962.36,867.63,770.06,669.56,566.05,459.43,349.62,236.50,120.00];
export function calculate8560(plan,input){
 const age=Number(input.age),amount=Number(input.amount),sex=input.gender==='male'?0:input.gender==='female'?1:-1;
 if(sex<0)throw Error('กรุณาเลือกเพศ');
 if(input.age===''||!Number.isInteger(age)||age<20||age>55)throw Error('แผนนี้มีอัตราเบี้ยสำหรับอายุ 20–55 ปี');
 if(!Number.isFinite(amount)||amount<=0)throw Error('กรุณากรอกจำนวนเงินที่มากกว่า 0');
 if(Math.abs(amount*100-Math.round(amount*100))>.00001)throw Error('กรุณากรอกจำนวนเงินไม่เกินทศนิยม 2 ตำแหน่ง');
 const frequency=PAYMENT_FREQUENCIES.find(f=>f.id===(input.frequency||'annual'));
 if(!frequency)throw Error('กรุณาเลือกงวดชำระเบี้ย');
 const rawRate=plan.modalRates[age][sex][frequency.index];
 // The supplied discount table explicitly applies to annual premiums only.
 const rateFor=t=>rawRate-(frequency.id==='annual'?plan.annualDiscounts[t]:0);
 let sum,premium,rate,tier,alternatives=0;
 if(input.mode==='premium'){
  const candidates=plan.bands.map(([lo,hi],i)=>{const sum=round(amount*1000/rateFor(i));return {sum,rate:rateFor(i),tier:i,valid:sum>=lo&&(hi===null||sum<=hi)};}).filter(c=>c.valid);
  if(!candidates.length)throw Error(`เบี้ยต่ำกว่าทุนขั้นต่ำ 100,000 บาท (เริ่มประมาณ ${round(rawRate*100).toLocaleString('th-TH')} บาท/งวด)`);
  ({sum,rate,tier}=candidates.reduce((a,b)=>b.sum>a.sum?b:a));premium=amount;alternatives=candidates.length;
 }else{
  sum=round(amount);if(sum<100000)throw Error('แผนนี้มีอัตราเบี้ยสำหรับทุนประกันตั้งแต่ 100,000 บาท');
  tier=plan.bands.findIndex(([lo,hi])=>sum>=lo&&(hi===null||sum<=hi));rate=rateFor(tier);premium=round(rate*sum/1000);
 }
 const annualPaid=round(premium*frequency.payments),payYears=60-age,schedule=[];let paid=0,received=0;
 for(let a=age;a<=85;a++){
  const pay=a<60?annualPaid:0,pct=a>=60?.12:0,pension=round(sum*pct),before=a<60;
  paid=round(paid+pay);received=round(received+pension);
  const coveragePct=before?(a<45?1:1+(a-44)*.1):null;
  schedule.push({age:a,year:a-age+1,pay,pct,pension,paid,received,coverage:before?round(sum*coveragePct):a<=73?round(sum/1000*G15_REMAINING_PENSION_PV[a-60]):null,coveragePct,before,phase:before?'ชำระเบี้ย':'รับบำนาญ'});
 }
 return {plan,age,gender:input.gender,sum,premium,rate,rawRate,tier,alternatives,payYears,frequency,annualPaid,schedule,totalPaid:paid,totalReceived:received,firstPension:round(sum*.12)};
}
