import {opdPerVisitQuote} from './opd-per-visit.mjs';
// Supplied OPD เหมาจ่าย images; annual rates for occupation classes 1 and 2.
export const OPD_BENEFITS=[15000,20000,25000,30000,50000,100000];
export const OPD_ANNUAL_BANDS=[
 {min:6,max:10,rates:[13500,13500,18000,18000,22500,22500,27000,27000,45000,45000,82815,86747]},
 {min:11,max:20,rates:[7604,7645,8085,8132,10464,10503,11099,11109,18702,18822,36739,37076]},
 {min:21,max:30,rates:[8298,8382,8831,8838,10702,10868,11730,11769,20060,20153,39558,39567]},
 {min:31,max:40,rates:[8569,9157,10432,10477,13506,13938,16613,17367,26479,27412,47383,50108]},
 {min:41,max:50,rates:[10378,11252,13228,13864,16698,16763,18702,20141,31475,33062,53507,57352]},
 {min:51,max:60,rates:[10516,11904,14068,15418,17124,18635,19920,21878,33575,36950,57077,62815]},
 {min:61,max:70,rates:[10855,13500,14229,18000,17388,22228,20154,26354,33977,43997,59494,75934]},
 {min:71,max:75,rates:[12874,13500,16876,18000,20431,22500,23902,27000,40297,45000,74671,90000]},
 {min:76,max:80,rates:[13500,13500,18000,18000,22500,22500,27000,27000,45000,45000,82453,90000]},
 {min:81,max:90,rates:[14250,14250,19000,19000,23750,23750,28500,28500,45000,45000,90000,90000]},
 {min:91,max:98,rates:[14250,14250,19000,19000,23750,23750,28500,28500,45000,45000,90000,90000]}
];
export const OPD_FACTORS={annual:1000,semiannual:520,quarterly:260,monthly:87};
export const OPD_BENEFIT_TEXT='ค่าธรรมเนียมปรึกษาแพทย์เวชปฏิบัติทั่วไปและแพทย์เฉพาะทาง รวมกายภาพบำบัด กิจกรรมบำบัด ค่าวินิจฉัย การตรวจทางห้องปฏิบัติการ ค่าเอ็กซเรย์ ค่าอัลตราซาวด์ และค่ายา';
export const OPD_TERMS=[
 'วงเงินค่ารักษาพยาบาลผู้ป่วยนอกต่อปีกรมธรรม์ตามแผนที่เลือก จำกัดสูงสุด 2 ครั้งต่อวัน ค่ายาจ่ายไม่เกิน 30 วันหลังจากวันที่เข้ารับการรักษาตัวเป็นผู้ป่วยนอก',
 'ระยะไม่คุ้มครอง 30 วัน: การป่วยที่เกิดขึ้นในช่วง 30 วันตามเงื่อนไขสัญญา',
 'ระยะไม่คุ้มครอง 120 วัน: เนื้องอก ถุงน้ำ หรือมะเร็งทุกชนิด; ริดสีดวงทวาร; ไส้เลื่อนทุกชนิด; ต้อเนื้อหรือต้อกระจก; การตัดทอนซิลหรืออดีนอยด์; นิ่วทุกชนิด; เส้นเลือดขอดที่ขา; เยื่อบุโพรงมดลูกเจริญผิดที่',
 'ระยะไม่คุ้มครอง 180 วัน: โรคต่อมไทรอยด์ โรคลมบ้าหมู โรคเบาหวาน โรคภูมิแพ้ โรคความดันโลหิตสูง โรคหัวใจ และโรคเกี่ยวกับกระเพาะอาหาร',
 'นับระยะไม่คุ้มครองจากวันเริ่มมีผลคุ้มครอง วันที่บริษัทอนุมัติเพิ่มผลประโยชน์ หรือวันต่ออายุสัญญาเพิ่มเติม (Reinstatement) ครั้งสุดท้าย แล้วแต่กรณีใดเกิดขึ้นภายหลัง; กรณีเพิ่มผลประโยชน์ใช้เฉพาะส่วนที่เพิ่มขึ้น',
 'ไม่ใช้ระยะไม่คุ้มครองนี้กับการบาดเจ็บหรืออันตรายที่ได้รับจากอุบัติเหตุฉุกเฉินซึ่งไม่เกิดจากการสืบเนื่องจากโรคต่าง ๆ ที่เป็นมาก่อนเอาประกันภัย ตามเงื่อนไขในเอกสาร',
 'เบี้ยเปลี่ยนตามอายุ อัตราอายุ 91–98 ปีสำหรับต่ออายุเท่านั้น; กลุ่มอาชีพ 1 และ 2 ตามตารางที่ได้รับ'
];
export function opdQuote(input,age=Number(input.age),renewal=false){
 if(!input.opdType)return null;
 if(input.opdType==='per-visit')return opdPerVisitQuote(input,age,renewal);
 if(input.opdType!=='lump')throw Error('กรุณาเลือกประเภท OPD');
 if(!Number.isInteger(age)||age<6||age>98)throw Error('OPD เหมาจ่าย: ตารางอัตราเบี้ยรองรับอายุ 6–98 ปี');
 if(!renewal&&age>90)throw Error('OPD เหมาจ่าย: อายุ 91–98 ปีเป็นอัตราสำหรับต่ออายุเท่านั้น');
 if(!['male','female'].includes(input.gender))throw Error('กรุณาเลือกเพศ');
 const benefit=Number(input.opdBenefit),column=OPD_BENEFITS.indexOf(benefit),factor=OPD_FACTORS[input.frequency];
 if(column<0)throw Error('กรุณาเลือกวงเงิน OPD เหมาจ่ายตามแผนที่กำหนด');
 if(factor===undefined)throw Error('กรุณาเลือกงวดชำระเบี้ย');
 const band=OPD_ANNUAL_BANDS.find(b=>age>=b.min&&age<=b.max),annualRate=band.rates[column*2+(input.gender==='female'?1:0)];
 // User confirmed .50 rounds up. Integer arithmetic avoids floating-point tie errors.
 const premium=Math.floor((annualRate*factor+500)/1000);
 return {label:'OPD เหมาจ่าย',detail:`วงเงิน ${benefit.toLocaleString('th-TH')} บาทต่อปีกรมธรรม์`,product:'lump',benefit,premium,annualRate,occupation:'1–2',renewalAge:91,benefitText:OPD_BENEFIT_TEXT,terms:OPD_TERMS};
}
export function opdSummary(opd,frequency){
 return [opd.label+' · '+opd.detail,'กลุ่มอาชีพ 1–2',`เบี้ย${frequency.label} ${opd.premium.toLocaleString('th-TH',{minimumFractionDigits:2})} บาท/งวด`,opd.benefitText,...opd.terms].join('\n');
}
