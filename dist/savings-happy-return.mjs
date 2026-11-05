// Exact premiums and benefit staircase from user-supplied images in docs/happy-return2010/.
export const HAPPY_FREQUENCIES={annual:{label:'รายปี',payments:1,rateIndex:0},semiannual:{label:'ราย 6 เดือน',payments:2,rateIndex:1},quarterly:{label:'ราย 3 เดือน',payments:4,rateIndex:2},monthly:{label:'รายเดือน',payments:12,rateIndex:3}};
const rates=[[578,294.78,150.28,50.864],[588,299.88,152.88,51.744],[598,304.98,155.48,52.624]];
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export function calculateHappyReturn(input,plan){
 const age=Number(input.age);if(String(input.age).trim()===''||!Number.isInteger(age)||age<0||age>75)throw Error('อายุในตารางอัตราเบี้ย 0–75 ปี');
 const frequency=HAPPY_FREQUENCIES[input.frequency||'annual'];if(!frequency)throw Error('กรุณาเลือกงวดชำระเบี้ย');
 if(!['sum','premium'].includes(input.mode))throw Error('กรุณาเลือกวิธีคำนวณ');
 const rate=rates[age<=60?0:age<=70?1:2][frequency.rateIndex],amount=Number(input.amount);
 if(!Number.isFinite(amount)||amount<=0)throw Error('กรุณาระบุจำนวนเงินให้ถูกต้อง');
 const sum=input.mode==='premium'?round(amount*1000/rate):amount,premium=round(sum*rate/1000),annualPremium=round(premium*frequency.payments),totalPremium=round(annualPremium*10),maturity=round(sum*5.2),cash=round(sum*.1);
 if(![sum,premium,annualPremium,totalPremium,maturity,cash].every(Number.isFinite)||premium<=0)throw Error('จำนวนเงินอยู่นอกขอบเขตที่คำนวณได้');
 const rows=Array.from({length:21},(_,year)=>({year,age:age+year,premium:year<10?annualPremium:0,paid:round(annualPremium*Math.min(year+1,10)),cash:year>0&&year<20?cash:0,life:year===20?null:round(sum*Math.min(Math.floor(year/2)+1,5)*1.1),maturity:year===20?maturity:0,indexBenefit:null}));
 const cashTotal=round(cash*19),guaranteedTotal=round(cashTotal+maturity);
 return{plan,age,sum,rate,premium,annualPremium,frequency:{...frequency,id:input.frequency||'annual'},payYears:10,term:20,cashYears:19,totalPremium,maturity,cash,cashTotal,guaranteedTotal,indexBenefit:null,indexReturnPercent:null,projectedIndexEnd:null,assumedAnnualReturn:null,projectedTotal:null,projectedGain:null,rows};
}
