export const SAVINGS_PLANS={standard:{name:'เมืองไทย สมาร์ท อินเด็กซ์ 15/6 (Global)',cashRate:.05,pr:.5},pro:{name:'เมืองไทย สมาร์ท อินเด็กซ์ 15/6 โปร (Global)',cashRate:.025,pr:1}};
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export function calculateSavings(input){
 const plan=SAVINGS_PLANS[input.plan];if(!plan)throw Error('กรุณาเลือกแผน');
 const age=Number(input.age);if(String(input.age).trim()===''||!Number.isInteger(age)||age<0||age>80)throw Error('อายุรับประกัน 30 วัน–80 ปี');
 if(age===0&&!input.atLeast30Days)throw Error('กรุณายืนยันอายุอย่างน้อย 30 วัน');
 const rate=input.plan==='pro'?968:age<=70?967:996;
 const amount=Number(input.amount);if(!Number.isFinite(amount)||amount<=0)throw Error('กรุณาระบุจำนวนเงินให้ถูกต้อง');
 const sum=input.mode==='premium'?amount*1000/rate:amount;
 if(sum<20000-1e-7)throw Error('ทุนประกันขั้นต่ำ 20,000 บาท');
 const premium=round(sum*rate/1000),totalPremium=round(premium*6),maturity=round(Math.max(sum*6,totalPremium*1.01));
 let indexBenefit=null,assumedAnnualReturn=null,projectedIndexEnd=null;
 if(input.simulate){
 const f=Number(input.fxStart),g=Number(input.fxEnd);
 if([input.fxStart,input.fxEnd].some(x=>x==null||String(x).trim()==='')||![f,g].every(Number.isFinite)||f<=0||g<=0)throw Error('กรุณาระบุอัตราแลกเปลี่ยนให้ครบและมากกว่า 0');
 let growth;
 if(input.returnMode==='annual'){
  const percent=Number(input.annualReturn);
  if(input.annualReturn==null||String(input.annualReturn).trim()===''||!Number.isFinite(percent)||percent< -100)throw Error('กรุณาระบุผลตอบแทนดัชนีเฉลี่ยต่อปีตั้งแต่ -100% ขึ้นไป');
  // Brochure examples: initial index 230; 179-month growth rounded to 2 decimals.
  // 179 months is an illustration assumption inferred from all three published index anchors,
  // not a contractual investment period. Manual index mode uses supplied levels unchanged.
  assumedAnnualReturn=percent;projectedIndexEnd=round(230*Math.pow(1+percent/100,179/12));growth=projectedIndexEnd/230-1;
 }else{
  const a=Number(input.indexStart),b=Number(input.indexEnd);
  if([input.indexStart,input.indexEnd].some(x=>x==null||String(x).trim()==='')||![a,b].every(Number.isFinite)||a<=0||b<0)throw Error('กรุณาระบุดัชนีให้ครบ ดัชนีเริ่มต้นต้องมากกว่า 0 และดัชนีสุดท้ายต้องไม่ติดลบ');
  growth=b/a-1;
 }
 indexBenefit=round(sum*6*g/f*plan.pr*Math.max(0,growth));
 if(!Number.isFinite(indexBenefit))throw Error('ผลตอบแทนสูงเกินขอบเขตที่คำนวณได้ กรุณาลดค่าที่ระบุ');
 }
 const cash=round(sum*plan.cashRate);
 // Anniversary timeline: t=0 is policy inception, t=15 is maturity.
 // At t=2/4, the previous year's cashback and the next premium occur at the same anniversary.
 const rows=Array.from({length:16},(_,year)=>{
  const paid=round(premium*Math.min(year+1,6));
  return{year,age:age+year,premium:year<6?premium:0,paid,
   cash:year>0&&year<=14&&year%2===0?cash:0,
   life:year===15?null:round(Math.max(sum*Math.min(year+1,6),paid*1.01)),
   maturity:year===15?maturity:0,indexBenefit:year===15?indexBenefit:null};
 });
 const cashTotal=round(cash*7),guaranteedTotal=round(cashTotal+maturity);
 const projectedTotal=indexBenefit===null?null:round(guaranteedTotal+indexBenefit),projectedGain=projectedTotal===null?null:round(projectedTotal-totalPremium);
 return{projectedIndexEnd,assumedAnnualReturn,projectedTotal,projectedGain,plan,age,sum,rate,premium,totalPremium,maturity,cash,cashTotal,guaranteedTotal,indexBenefit,rows};
}
