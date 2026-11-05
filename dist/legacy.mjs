import {calculateLegacyWealth,legacyWealthSummary} from './legacy-wealth-calculator.mjs';
import {calculatePremierLegacy,premierLegacySummary} from './premier-legacy-calculator.mjs';
import {elapsedYearLabel} from './elapsed-year.mjs';
import {schedulePremiumUnit,schedulePremiumValues} from './legacy-schedule-view.mjs';
import {PA_PLANS,paAnnualPremium} from './pa-easy.mjs';
import {mountCustomerSummary} from './summary-controller.mjs';
import {legacySummary} from './legacy-calculator.mjs';
import {calculateLegacy} from './legacy-calculator.mjs';
import {createExcelReport} from './excel-export.mjs';
import {createPDFReport} from './pdf-export.mjs';
import {premiumPaymentViews,premiumPaymentTable} from './premium-payment-views.mjs';
const $=id=>document.getElementById(id),money=n=>n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
let data,premierData,wealthData,premier5Data,premier10Data,smartPremierData,activeProduct='9920';const productState={};
const isPremier=()=>$('legacy-product')?.value==='premier991';
const isWealth=()=>$('legacy-product')?.value==='wealth995';
const isPremier5=()=>$('legacy-product')?.value==='premier995';
const isPremier10=()=>$('legacy-product')?.value==='premier9910';
const isSmartPremier=()=>$('legacy-product')?.value==='smart9999premier';
const isMultiPay=()=>isWealth()||isPremier5()||isPremier10()||isSmartPremier();
const paymentYears=()=>isSmartPremier()?99-Number($('age').value):isPremier10()?10:5;
const isFixedLegacy=()=>isPremier()||isMultiPay();
const activeData=()=>isPremier()?premierData:isWealth()?wealthData:isPremier5()?premier5Data:isPremier10()?premier10Data:isSmartPremier()?smartPremierData:data;
const calculate=(d,i)=>isPremier()?calculatePremierLegacy(d,i):isMultiPay()?calculateLegacyWealth(d,i):calculateLegacy(d,i);
let mode='sum',result=null,premiumView='selected',scheduleDisplay='annual';
function updatePremiumView(r){
 const all=premiumView==='all',unit={annual:'ปี',semiannual:'6เดือน',quarterly:'3เดือน',monthly:'เดือน'}[r.frequency.id];
 $('premium-cost').hidden=!r.rider;
 $('premium-selected-view').hidden=all;$('premium-all-view').hidden=!all;
 $('premium-view-selected').setAttribute('aria-pressed',String(!all));$('premium-view-all').setAttribute('aria-pressed',String(all));
 $('pa-cost-title').textContent=all?'เบี้ยรวมปีแรก • ทุกงวดชำระ':'เบี้ยรวมปีแรก • ชำระ'+r.frequency.label;
 $('premium-unit-heading').textContent=r.frequency.label;
 $('pa-base-annual').textContent=money(r.premium)+' บาท/'+unit;
 $('pa-annual').textContent=money(r.rider?.premium??0)+' บาท/'+unit;
 $('pa-combined').textContent=money(r.combinedFirstYearPremium??r.premium)+' บาท/'+unit;
 $('pa-selection').textContent=r.rider?.name??'';
 $('premium-all-view').innerHTML=all?premiumPaymentTable(premiumPaymentViews(activeData(),{},input(),r,calculate),r,r.frequency.id):'';
}
const input=()=>({age:$('age').value,gender:document.querySelector('input[name="gender"]:checked')?.value,amount:$('amount').value,frequency:$('frequency').value,mode,product:activeProduct,premierAtLeast30Days:$('premier-infant').checked,paEnabled:!isFixedLegacy()&&$('pa-enabled').checked,paPlan:$('pa-plan').value,paOccupation:'1',paHoliday:false,paAtLeast30Days:$('pa-infant').checked});
const summary=mountCustomerSummary({getResult:()=>result,getInput:input,refresh:render,createSummary:r=>r.product==='premier991'?premierLegacySummary(r):['wealth995','premier995','premier9910','smart9999premier'].includes(r.product)?legacyWealthSummary(r):legacySummary(r)});
function updateRiderControls(){
 if(!isFixedLegacy())$('pa-enabled').checked=true;$('pa-enabled').disabled=true;
 $('legacy-pa-box').hidden=isFixedLegacy();$('premier-infant-label').hidden=!isPremier()||Number($('age').value)!==0;
 const enabled=!isFixedLegacy()&&$('pa-enabled').checked,age=Number($('age').value),plan=PA_PLANS.find(p=>p.id===Number($('pa-plan').value));
 $('pa-controls').hidden=!enabled;$('pa-infant-label').hidden=age!==0;
 for(const option of $('pa-plan').options){const price=paAnnualPremium(age,Number(option.value));option.disabled=price===null;option.textContent=`แผน ${option.value}${price===null?' · ไม่มีอัตราสำหรับอายุนี้':''}`;}
 $('pa-premium-heading').hidden=!enabled;$('pa-table-note').hidden=!enabled;$('pa-cost').hidden=!enabled;
 document.body.classList.toggle('has-pa-rider',enabled);
 if(enabled&&plan)$('pa-benefits').innerHTML=`<p><strong>วงเงินสูงสุดตามเหตุการณ์ · ${plan.name}</strong></p><dl>${[
 ['อุบัติเหตุที่ไม่ใช่ขับขี่/โดยสารรถจักรยานยนต์',plan.accident],['ฆาตกรรมหรือถูกทำร้ายร่างกาย',plan.assault],['ขับขี่/โดยสารรถจักรยานยนต์',plan.motorcycle],['อุบัติเหตุสาธารณะ',plan.publicAccident],['ค่ารักษาพยาบาลต่ออุบัติเหตุ',plan.medical]
 ].map(([name,value])=>`<div><dt>${name}</dt><dd>${money(value)} บาท</dd></div>`).join('')}</dl>`;
}
function render(){
 updateRiderControls();
 if(!data||!premierData||!wealthData||!premier5Data||!premier10Data||!smartPremierData)return;
 $('amount').min=isFixedLegacy()&&mode==='sum'?'10000000':'0.01';
 const frequency=activeData().frequencies.find(f=>f.id===$('frequency').value);
 $('amount-label').innerHTML=mode==='sum'?'ทุนประกัน <span>บาท</span>':`เบี้ยประกัน${frequency.label} <span>บาท/งวด</span>`;
 $('amount-hint').textContent=isPremier()?'ทุนประกันขั้นต่ำ 10,000,000 บาท · เบี้ยรายปี ชำระครั้งเดียว':isSmartPremier()?'ทุนประกันขั้นต่ำ 10,000,000 บาท · ชำระเบี้ยถึงอายุ 99 ปี':isMultiPay()?`ทุนประกันขั้นต่ำ 10,000,000 บาท · ชำระเบี้ย ${paymentYears()} ปี`:mode==='sum'?'ระบุทุนประกันที่ต้องการส่งต่อ':'เบี้ยที่กรอกเป็นสัญญาหลัก ไม่รวมสัญญาเพิ่มเติม ทุนแสดงทศนิยม 2 ตำแหน่ง';
 try{
  const r=calculate(activeData(),input());result=r;$('error').hidden=true;$('legacy-results').classList.remove('invalid');
  $('headline-label').textContent=mode==='sum'?`${r.rider?'เบี้ยสัญญาหลัก':'เบี้ยประกัน'}${r.frequency.label}`:'ทุนประกันที่คำนวณได้';
  $('headline-value').textContent=money(mode==='sum'?r.premium:r.sum);$('headline-unit').textContent=mode==='sum'?'บาท/งวด':'บาท';
  $('complement-label').textContent=mode==='sum'?'ทุนประกัน':`เบี้ยสัญญาหลัก${r.frequency.label}`;$('complement-value').textContent=`${money(mode==='sum'?r.sum:r.premium)} บาท`;
  $('rate-detail').textContent=`อัตรา${r.frequency.label} ${r.rate.toFixed(r.frequency.id==='monthly'?3:2)} บาท ต่อทุน 1,000 บาท`;
  updatePremiumView(r);
  $('initial-coverage').textContent=money(r.initialCoverage);$('total-paid').textContent=money(r.totalPaid);$('maturity-value').textContent=money(r.maturityAmount);
  $('pay-note').textContent=`บาท · สัญญาหลัก · ${r.payYears*r.frequency.payments} งวด${isPremier()?' ชำระครั้งเดียว':` ใน ${r.payYears} ปี`}`;
  if(isSmartPremier()){document.querySelector('.legacy-journey h3').textContent='ชำระเบี้ยและคุ้มครองถึงอายุ 99 ปี';$('paid-age').nextElementSibling.textContent=`ชำระเบี้ยปีสุดท้าย (ปีที่ ${r.payYears-1})`;}
  $('start-age').textContent=`${r.age} ปี`;$('paid-age').textContent=`${r.age+(isPremier()?0:isMultiPay()?r.payYears-1:r.payYears)} ปี`;
  $('calculation-note').textContent=`ชำระ${r.frequency.label} ${money(r.premium)} บาท/งวด · รวมต่อปี ${money(r.annualPaid)} บาท · ${mode==='premium'?'ทุนคำนวณตามเบี้ยที่กรอก':'ไม่มีส่วนลดอัตราเบี้ยรายปี'}`;
  renderSchedule(r);
  $('excel').disabled=false;$('pdf').disabled=false;$('print').disabled=false;summary.update();
 }catch(e){
  $('premium-cost').hidden=true;$('premium-all-view').replaceChildren();result=null;$('error').hidden=false;$('error').textContent=e.message;$('legacy-results').classList.add('invalid');
  for(const id of ['headline-value','complement-value','initial-coverage','total-paid','maturity-value','pa-base-annual','pa-annual','pa-combined'])$(id).textContent='—';
  $('rate-detail').textContent='';$('calculation-note').textContent='กรอกข้อมูลให้ถูกต้องเพื่อดูผลคำนวณ';$('schedule-body').replaceChildren();$('row-count').textContent='ยังไม่มีข้อมูล';
  $('schedule-description').textContent='';
  for(const id of ['excel','pdf','print'])$(id).disabled=true;summary.update();
 }
}
function renderSchedule(r){
  const unit=schedulePremiumUnit(r,scheduleDisplay),modal=scheduleDisplay==='modal';
  $('schedule-title').textContent=modal?'เบี้ยและความคุ้มครองตามโหมดชำระ':'เบี้ยและความคุ้มครองรายปี';
  for(const v of ['modal','annual'])$('schedule-view-'+v).setAttribute('aria-pressed',String(v===scheduleDisplay));
  $('schedule-main-heading').innerHTML='เบี้ยประกันชีวิต<br><small>บาท/'+unit+'</small>';
  $('pa-premium-heading').innerHTML='เบี้ย PA<br><small>บาท/'+unit+'</small>';
  $('schedule-total-heading').innerHTML='เบี้ยประกันหลักสะสม<br><small>บาท</small>';
  $('pa-table-note').textContent=modal?'คอลัมน์เบี้ยชีวิตและ PA แสดงเบี้ยต่องวดตามโหมดชำระที่เลือก โดยใช้อัตรา PA ตามอายุถึง 85 ปี ยอดเบี้ยประกันหลักสะสมไม่รวม PA — หมายถึงไม่มีอัตรา ไม่ใช่เบี้ยฟรี และไม่ใช่การยืนยันสิทธิต่ออายุ':'คอลัมน์เบี้ยชีวิตและ PA แสดงเบี้ยรวมทุกงวดต่อปี โดยใช้อัตรา PA ตามอายุถึง 85 ปี ยอดเบี้ยประกันหลักสะสมไม่รวม PA — หมายถึงไม่มีอัตรา ไม่ใช่เบี้ยฟรี และไม่ใช่การยืนยันสิทธิต่ออายุ';
  $('schedule-footer-note').textContent='เบี้ยประกันหลักสะสม = เบี้ยสัญญาหลักรวมทุกงวดตั้งแต่ปีแรกถึงปีนั้น ไม่รวม PA · ยอดสะสมเป็นบาท ไม่เปลี่ยนตามมุมมองต่องวด · คอลัมน์อายุเริ่มนับปีที่ 0 และแถวสุดท้ายครบสัญญาอายุ 99 ปี';
  if(isPremier())$('schedule-footer-note').textContent='เบี้ยสัญญาหลักชำระครั้งเดียวในปีที่ 0 · ประกันชีวิตขั้นต่ำ = ค่าสูงกว่าระหว่างทุนประกัน 100% และ 101% ของเบี้ยสัญญาหลักสะสม · ยังไม่รวมการเปรียบเทียบมูลค่าเวนคืน · ครบสัญญาอายุ 99 ปี';
  if(isMultiPay())$('schedule-footer-note').textContent=`ชำระเบี้ย ${r.payYears} ปี (ปีที่ 0–${r.payYears-1}) · ประกันชีวิตขั้นต่ำ = ค่าสูงกว่าระหว่างทุนประกัน 100% และ 101% ของเบี้ยสัญญาหลักสะสม · ตารางรวมเบี้ยตามงวดชำระของแต่ละปี · ยังไม่รวมมูลค่าเวนคืน · ครบสัญญาอายุ 99 ปี`;
  if(isFixedLegacy())$('schedule-footer-note').textContent+=' · เบี้ยประกันหลักสะสมรวมทุกงวดตั้งแต่ปีแรกถึงปีนั้น เฉพาะสัญญาหลัก (บาท)';
  $('schedule-description').textContent=`${r.gender==='male'?'ชาย':'หญิง'} อายุเริ่ม ${r.age} ปี · ทุน ${money(r.sum)} บาท · ชำระ${r.frequency.label}`;
  $('schedule-body').innerHTML=r.schedule.map(row=>{const values=schedulePremiumValues(r,row,scheduleDisplay);return `<tr class="${[1,r.payYears].includes(row.policyYear)||row.age===99?'milestone':''}"><td><span class="age-number">${row.age}</span><span class="phase">${elapsedYearLabel(r,row)} · ${row.policyYear===1?'เริ่มคุ้มครอง':row.age===99?'ครบสัญญา':row.policyYear===r.payYears?'ปีสุดท้ายที่ชำระเบี้ย':'คุ้มครอง'}</span></td><td>${values.main?money(values.main):'—'}</td>${r.rider?`<td class="rider-premium-value">${values.rider===null?'—':money(values.rider)}</td>`:''}<td class="total-premium-value">${money(row.paid)}</td><td class="coverage-value">${row.coverage?money(row.coverage):'—'}</td><td class="pension-value">${row.maturity?money(row.maturity):'—'}</td></tr>`;}).join('');
  $('row-count').textContent=`อายุ ${r.age}–99 ปี · ${r.schedule.length} แถว`;
}
async function download(kind){
 render();if(!result)return;
 const r=result,button=$(kind),label=button.textContent;button.disabled=true;button.textContent='กำลังสร้างไฟล์…';
 try{
  const blob=await(kind==='pdf'?createPDFReport({...r,schedulePremiumDisplay:scheduleDisplay,legacyCumulativeMain:true},mode):createExcelReport({...r,legacyCumulativeMain:true},mode)),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`TYINSURE_Legacy_${r.product==='premier991'?'99-1':r.product==='smart9999premier'?'Smart_99-99_Premier':r.product==='premier9910'?'Premier_99-10':r.product==='premier995'?'Premier_99-5':r.product==='wealth995'?'99-5':'99-20'}_age${r.age}.${kind==='pdf'?'pdf':'xlsx'}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }catch(e){$('error').hidden=false;$('error').textContent=`ดาวน์โหลดไม่สำเร็จ กรุณาลองอีกครั้ง (${e.message})`;}
 finally{button.textContent=label;button.disabled=!result;}
}
const originalFrequencies=$('frequency').innerHTML;
const originalJourney=document.querySelector('.legacy-journey').innerHTML,originalInfo=document.querySelector('.schedule-info p').innerHTML;
function changeProduct(){
 const next=isPremier()?'premier991':isWealth()?'wealth995':isPremier5()?'premier995':isPremier10()?'premier9910':isSmartPremier()?'smart9999premier':'9920';if(next===activeProduct)return;
 productState[activeProduct]={age:$('age').value,amount:$('amount').value,frequency:$('frequency').value,mode};
 activeProduct=next;const state=productState[next]??{age:$('age').value,amount:10000000,frequency:'annual',mode:'sum'};
 $('frequency').innerHTML=isPremier()?'<option value="annual">รายปี</option>':originalFrequencies;
 mode=state.mode;$('age').value=state.age;$('amount').value=state.amount;$('frequency').value=state.frequency;
 $('age').max=isPremier()||isSmartPremier()?'80':isWealth()?'75':'70';$('age').nextElementSibling.textContent=isSmartPremier()?'ตารางอัตราเบี้ยรองรับอายุ 0–80 ปี (แถว 30 วันใช้อายุ 0 ปี)':isPremier()?'ตารางอัตราเบี้ยรองรับอายุ 30 วัน–80 ปี':isPremier5()||isPremier10()?'ตารางอัตราเบี้ย Standard Class รองรับอายุ 0–70 ปี':isWealth()?'ตารางอัตราเบี้ยรองรับอายุ 0–75 ปี (แถว 30 วันใช้อายุ 0 ปี)':'ตารางอัตราเบี้ยรองรับอายุ 0–70 ปี';
 $('frequency').disabled=isPremier();$('frequency').nextElementSibling.textContent=isPremier()?'มีเฉพาะเบี้ยรายปี ชำระครั้งเดียว ณ เริ่มสัญญา':isSmartPremier()?'ใช้เบี้ยรายปี / ราย 6 เดือน / ราย 3 เดือน / รายเดือน ตามตารางที่แนบโดยตรง':isMultiPay()?'ราย 6 เดือน × 0.51 · ราย 3 เดือน × 0.26 · รายเดือน × 0.088 จากอัตรารายปี':'คำนวณด้วยอัตรารายงวดจากเอกสาร';
 $('amount').min=isFixedLegacy()&&mode==='sum'?'10000000':'0.01';
 document.querySelector('#legacy-results .plan-badge').textContent=isSmartPremier()?'99/99':isPremier()?'99/1':isPremier10()?'99/10':isMultiPay()?'99/5':'99/20';
 document.querySelector('.legacy-journey').innerHTML=originalJourney;
 if(isFixedLegacy()){
  document.querySelector('.legacy-journey h3').textContent=isMultiPay()?`ชำระ ${paymentYears()} ปี คุ้มครองถึงอายุ 99 ปี`:'ชำระครั้งเดียว คุ้มครองถึงอายุ 99 ปี';
  $('paid-age').nextElementSibling.textContent=isMultiPay()?`ชำระเบี้ยปีสุดท้าย (ปีที่ ${paymentYears()-1})`:'ชำระครบครั้งเดียว (ปีที่ 0)';
  document.querySelector('.legacy-journey p').textContent='ประกันชีวิตขั้นต่ำ = ค่าสูงกว่าระหว่างทุนประกัน 100% และ 101% ของเบี้ยสัญญาหลักสะสม (ยังไม่รวมมูลค่าเวนคืน)';
 }
 document.querySelector('.schedule-info p').innerHTML=isFixedLegacy()?'<strong>ความคุ้มครองขั้นต่ำ</strong> = ค่าสูงกว่าระหว่างทุนประกัน 100% และ 101% ของเบี้ยสัญญาหลักสะสม โดยยังไม่รวมการเปรียบเทียบมูลค่าเวนคืน':originalInfo;
 for(const m of ['sum','premium']){$('mode-'+m).classList.toggle('active',m===mode);$('mode-'+m).setAttribute('aria-selected',String(m===mode));}
 render();
}
document.addEventListener('legacy-product-change',changeProduct);
try{
 const response=await fetch('./legacy-rates.json');if(!response.ok)throw Error('โหลดอัตราเบี้ยไม่สำเร็จ');data=await response.json();
 const premierResponse=await fetch('./premier-legacy-rates.json');if(!premierResponse.ok)throw Error('โหลดอัตรา Premier Legacy ไม่สำเร็จ');premierData=await premierResponse.json();
 const wealthResponse=await fetch('./legacy-wealth-rates.json');if(!wealthResponse.ok)throw Error('โหลดอัตรา Legacy Wealth ไม่สำเร็จ');wealthData=await wealthResponse.json();
 const premier5Response=await fetch('./premier-legacy995-rates.json');if(!premier5Response.ok)throw Error('โหลดอัตรา Premier Legacy 99/5 ไม่สำเร็จ');premier5Data=await premier5Response.json();
 const premier10Response=await fetch('./premier-legacy9910-rates.json');if(!premier10Response.ok)throw Error('โหลดอัตรา Premier Legacy 99/10 ไม่สำเร็จ');premier10Data=await premier10Response.json();
 const smartPremierResponse=await fetch('./smart-protection9999-premier-rates.json');if(!smartPremierResponse.ok)throw Error('โหลดอัตรา Smart Protection 99/99 (Premier) ไม่สำเร็จ');smartPremierData=await smartPremierResponse.json();
 for(const display of ['modal','annual'])$('schedule-view-'+display).addEventListener('click',()=>{scheduleDisplay=display;if(result)renderSchedule(result);});
 for(const view of ['selected','all'])$('premium-view-'+view).addEventListener('click',()=>{premiumView=view;if(result)updatePremiumView(result);});
 for(const next of ['sum','premium'])$('mode-'+next).addEventListener('click',()=>{
  if(next===mode)return;const previous=result;mode=next;
  if(previous)$('amount').value=mode==='sum'?previous.sum:previous.premium;
  for(const m of ['sum','premium']){$('mode-'+m).classList.toggle('active',m===mode);$('mode-'+m).setAttribute('aria-selected',String(m===mode));}render();
 });
 for(const el of [$('age'),$('amount')])el.addEventListener('input',render);
 for(const id of ['pa-enabled','pa-plan','pa-infant','premier-infant'])$(id).addEventListener('change',()=>{if(id==='pa-enabled'&&$('pa-enabled').checked)$('pa-plan').value='1';render();});
 $('frequency').addEventListener('change',render);document.querySelectorAll('input[name="gender"]').forEach(el=>el.addEventListener('change',render));
 $('legacy-form').addEventListener('submit',e=>{e.preventDefault();render();});$('excel').addEventListener('click',()=>download('excel'));$('pdf').addEventListener('click',()=>download('pdf'));$('print').addEventListener('click',()=>{render();if(result)window.print();});
 if(['premier991','wealth995','premier995','premier9910','smart9999premier'].includes(new URLSearchParams(location.search).get('plan'))&&$('legacy-product')){$('legacy-product').value=new URLSearchParams(location.search).get('plan');$('legacy-product').dispatchEvent(new Event('change'));}
 render();$('loading').remove();
}catch(e){$('loading').textContent='โหลดไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ';$('error').hidden=false;$('error').textContent=e.message;for(const id of ['excel','pdf','print'])$(id).disabled=true;summary.update();}
