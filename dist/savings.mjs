import {elapsedYearLabel} from './elapsed-year.mjs';
import {calculateSavings,savingsDividendLabel} from './savings-calculator.mjs';
import {createSavingsExcel,createSavingsPDF} from './savings-report.mjs';
const $=id=>document.getElementById(id),money=n=>n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
let current=null,mode='sum',exporting=false;
function render(){
 $('days-field').hidden=$('age').value!== '0';$('index-fields').hidden=!$('simulate').checked;
 const annualMode=$('return-mode').value==='annual';$('annual-return-field').hidden=!annualMode;$('index-level-fields').hidden=annualMode;
 $('amount-label').textContent=mode==='sum'?'ทุนประกัน (บาท)':'เบี้ยประกันรายปี (บาท)';
 try{const r=calculateSavings({plan:$('plan').value,age:$('age').value,atLeast30Days:$('days').checked,mode:mode,amount:$('amount').value,simulate:$('simulate').checked,returnMode:$('return-mode').value,annualReturn:$('annual-return').value,indexStart:$('index-start').value,indexEnd:$('index-end').value,fxStart:$('fx-start').value,fxEnd:$('fx-end').value});current=r;
 $('error').hidden=true;$('print').disabled=false;$('copy').disabled=false;
 $('selected-plan').textContent=r.plan.name;
 $('dividend-heading').textContent=savingsDividendLabel(r);
 $('rate-note').textContent=`ทุนขั้นต่ำ 20,000 บาท · อัตรา ${r.rate} บาทต่อทุน 1,000 บาท`;
 const metrics=[['ทุนประกัน',r.sum],['เบี้ยประกันรายปี',r.premium],['เบี้ยรวม 6 ปี',r.totalPremium],['เงินคืนรวม 7 ครั้ง',r.cashTotal],['เงินครบสัญญา',r.maturity],['ผลประโยชน์การันตีรวม',r.guaranteedTotal]];
 if(r.indexBenefit!==null)metrics.push(['ผลตอบแทนดัชนีคาดการณ์ (ไม่การันตี)',r.indexBenefit],['ยอดรับรวมคาดการณ์ (รวมเงินคืน)',r.projectedTotal],['ส่วนต่างยอดรับคาดการณ์กับเบี้ยรวม',r.projectedGain]);
 $('metrics').innerHTML=metrics.map(([label,value])=>`<div class="card saving-metric"><p>${label}</p><strong>${money(value)}</strong><small>บาท</small></div>`).join('');
 $('benefits').textContent=`รับเงินคืน ${(r.plan.cashRate*100)}% ของทุนประกัน (${money(r.cash)} บาท) ณ สิ้นปีที่ 2, 4, 6, 8, 10, 12 และ 14 · PR ${r.plan.pr*100}%`;
 $('index-result').hidden=r.indexBenefit===null;
 $('index-result').textContent=r.indexBenefit===null?'':`${r.assumedAnnualReturn===null?'คำนวณจากระดับดัชนีที่ระบุ':`สมมติดัชนีเติบโตเฉลี่ย ${r.assumedAnnualReturn}% ต่อปี ตามสมมติฐานเทียบตัวอย่างเอกสาร`}${r.projectedIndexEnd===null?'':` · ดัชนี 230 → ${money(r.projectedIndexEnd)}`} · PR ${r.plan.pr*100}% · อัตราแลกเปลี่ยน ${$('fx-start').value} → ${$('fx-end').value} บาท/USD · ผลตอบแทนดัชนีคาดการณ์ ${money(r.indexBenefit)} บาท · ยอดรับรวมคาดการณ์ ${money(r.projectedTotal)} บาท (ไม่การันตีส่วนดัชนี)`;
 $('schedule-body').innerHTML=r.rows.map(row=>`<tr><td><span class="age-number">${row.age}</span><small class="phase">${elapsedYearLabel(r,row)}</small>${row.year===15?'<small class="maturity-label">ครบสัญญา</small>':''}</td>${[row.premium,row.paid,row.cash+row.maturity,row.life,row.indexBenefit].map(value=>`<td>${value===null?'—':money(value)}</td>`).join('')}</tr>`).join('');
 $('savings-mobile-schedule').innerHTML=r.rows.map(row=>{
 const labels=['เบี้ยประกัน (บาท/ปี)','เบี้ยสะสม (บาท)','เงินคืนตามสัญญา (บาท)','ประกันชีวิต* (บาท)',savingsDividendLabel(r)+' (บาท)'];
 const values=[row.premium,row.paid,row.cash+row.maturity,row.life,row.indexBenefit];
 return `<details class="saving-age-card${row.year===15?' saving-age-maturity':''}"${row.year===0?' open':''}><summary><span><strong>อายุ ${row.age} ปี</strong><small>${elapsedYearLabel(r,row)}${row.year===15?' · ครบสัญญา':''}</small></span><span class="saving-age-premium"><small>เบี้ยประกัน / ปี</small><strong>${money(row.premium)} บาท</strong></span></summary><dl>${labels.map((label,i)=>`<div><dt>${label}</dt><dd>${values[i]===null?'—':money(values[i])}</dd></div>`).join('')}</dl></details>`;
 }).join('');
 $('summary').value=`TYINSURE | แผนออมทรัพย์\n${r.plan.name}\nเพศ${$('gender').value==='male'?'ชาย':'หญิง'} อายุ ${r.age} ปี\nทุนประกัน ${money(r.sum)} บาท\nชำระรายปี ${money(r.premium)} บาท นาน 6 ปี คุ้มครอง 15 ปี\nเบี้ยรวม ${money(r.totalPremium)} บาท\nเงินคืนทุก 2 ปี ครั้งละ ${money(r.cash)} บาท รวม 7 ครั้ง\nเริ่มสัญญาอายุ ${r.age} ปี = ปีที่ 0 · ครบ 15 ปี อายุ ${r.age+15} ปี\nเงินคืนที่อายุ ${[2,4,6,8,10,12,14].map(y=>r.age+y).join(', ')} ปี\nเงินครบสัญญา ${money(r.maturity)} บาท\nผลประโยชน์การันตีรวม ${money(r.guaranteedTotal)} บาท\nPR ${r.plan.pr*100}%${r.indexBenefit===null?'':`\n${r.assumedAnnualReturn===null?'ใช้ระดับดัชนีที่ระบุ':`สมมติผลตอบแทนดัชนี ${r.assumedAnnualReturn}% ต่อปี ตามสมมติฐานเทียบตัวอย่างเอกสาร`}${r.projectedIndexEnd===null?'':`\nดัชนีเริ่มต้น 230 → ${money(r.projectedIndexEnd)} (สมมติ 14 ปี 11 เดือนเพื่อเทียบตัวอย่าง ไม่ใช่วันลงทุนจริง)`}\nอัตราแลกเปลี่ยน ${$('fx-start').value} → ${$('fx-end').value} บาท/USD\nผลตอบแทนดัชนีคาดการณ์ ${money(r.indexBenefit)} บาท (ไม่การันตี)\nยอดรับรวมคาดการณ์ ${money(r.projectedTotal)} บาท\nส่วนต่างยอดรับคาดการณ์กับเบี้ยรวม ${money(r.projectedGain)} บาท`}\nผลตอบแทนตามดัชนีไม่การันตี จ่ายเมื่อมีชีวิตอยู่ครบสัญญาเท่านั้น\nเอกสารนี้จัดทำเพื่อเป็นข้อมูลเพื่อใช้ประกอบการตัดสินใจเท่านั้น ไม่ใช่ใบเสนอขาย\nทัก LINE @TYINSURE`;
 }catch(e){$('dividend-heading').textContent='เงินปันผลหากได้ผลตอบแทน';current=null;$('error').hidden=false;$('error').textContent=e.message;$('rate-note').textContent='ทุนประกันขั้นต่ำ 20,000 บาท';$('metrics').replaceChildren();$('schedule-body').replaceChildren();$('savings-mobile-schedule').replaceChildren();$('selected-plan').textContent='';$('benefits').textContent='';$('index-result').hidden=true;$('summary').value='';$('print').disabled=true;$('copy').disabled=true;}
 $('copy-status').textContent='';
 $('excel').disabled=$('pdf').disabled=!current||exporting;
}
$('savings-form').addEventListener('submit',e=>e.preventDefault());$('savings-form').addEventListener('input',render);$('savings-form').addEventListener('change',render);
$('print').addEventListener('click',()=>{render();if(current)window.print();});
window.addEventListener('beforeprint',render);
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('summary').value);$('copy-status').textContent=' คัดลอกแล้ว';}catch{$('summary').select();$('copy-status').textContent=' เลือกข้อความแล้ว กรุณาคัดลอก';}});
render();

for(const value of ['sum','premium'])$('mode-'+value).addEventListener('click',()=>{mode=value;for(const key of ['sum','premium']){$('mode-'+key).classList.toggle('active',key===value);$('mode-'+key).setAttribute('aria-selected',String(key===value));}render();});
async function download(kind){
 if(exporting)return;render();if(!current)return;
 const result=current,options={mode,gender:$('gender').value,fxStart:$('fx-start').value,fxEnd:$('fx-end').value};
 exporting=true;$('excel').disabled=$('pdf').disabled=true;$('export-status').textContent='กำลังสร้างไฟล์…';
 try{
  const blob=await(kind==='pdf'?createSavingsPDF(result,options):createSavingsExcel(result,options));
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`TYINSURE_Savings_15-6_${result.plan.pr===1?'Pro':'Global'}_age${result.age}.${kind==='pdf'?'pdf':'xlsx'}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('export-status').textContent='สร้างไฟล์เรียบร้อยแล้ว';
 }catch(e){$('export-status').textContent='สร้างไฟล์ไม่สำเร็จ: '+e.message;}finally{exporting=false;$('excel').disabled=$('pdf').disabled=!current;}
}
$('excel').addEventListener('click',()=>download('excel'));$('pdf').addEventListener('click',()=>download('pdf'));
