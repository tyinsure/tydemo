import {calculateSuper2516} from './savings-super2516.mjs';
import {calculateEndowment2014} from './savings-endowment2014.mjs';
import {calculateHappyReturn} from './savings-happy-return.mjs';
export const SAVINGS_PLANS={super2516:{name:'เมืองไทย ซุปเปอร์ เซฟเวอร์ 25/16',guaranteed:true,product:'super2516',cashRate:.01},endowment2014:{name:'ออมทรัพย์ 20/14',guaranteed:true,product:'endowment2014',cashRate:0},happy2010:{name:'เมืองไทย แฮปปี้ รีเทิร์น 20/10',guaranteed:true,product:'happy2010',cashRate:.1},guaranteed:{name:'15/6 การันตี',cashRate:.06,guaranteed:true},standard:{name:'เมืองไทย สมาร์ท อินเด็กซ์ 15/6 (Global)',cashRate:.05,pr:.5},pro:{name:'เมืองไทย สมาร์ท อินเด็กซ์ 15/6 โปร (Global)',cashRate:.025,pr:1}};
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export function calculateSavings(input){
 const plan=SAVINGS_PLANS[input.plan];if(!plan)throw Error('กรุณาเลือกแผน');
 if(input.plan==='super2516')return calculateSuper2516(input,plan);
 if(input.plan==='endowment2014')return calculateEndowment2014(input,plan);
 if(input.plan==='happy2010')return calculateHappyReturn(input,plan);
 const age=Number(input.age);if(String(input.age).trim()===''||!Number.isInteger(age)||age<0||age>80)throw Error(plan.guaranteed?'อายุในตารางอัตราเบี้ย 0–80 ปี':'อายุรับประกัน 30 วัน–80 ปี');
 if(age===0&&!plan.guaranteed&&!input.atLeast30Days)throw Error('กรุณายืนยันอายุอย่างน้อย 30 วัน');
 if(plan.guaranteed&&input.frequency&&input.frequency!=='annual')throw Error('แผน 15/6 การันตีคำนวณรายปีเท่านั้น');
 const rate=plan.guaranteed?(age<=40?968:age<=60?988:age<=70?997:1000):input.plan==='pro'?968:age<=70?967:996;
 const amount=Number(input.amount);if(!Number.isFinite(amount)||amount<=0)throw Error('กรุณาระบุจำนวนเงินให้ถูกต้อง');
 const sum=input.mode==='premium'?amount*1000/rate:amount;
 if(!plan.guaranteed&&sum<20000-1e-7)throw Error('ทุนประกันขั้นต่ำ 20,000 บาท');
 const premium=round(sum*rate/1000),totalPremium=round(premium*6),maturity=round(plan.guaranteed?sum*6.06:Math.max(sum*6,totalPremium*1.01));
 let indexBenefit=null,assumedAnnualReturn=null,projectedIndexEnd=null,indexReturnPercent=null;
 if(input.simulate&&!plan.guaranteed){
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
 indexReturnPercent=assumedAnnualReturn??(Math.pow(1+growth,12/179)-1)*100;
 indexBenefit=round(sum*6*g/f*plan.pr*Math.max(0,growth));
 if(!Number.isFinite(indexBenefit))throw Error('ผลตอบแทนสูงเกินขอบเขตที่คำนวณได้ กรุณาลดค่าที่ระบุ');
 }
 const cash=round(sum*plan.cashRate);
 // Anniversary timeline: t=0 is policy inception, t=15 is maturity.
 // At t=2/4, the previous year's cashback and the next premium occur at the same anniversary.
 const rows=Array.from({length:16},(_,year)=>{
  const paid=round(premium*Math.min(year+1,6));
  return{year,age:age+year,premium:year<6?premium:0,paid,
   cash:year>0&&year<=14&&(plan.guaranteed||year%2===0)?cash:0,
   life:year===15?null:round(plan.guaranteed?sum*Math.min(year+1,6):Math.max(sum*Math.min(year+1,6),paid*1.01)),
   maturity:year===15?maturity:0,indexBenefit:year===15?indexBenefit:null};
 });
 const cashTotal=round(cash*(plan.guaranteed?14:7)),guaranteedTotal=round(cashTotal+maturity);
 const projectedTotal=indexBenefit===null?null:round(guaranteedTotal+indexBenefit),projectedGain=projectedTotal===null?null:round(projectedTotal-totalPremium);
 return{indexReturnPercent,projectedIndexEnd,assumedAnnualReturn,projectedTotal,projectedGain,plan,age,sum,rate,premium,totalPremium,maturity,cash,cashTotal,guaranteedTotal,indexBenefit,rows};
}

export function savingsDividendLabel(r){
 const percent=r.indexReturnPercent;
 return 'เงินปันผลหากได้ผลตอบแทน'+(Number.isFinite(percent)?' '+Number(percent.toFixed(2))+'%':'');
}
