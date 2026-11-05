import {SUPER2516_RATES} from './savings-super2516-rates.mjs';
import {HAPPY_FREQUENCIES} from './savings-happy-return.mjs';
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export function calculateSuper2516(input,plan){
 const age=Number(input.age);
 if(input.age==null||String(input.age).trim()===''||!Number.isInteger(age)||age<0||age>65)throw Error('อายุในตารางอัตราเบี้ย 0–65 ปี');
 if(!['male','female'].includes(input.gender))throw Error('กรุณาเลือกเพศ');
 if(!['sum','premium'].includes(input.mode))throw Error('กรุณาเลือกวิธีคำนวณ');
 const frequency=HAPPY_FREQUENCIES[input.frequency||'annual'];if(!frequency)throw Error('กรุณาเลือกงวดชำระเบี้ย');
 const amount=Number(input.amount);if(!Number.isFinite(amount)||amount<=0)throw Error('กรุณาระบุจำนวนเงินให้ถูกต้อง');
 const rate=SUPER2516_RATES[age][(input.gender==='female'?4:0)+frequency.rateIndex];
 const sum=input.mode==='premium'?round(amount*1000/rate):amount,premium=round(sum*rate/1000),annualPremium=round(premium*frequency.payments),totalPremium=round(annualPremium*16),maturity=round(sum*1.5);
 if(![sum,premium,annualPremium,totalPremium,maturity].every(Number.isFinite)||premium<=0)throw Error('จำนวนเงินอยู่นอกขอบเขตที่คำนวณได้');
 const rows=Array.from({length:26},(_,year)=>({year,age:age+year,premium:year<16?annualPremium:0,paid:round(annualPremium*Math.min(year+1,16)),cash:year>0&&year<25?round(sum*(year<=10?.01:year<=20?.015:.02)):0,life:year===25?null:round(sum*(year<10?1:1.5)),maturity:year===25?maturity:0,indexBenefit:null}));
 const cashTotal=round(rows.reduce((total,row)=>total+row.cash,0));
 return{plan,age,sum,rate,premium,annualPremium,frequency:{...frequency,id:input.frequency||'annual'},payYears:16,term:25,cashYears:24,totalPremium,maturity,cash:round(sum*.01),cashTotal,guaranteedTotal:round(cashTotal+maturity),indexBenefit:null,indexReturnPercent:null,projectedIndexEnd:null,assumedAnnualReturn:null,projectedTotal:null,projectedGain:null,rows};
}
