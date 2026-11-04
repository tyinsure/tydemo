export const CONVERTIBLE_WINDOWS=[[11,15],[55,65]];
export function convertibleAges(startAge,index){
 const [min,max]=CONVERTIBLE_WINDOWS[index];
 return Array.from({length:max-min+1},(_,i)=>min+i).filter(age=>age>=Number(startAge)+5);
}
export function lowerDeductible(option,benefit){
 return option==='ded100000'?'ded50000':option==='ded50000'?(Number(benefit)===1000000?'ded20000':'ded30000'):['ded30000','ded20000'].includes(option)?'ded0':option;
}
export function convertiblePlan(input){
 if(input.healthProduct!=='dhealth'||!input.healthConvertible||input.healthType!=='deductible')return [];
 let option=input.healthOption;const changes=[];
 for(const [index,value] of [input.convertibleAge1,input.convertibleAge2].entries()){
  if(value==null||value==='')continue;
  const age=Number(value);
  if(!convertibleAges(input.age,index).includes(age))throw Error('Convertible Option: อายุใช้สิทธิ์ต้องอยู่ในช่วงที่กำหนด และถือ D Health Lite ต่อเนื่องอย่างน้อย 5 ปี');
  const next=lowerDeductible(option,input.healthBenefit);
  if(next!==option){changes.push({age,from:option,to:next});option=next;}
 }
 return changes;
}
export function convertibleOptionAtAge(input,age){
 let option=input.healthType==='none'?'ded0':input.healthOption;
 for(const change of convertiblePlan(input))if(age>=change.age)option=change.to;
 return option;
}
export function convertibleNotes(changes){
 const label=id=>id==='ded0'?'ไม่มี Deductible':Number(id.slice(3)).toLocaleString('th-TH')+' บาท';
 return changes.length?['Convertible Option (สมมติถือ D Health Lite ต่อเนื่อง): '+changes.map(c=>'อายุ '+c.age+' ปี '+label(c.from)+' → '+label(c.to)).join(' · '),'ใช้สิทธิ์ช่วงอายุ 11–15 ปี และ 55–65 ปี ช่วงละ 1 ครั้ง ถือสัญญาต่อเนื่องอย่างน้อย 5 ปี ไม่ต้องแถลงสุขภาพใหม่ และเป็นไปตามเงื่อนไขบริษัท']:[];
}
