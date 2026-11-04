// Source: user-provided ค่าชดเชย (เบี้ย).pdf, pages 1 and 4–6 (01-12-64).
// Each row contains actual modal premiums, not factors inferred from another rider.
export const DAILY_NAME='ค่าชดเชยรายวัน';
export const DAILY_FREQUENCIES=['annual','semiannual','quarterly','monthly'];
export const DAILY_RATES=[
 {min:16,max:35,page:4,rates:{500:[800,416,216,72],1000:[1600,832,432,144]}},
 {min:36,max:45,page:5,rates:{500:[900,468,243,81],1000:[1800,936,486,162]}},
 {min:46,max:64,page:6,rates:{500:[1050,546,284,95],1000:[2100,1092,567,189]}}
];
export const DAILY_TERMS=[
 'รับอายุ 16–64 ปี คุ้มครองถึงอายุ 65 ปี หรือจนสัญญาหลักสิ้นผลบังคับ เบี้ยคงที่ตามอายุเริ่มสัญญา กลุ่มอาชีพ 1, 2, 3',
 'กรณีผู้ป่วยใน ผลประโยชน์รวมตามข้อ 1 และ 2 สูงสุด 365 วันต่อการเข้าพักรักษาตัวครั้งใดครั้งหนึ่ง',
 'ผลประโยชน์เพิ่มเติมกรณีไอ.ซี.ยู. รักษาในต่างประเทศ และผ่าตัด รวมกันสูงสุด 30 วัน และไม่เกิน 1 เท่าของผลประโยชน์รายวัน ไม่บวกตัวอย่างแต่ละกรณีเข้าด้วยกัน',
 'ความคุ้มครองกรณีรักษานอกประเทศไทยระงับชั่วคราวเมื่อพักอาศัยนอกประเทศต่อเนื่องครบ 90 วัน และกลับมีผลเมื่อเดินทางกลับประเทศไทย',
 'ระยะเวลารอคอยกรณีเจ็บป่วย 30 วัน กรณีอุบัติเหตุไม่มีระยะเวลารอคอย ตามเงื่อนไขเอกสารที่ให้ไว้'
];
export function dailyBenefits(amount){
 const benefit=Number(amount);
 if(![500,1000].includes(benefit))throw Error('ค่าชดเชยรายวัน: กรุณาเลือก 500 หรือ 1,000 บาทเท่านั้น');
 return [
  {label:'ผู้ป่วยในจากการบาดเจ็บหรือเจ็บป่วย',amount:benefit},
  {label:'ห้องผู้ป่วยหนัก (ไอ.ซี.ยู.) · รวม 2 เท่า',amount:benefit*2},
  {label:'ผู้ป่วยในของโรงพยาบาลนอกประเทศไทย · รวม 2 เท่า',amount:benefit*2},
  {label:'ผ่าตัดและเข้ารักษาเป็นผู้ป่วยใน · รวม 1.5 เท่า',amount:benefit*1.5}
 ];
}
export function dailyQuote(input){
 const age=Number(input.age),benefit=Number(input.dailyBenefit);
 const benefits=dailyBenefits(benefit);
 if(input.age===''||!Number.isInteger(age)||age<16||age>64)throw Error('ค่าชดเชยรายวัน: รับอายุเริ่มสัญญา 16–64 ปี คุ้มครองถึงอายุ 65 ปี');
 if(!['male','female'].includes(input.gender))throw Error('กรุณาเลือกเพศ');
 const frequencyIndex=DAILY_FREQUENCIES.indexOf(input.frequency);
 if(frequencyIndex<0)throw Error('กรุณาเลือกงวดชำระเบี้ย');
 const band=DAILY_RATES.find(b=>age>=b.min&&age<=b.max),rates=band.rates[benefit];
 return {label:DAILY_NAME,detail:`ค่าชดเชย ${benefit.toLocaleString('th-TH')} บาท/วัน`,benefit,benefits,premium:rates[frequencyIndex],annualRate:rates[0],entryAge:age,ageBand:[band.min,band.max],source:`ค่าชดเชย (เบี้ย).pdf หน้า ${band.page}`,occupation:'1–3'};
}
export function dailySummary(daily,frequency){
 const money=n=>n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
 return ['',DAILY_NAME,daily.detail,`เบี้ย${frequency.label} ${money(daily.premium)} บาท/งวด`,`รวมชำระ ${money(daily.annual)} บาท/ปี`,...daily.benefits.map(b=>`${b.label}: ${money(b.amount)} บาท/วัน`),...DAILY_TERMS].join('\n');
}
