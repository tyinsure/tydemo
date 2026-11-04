// Sources: supplied 99/10 premium PDF and six วัยเก๋าคุ้มได้ใจ benefit/rate images.
export const SENIOR_SUMS=[100000,200000,300000,500000];
export const SENIOR_PA_BANDS=[
 {min:50,max:60,annual:[1220,1760,2300,2995,3585],monthly:[109.8,158.4,207,269.55,322.65]},
 {min:61,max:65,annual:[1395,2015,2640,3450,4200],monthly:[125.55,181.35,237.6,310.5,378]},
 {min:66,max:70,annual:[1740,2530,3320,4360,5430],monthly:[156.6,227.7,298.8,392.4,488.7]},
 {min:71,max:75,annual:[2435,3560,4680,6180,7890],monthly:[219.15,320.4,421.2,556.2,710.1]}
];
export const SENIOR_DAILY_BANDS=[
 {min:50,max:65,male:250,female:252},{min:66,max:70,male:369,female:373},
 {min:71,max:75,male:441,female:447},{min:76,max:80,male:531,female:538},
 {min:81,max:85,male:642,female:650},{min:86,max:89,male:773,female:783}
];
export const SENIOR_PA_PLANS=[1,2,3,4,5].map((id,i)=>({id,baseSum:[100000,200000,300000,500000,500000][i],
 accident:[100000,200000,300000,500000,1000000][i],motorcycle:[25000,50000,75000,125000,125000][i],
 assault:[50000,100000,150000,250000,250000][i],publicAccident:[200000,400000,600000,1000000,2000000][i],
 medical:[10000,15000,20000,25000,25000][i],daily:[1000,1500,2000,2500,2500][i],icu:[2000,3000,4000,5000,5000][i]}));
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
// Supplied 99/10 source-4: only plan 1 (100,000) limits daily benefits to 1,000.
export const seniorDailyOptions=(sum,product)=>product!=='senior90'&&sum===100000?[500,1000]:[500,1000,1500,2000];
export const seniorPercent=year=>year<=6?1:year<=10?1.1:year<=15?1.2:year<=20?1.3:1.5;
export function seniorPAPremium(age,plan,frequency){
 const band=SENIOR_PA_BANDS.find(b=>age>=b.min&&age<=b.max);
 return band?.[frequency]?.[plan-1]??null;
}
export function seniorDailyAnnual(age,gender,daily){
 const band=SENIOR_DAILY_BANDS.find(b=>age>=b.min&&age<=b.max);
 return band?Math.round(band[gender]*daily/100):null;
}
// User confirmed on 2026-10-23: senior fixed-benefit health monthly = annual × 0.09.
export function seniorDailyPremium(age,gender,daily,frequency){
 const annual=seniorDailyAnnual(age,gender,daily);
 // Supplied rounding rule: annual and monthly premiums use whole baht, half up.
 return annual===null?null:Math.round(annual*(frequency==='monthly'?0.09:1));
}
export function calculateSenior(data,input){
 const age=Number(input.age),sum=Number(input.sum),gender=input.gender,frequency=input.frequency??'annual';
 const happy=data.product==='senior90',product=happy?'senior90':'senior',productName=happy?'วัยเก๋าคุ้มสุขใจ':'วัยเก๋าคุ้มได้ใจ',maturityAge=happy?90:99,payYears=happy?90-age:10;
 if(input.age===''||!Number.isInteger(age)||age<50||age>(happy?75:80))throw Error(`${productName}รับอายุ 50–${happy?75:80} ปี`);
 if(!['male','female'].includes(gender))throw Error('กรุณาเลือกเพศ');
 if(!SENIOR_SUMS.includes(sum))throw Error('กรุณาเลือกทุน 100,000 / 200,000 / 300,000 / 500,000 บาท');
 if(!['annual','monthly'].includes(frequency))throw Error('วัยเก๋าคุ้มได้ใจรองรับเฉพาะรายปีและรายเดือน');
 const row=data.rates.find(r=>r.age===age),rates=row?.[gender];
 if(!(rates?.[0]>0))throw Error('ไม่มีอัตราเบี้ยวัยเก๋าสำหรับอายุและเพศนี้');
 const payments=frequency==='monthly'?12:1,rate=frequency==='monthly'?row.monthly?.[gender]:rates[0];
 if(!(rate>0))throw Error('ไม่มีอัตราเบี้ยรายเดือนวัยเก๋าสำหรับอายุและเพศนี้');
 const premium=round(sum*rate/1000),annual=round(premium*payments),taxLife=happy?null:round(sum*rates[1]/1000*(frequency==='monthly'?0.09*12:1));
 let pa=null,health=null;
 if(input.paEnabled){
  if(age>75)throw Error('สัญญาอุบัติเหตุสบายใจรับอายุ 50–75 ปีเท่านั้น');
  const p=SENIOR_PA_PLANS.find(p=>p.id===Number(input.paPlan)&&p.baseSum===sum);
  if(!p)throw Error('กรุณาเลือกแผนอุบัติเหตุที่ตรงกับทุนสัญญาหลัก');
  pa={...p,...(happy?{icuMaxDays:7}:{}),premium:seniorPAPremium(age,p.id,frequency),label:'อุบัติเหตุส่วนบุคคล สบายใจ (เพื่อผู้สูงอายุ)'};
 }
 if(input.dailyEnabled){
  if(age>75)throw Error('สัญญาชดเชยรายวันรับอายุ 50–75 ปีเท่านั้น (ต่ออายุได้ถึง 89 ปี)');
  const daily=Number(input.daily);
  if(!seniorDailyOptions(sum,product).includes(daily))throw Error('กรุณาเลือกชดเชยรายวันตามวงเงินที่แผนนี้รองรับ');
  health={daily,icu:daily*2,premium:seniorDailyPremium(age,gender,daily,frequency),label:'สุขภาพวงเงินแน่นอน (เพื่อผู้สูงอายุ)'};
 }
 const paAnnual=round((pa?.premium??0)*payments),dailyAnnual=round((health?.premium??0)*payments);
 const schedule=[];
 for(let year=1;year<=maturityAge-age;year++){
  const rowAge=age+year-1,paid=round(annual*Math.min(year,payYears)),pct=seniorPercent(year);
  const illness=year<=2?round(paid*1.02):happy?sum:round(Math.max(sum*pct,paid*1.01));
  const accident=year<=2?round(sum+paid*1.02):illness;
  const publicAccident=year<=2?round(sum*2+paid*1.02):happy?sum*2:round(Math.max(sum*pct*2,paid*1.01));
  const paPay=pa&&rowAge<=75?round(seniorPAPremium(rowAge,pa.id,frequency)*payments):0;
  const dailyPay=health&&rowAge<=89?round(seniorDailyPremium(rowAge,gender,health.daily,frequency)*payments):0;
  schedule.push({age:rowAge,policyYear:year,pay:year<=payYears?annual:0,paPay,dailyPay,total:round((year<=payYears?annual:0)+paPay+dailyPay),paid,
   illness,accident,publicAccident,paAccident:pa&&rowAge<=75?pa.accident:0,paPublic:pa&&rowAge<=75?pa.publicAccident:0,
   combinedAccident:round(accident+(pa&&rowAge<=75?pa.accident:0)),combinedPublic:round(publicAccident+(pa&&rowAge<=75?pa.publicAccident:0)),maturity:0});
 }
 const totalPaid=round(annual*payYears),maturity=happy?sum:round(Math.max(sum*1.5,totalPaid*1.01));
 schedule.push({age:maturityAge,policyYear:maturityAge-age,pay:0,paPay:0,dailyPay:0,total:0,paid:totalPaid,illness:0,accident:0,publicAccident:0,paAccident:0,paPublic:0,combinedAccident:0,combinedPublic:0,maturity});
 return {type:'senior',product,productName,payYears,maturityAge,label:data.name,age,gender,sum,frequency,frequencyLabel:frequency==='monthly'?'รายเดือน':'รายปี',unit:frequency==='monthly'?'เดือน':'ปี',payments,annual,premium,taxLife,pa,health,totalPaid,maturity,schedule,
  combinedPremium:round(premium+(pa?.premium??0)+(health?.premium??0)),combinedAnnual:round(annual+paAnnual+dailyAnnual)};
}
export const seniorMoney=n=>n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
export function seniorPaymentViews(data,input){
 return ['annual','monthly'].map(frequency=>{
  const r=calculateSenior(data,{...input,frequency});
  return {frequency,main:r.premium,pa:r.pa?.premium??0,health:r.health?.premium??0,total:r.combinedPremium};
 });
}
export const SENIOR_HEALTH_NOTE='สุขภาพวงเงินแน่นอน\nปีกรมธรรม์ที่ 1–2 คุ้มครองการเข้ารักษาในโรงพยาบาลจากการบาดเจ็บจากอุบัติเหตุเท่านั้น\nICU จ่าย 2 เท่า วันนอนห้องปกติและ ICU รวมกันสูงสุด 10 วันต่อปีกรมธรรม์';
export const seniorNotes=r=>{const notes=r.product==='senior90'?SENIOR90_NOTES:SENIOR_NOTES;return r.health?notes:notes.slice(0,-1);};
export const SENIOR90_NOTES=[
 'ปีกรมธรรม์ที่ 1–2: เจ็บป่วยคืนเบี้ยหลักที่ชำระแล้วพร้อมเงินเพิ่ม 2%; อุบัติเหตุทั่วไปเพิ่ม 100% ของทุน และอุบัติเหตุสาธารณะเพิ่ม 200% ของทุน (เสียชีวิตภายใน 180 วันนับแต่เกิดอุบัติเหตุ)',
 'ตั้งแต่ปีกรมธรรม์ที่ 3: เจ็บป่วยหรืออุบัติเหตุทั่วไปรับ 100% ของทุน; อุบัติเหตุสาธารณะรับ 200% ของทุน บริษัทจ่ายกรณีเสียชีวิตเพียงกรณีเดียวและสัญญาสิ้นสุด',
 'ชำระเบี้ยหลักและคุ้มครองถึงอายุ 90 ปี หากมีชีวิตอยู่ครบสัญญารับ 100% ของทุน ตารางใช้อายุ ณ ต้นปีและรวมเบี้ยทุกงวดในแต่ละปี',
 'อุบัติเหตุสบายใจต่ออายุได้ถึง 75 ปี คุ้มครองถึงอายุ 76 ปี ชดเชยผู้ป่วยในและ ICU รวมสูงสุด 365 วันต่ออุบัติเหตุ โดย ICU สูงสุด 7 วันต่ออุบัติเหตุ',
 'สุขภาพวงเงินแน่นอนต่ออายุได้ถึง 89 ปี คุ้มครองถึงอายุ 90 ปี เบี้ยสัญญาเพิ่มเติมปรับตามอายุ การต่ออายุขึ้นกับเงื่อนไขสัญญา',
 SENIOR_HEALTH_NOTE
];
export const SENIOR_NOTES=[
 'ผลประโยชน์เสียชีวิตตั้งแต่ปีที่ 3 เป็นจำนวนสูงสุดระหว่าง % ของทุน มูลค่าเวนคืน และ 101% ของเบี้ยหลักที่ชำระแล้ว ตารางนี้ยังไม่มีมูลค่าเวนคืน จึงแสดงขั้นต่ำที่คำนวณได้',
 'ปีที่ 1–2: เจ็บป่วยรับ 102% ของเบี้ยหลักที่ชำระแล้ว; อุบัติเหตุทั่วไปเพิ่ม 100% ของทุน; อุบัติเหตุสาธารณะเพิ่ม 200% ของทุน (เสียชีวิตภายใน 180 วันนับแต่เกิดอุบัติเหตุ)',
 'เมื่อครบอายุ 99 ปี รับจำนวนสูงกว่าระหว่าง 150% ของทุนและ 101% ของเบี้ยหลักที่ชำระแล้ว บริษัทจ่ายผลประโยชน์เสียชีวิตเพียงกรณีเดียวและสัญญาสิ้นสุด',
 'ตารางใช้อายุ ณ ต้นปีกรมธรรม์และเบี้ยที่ชำระครบปี เบี้ยสัญญาหลักคงที่ 10 ปี; เบี้ยสัญญาเพิ่มเติมปรับตามอายุ ไม่รวมในเบี้ยหลักสะสม',
 'อุบัติเหตุสบายใจรับอายุ 50–75 ปี ต่ออายุได้ถึง 75 ปี คุ้มครองถึงอายุ 76 ปี; สุขภาพวงเงินแน่นอนรับอายุ 50–75 ปี ต่ออายุได้ถึง 89 ปี คุ้มครองถึงอายุ 90 ปี ตามเงื่อนไขสัญญา',
 'ไม่ต้องตรวจสุขภาพและไม่ต้องตอบคำถามสุขภาพ; กลุ่มอาชีพ 1 และ 2; ชำระรายปีหรือรายเดือน และชำระด้วยบัตรเครดิตได้',
 SENIOR_HEALTH_NOTE
];
export function seniorSummary(r){
 const m=seniorMoney;
 return ['สรุปแผนสร้างมรดก TYINSURE',r.productName+' · '+r.label,`เพศ${r.gender==='male'?'ชาย':'หญิง'} อายุ ${r.age} ปี`,`ทุนประกัน ${m(r.sum)} บาท`,`เบี้ยหลัก${r.frequencyLabel} ${m(r.premium)} บาท/${r.unit}`,`เบี้ยหลักรวมต่อปี ${m(r.annual)} บาท`,`ชำระเบี้ยหลัก ${r.payYears} ปี รวม ${m(r.totalPaid)} บาท · คุ้มครองถึงอายุ ${r.maturityAge} ปี`,
  ...(r.pa?[`อุบัติเหตุสบายใจ แผน ${r.pa.id} · เบี้ยปีแรก ${m(r.pa.premium)} บาท/${r.unit}`,`อุบัติเหตุทั่วไป ${m(r.pa.accident)} บาท · สาธารณะ ${m(r.pa.publicAccident)} บาท`,`ค่ารักษาต่ออุบัติเหตุ ${m(r.pa.medical)} บาท`]:[]),
  ...(r.health?[`ชดเชยรายวัน ${m(r.health.daily)} บาท · ICU ${m(r.health.icu)} บาท/วัน (สูงสุด 10 วัน/ปีกรมธรรม์)`,`เบี้ยชดเชยปีแรก ${m(r.health.premium)} บาท/${r.unit}`]:[]),
  `เบี้ยรวมปีแรก ${m(r.combinedPremium)} บาท/${r.unit}`,`รวมชำระปีแรก ${m(r.combinedAnnual)} บาท/ปี`,`เงินครบสัญญา ${m(r.maturity)} บาท`,...seniorNotes(r),'ทัก LINE @TYINSURE','https://line.me/R/ti/p/@tyinsure'].join('\n');
}
