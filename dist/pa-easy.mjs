// Source: supplied PA Easy Plan Rider coverage / annual premium table.
export const PA_BANDS=[
 {min:0,max:15,rates:[1300,2000,3000,null,null,null,null]},
 {min:16,max:60,rates:[1300,2000,3000,5500,7500,12500,21000]},
 {min:61,max:65,rates:[1600,2300,3500,6300,8500,14200,null]},
 {min:66,max:70,rates:[1900,2700,4000,7300,9900,16500,null]},
 {min:71,max:75,rates:[2500,3700,5600,10000,13600,22700,null]},
 {min:76,max:85,rates:[3050,4620,8500,14950,null,null,null]}
];
export const PA_PLANS=Array.from({length:7},(_,i)=>({
 id:i+1,name:`แผน ${i+1}`,
 accident:[300000,500000,1000000,2000000,3000000,5000000,10000000][i],
 assault:[300000,500000,1000000,1000000,1000000,5000000,5000000][i],
 motorcycle:[150000,250000,500000,500000,500000,1000000,1000000][i],
 publicAccident:[600000,1000000,2000000,4000000,6000000,10000000,20000000][i],
 medical:[15000,25000,50000,100000,150000,200000,300000][i],
 holidayPremium:[60,100,200,400,600,1000,2000][i]
}));
export function paAnnualPremium(age,planId,holiday=false){
 const p=PA_PLANS.find(p=>p.id===Number(planId)),band=PA_BANDS.find(b=>age>=b.min&&age<=b.max);
 const base=p&&band?.rates[p.id-1];return base==null?null:base+(holiday?p.holidayPremium:0);
}
// Payment factors confirmed by the user; source table contains annual rates.
export const PA_PAYMENT_FACTORS={annual:1,semiannual:0.51,quarterly:0.26,monthly:0.088};
const roundMoney=n=>Math.round((n+Number.EPSILON)*100)/100;
export function paPaymentPremium(age,planId,frequency){
 const annualRate=paAnnualPremium(age,planId,false);
 const factor=PA_PAYMENT_FACTORS[frequency];
 if(factor===undefined)throw Error('งวดชำระไม่ถูกต้อง');
 return annualRate===null?null:roundMoney(annualRate*factor);
}
export function addPARider(result,input){
 if(!input.paEnabled)return result;
 const plan=PA_PLANS.find(p=>p.id===Number(input.paPlan));
 if(!plan)throw Error('กรุณาเลือกแผน PA Easy Plan');
 if(result.age===0&&!input.paAtLeast30Days)throw Error('PA Easy Plan มีอัตราเริ่มที่อายุ 30 วัน กรุณายืนยันอายุอย่างน้อย 30 วัน');
 const annualRate=paAnnualPremium(result.age,plan.id,false);
 const premium=paPaymentPremium(result.age,plan.id,result.frequency.id);
 const annualPremium=premium===null?null:roundMoney(premium*result.frequency.payments);
 if(annualPremium===null)throw Error(`${plan.name} ไม่มีอัตรา PA สำหรับอายุ ${result.age} ปีในภาพ กรุณาเลือกแผนอื่น`);
 return {...result,rider:{...plan,occupation:'1',holiday:false,annualRate,premium,annualPremium},combinedFirstYearPremium:roundMoney(result.premium+premium),combinedFirstYearAnnual:result.annualPaid+annualPremium,
  // Project PA premiums only through the last age in the supplied PA table.
  // Later years must not invalidate other riders that still have rates.
  schedule:result.schedule.map(row=>{const modal=row.age>PA_BANDS.at(-1).max?0:paPaymentPremium(row.age,plan.id,result.frequency.id);return {...row,riderModalPremium:modal,riderPremium:modal===null?null:roundMoney(modal*result.frequency.payments)};})};
}
