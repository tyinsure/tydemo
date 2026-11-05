import {ENDOWMENT2014_RATES} from './savings-endowment2014-rates.mjs';
import {HAPPY_FREQUENCIES} from './savings-happy-return.mjs';
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export function calculateEndowment2014(input,plan){
 const age=Number(input.age);
 if(input.age==null||String(input.age).trim()===''||!Number.isInteger(age)||age<0||age>65)throw Error('อายุรับประกัน 1 เดือน–65 ปี');
 if(age===0&&!input.atLeast30Days)throw Error('กรุณายืนยันอายุอย่างน้อย 1 เดือน');
 if(!['male','female'].includes(input.gender))throw Error('กรุณาเลือกเพศ');
 if(!['sum','premium'].includes(input.mode))throw Error('กรุณาเลือกวิธีคำนวณ');
 const frequency=HAPPY_FREQUENCIES[input.frequency||'annual'];if(!frequency)throw Error('กรุณาเลือกงวดชำระเบี้ย');
 const amount=Number(input.amount);if(!Number.isFinite(amount)||amount<=0)throw Error('กรุณาระบุจำนวนเงินให้ถูกต้อง');
 const rate=ENDOWMENT2014_RATES[age][(input.gender==='female'?4:0)+frequency.rateIndex];
 const sum=input.mode==='premium'?round(amount*1000/rate):amount,premium=round(sum*rate/1000),annualPremium=round(premium*frequency.payments),totalPremium=round(annualPremium*14),maturity=round(sum);
 if(![sum,premium,annualPremium,totalPremium,maturity].every(Number.isFinite)||premium<=0)throw Error('จำนวนเงินอยู่นอกขอบเขตที่คำนวณได้');
 const rows=Array.from({length:21},(_,year)=>({year,age:age+year,premium:year<14?annualPremium:0,paid:round(annualPremium*Math.min(year+1,14)),cash:0,life:year===20?null:round(sum),maturity:year===20?maturity:0,indexBenefit:null}));
 return{plan,age,sum,rate,premium,annualPremium,frequency:{...frequency,id:input.frequency||'annual'},payYears:14,term:20,cashYears:0,totalPremium,maturity,cash:0,cashTotal:0,guaranteedTotal:maturity,indexBenefit:null,indexReturnPercent:null,projectedIndexEnd:null,assumedAnnualReturn:null,projectedTotal:null,projectedGain:null,rows};
}
