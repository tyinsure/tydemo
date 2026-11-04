import {copyPlainText} from './customer-summary.mjs';
export function mountCustomerSummary({getResult,getInput,refresh,createSummary}){
 const $=id=>document.getElementById(id),box=$('customer-summary-text'),copy=$('copy-summary'),regenerate=$('regenerate-summary'),status=$('summary-copy-status');
 let snapshot='';
 function update(){
  const result=getResult();snapshot=JSON.stringify(getInput());box.value=result?createSummary(result):'';
  copy.disabled=!result;regenerate.disabled=!result;copy.textContent='คัดลอกข้อความ';status.textContent=result?'':'กรอกข้อมูลให้ถูกต้องเพื่อสร้างข้อความสรุป';
 }
 function ensureCurrent(){if(snapshot!==JSON.stringify(getInput()))refresh();return getResult();}
 copy.addEventListener('click',async()=>{
  if(!ensureCurrent())return;
  const text=box.value;
  if(!text.trim()){status.textContent='ใส่ข้อความ หรือกดสร้างข้อความใหม่จากผลคำนวณ';return;}
  copy.disabled=true;
  try{await copyPlainText(text);copy.textContent='คัดลอกแล้ว';status.textContent='คัดลอกแล้ว นำไปวางในแชต LINE ได้เลยครับ';}
  catch{box.focus();box.select();box.setSelectionRange(0,box.value.length);status.textContent='กดค้างที่ข้อความแล้วเลือกคัดลอก หรือกด Ctrl+C เพื่อคัดลอกด้วยตนเอง';}
  finally{copy.disabled=!getResult();}
 });
 regenerate.addEventListener('click',()=>{if(ensureCurrent())update();});
 box.addEventListener('input',()=>{copy.textContent='คัดลอกข้อความ';status.textContent='';});
 return {update};
}
