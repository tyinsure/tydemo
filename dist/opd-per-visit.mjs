import {OPD_PER_VISIT_AGES,OPD_PER_VISIT_RATES} from './opd-per-visit-rates.mjs';
export const OPD_PER_VISIT_BENEFITS=[500,800,1000,1500,2000,2500,3000];
export const OPD_PER_VISIT_BENEFIT_TEXT='ค่ารักษาพยาบาลผู้ป่วยนอกจ่ายตามจริง ไม่เกินวงเงินต่อครั้งที่เลือก จำกัดสูงสุด 1 ครั้งต่อวัน';
export const OPD_PER_VISIT_TERMS=[
 'เข้ารับการรักษาแบบผู้ป่วยนอกได้สูงสุด 1 ครั้งต่อวัน และไม่เกิน 30 ครั้งต่อปี รวมค่ารักษาพยาบาลไม่เกินวงเงินรวมของแผนที่เลือก',
 'การรักษาโรคหรือภาวะแทรกซ้อนจากโรคเดียวกันต่อเนื่องได้ไม่เกิน 7 ครั้ง หากต้องรักษาต่อเนื่องจากโรคเดิมและห่างจากการรักษาครั้งสุดท้ายเกินกว่า 14 วัน ให้ถือเป็นการรักษาโรคใหม่',
 'อัตราเบี้ยเปลี่ยนตามอายุ อัตราอายุ 81–98 ปีสำหรับต่ออายุเท่านั้น; กลุ่มอาชีพ 1 และ 2 ตามตารางที่ได้รับ'
];
export function opdPerVisitQuote(input,age=Number(input.age),renewal=false){
 if(!Number.isInteger(age)||age<6||age>98)throw Error('OPD ต่อครั้ง: ตารางอัตราเบี้ยรองรับอายุ 6–98 ปี');
 if(!renewal&&age>80)throw Error('OPD ต่อครั้ง: อายุ 81–98 ปีเป็นอัตราสำหรับต่ออายุเท่านั้น');
 if(!['male','female'].includes(input.gender))throw Error('กรุณาเลือกเพศ');
 const benefit=Number(input.opdBenefit),plan=OPD_PER_VISIT_BENEFITS.indexOf(benefit),band=OPD_PER_VISIT_AGES.findIndex(([min,max])=>age>=min&&age<=max);
 if(plan<0)throw Error('กรุณาเลือกวงเงิน OPD ต่อครั้งตามแผนที่กำหนด');
 const table=OPD_PER_VISIT_RATES[input.frequency];if(!table)throw Error('กรุณาเลือกงวดชำระเบี้ย');
 const column=plan*2+(input.gender==='female'?1:0),premium=table[band][column],annualRate=OPD_PER_VISIT_RATES.annual[band][column],annualLimit=benefit*30;
 return {label:'OPD ต่อครั้ง',detail:`ครั้งละ ${benefit.toLocaleString('th-TH')} บาท · รวมสูงสุด ${annualLimit.toLocaleString('th-TH')} บาทต่อปี`,product:'per-visit',benefit,annualLimit,premium,annualRate,occupation:'1–2',renewalAge:81,benefitText:OPD_PER_VISIT_BENEFIT_TEXT,terms:OPD_PER_VISIT_TERMS};
}
