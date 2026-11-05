import {elapsedYearLabel} from './elapsed-year.mjs';
import {scheduleUnit,scheduleViewRow} from './schedule-premium-view.mjs';
import {SENIOR_SUMS,SENIOR_PA_PLANS,seniorDailyOptions,seniorPaymentViews,calculateSenior,seniorSummary,seniorMoney as money,seniorNotes} from './senior-calculator.mjs';
import {createSeniorPDF,createSeniorExcel} from './senior-report.mjs';
const $=id=>document.getElementById(id),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data,dataSets={},result=null,sum=100000,view='selected',scheduleDisplay='annual';
const picker=document.createElement('div');picker.className='field legacy-plan-picker';picker.innerHTML='<label for="legacy-product">เลือกสัญญาหลัก</label><select id="legacy-product" aria-describedby="legacy-product-hint"><optgroup label="แผนมรดกทั่วไป"><option value="9920">สมาร์ท โพรเทคชัน 99/20 (ชำระ 20 ปี)</option></optgroup><optgroup label="ทุนประกัน 10ล้านขึ้นไป"><option value="smart9999premier">Smart Protection 99/99 (Premier)</option><option value="premier991">Premier Legacy 99/1 (มูลค่าเวนคืนคงที่) (ชำระครั้งเดียว)</option><option value="premier995">Premier Legacy 99/5</option><option value="premier9910">Premier Legacy 99/10</option><option value="wealth995">Legacy Wealth 99/5 (มูลค่าเวนคืนคงที่)</option></optgroup><optgroup label="ไม่ตรวจสุขภาพ"><option value="senior">วัยเก๋าคุ้มได้ใจ · สบายใจ 99/10</option><option value="senior90">วัยเก๋าคุ้มสุขใจ · สบายใจ 90/90</option></optgroup></select><small id="legacy-product-hint">ชำระเบี้ย 20 ปี คุ้มครองถึงอายุ 99 ปี · ต้องเลือก PA</small>';
document.querySelector('#legacy-9920-content .mode-tabs').after(picker);
const planner=document.createElement('section');planner.id='senior-planner';planner.hidden=true;
planner.innerHTML=`<div class="workspace">
<aside class="input-panel card"><div class="section-heading"><span class="step">01</span><h2 id="senior-product-title">วัยเก๋าคุ้มได้ใจ</h2></div>
<p id="senior-product-subtitle" class="senior-subtitle">เมืองไทย สบายใจ 99/10 (เพื่อผู้สูงอายุ)<br>ชำระเบี้ยหลัก 10 ปี · คุ้มครองถึงอายุ 99 ปี</p>
<form id="senior-form" novalidate>
<fieldset class="gender-field"><legend>เพศ</legend><div class="gender-options"><label><input type="radio" name="senior-gender" value="male"><span>ชาย</span></label><label><input type="radio" name="senior-gender" value="female" checked><span>หญิง</span></label></div></fieldset>
<div class="field"><label for="senior-age">อายุเริ่มทำประกัน <span>ปี</span></label><input id="senior-age" type="number" min="50" max="80" step="1" value="55" inputmode="numeric"><small id="senior-age-hint">สัญญาหลัก 50–80 ปี · สัญญาเพิ่มเติม 50–75 ปี</small></div>
<div class="field"><label for="senior-frequency">งวดชำระเบี้ย</label><select id="senior-frequency"><option value="annual">รายปี</option><option value="monthly">รายเดือน</option></select><small>ใช้อัตรารายปีหรือรายเดือนตามตารางของแผนนี้</small></div>
<fieldset class="senior-sum-field"><legend>เลือกทุนประกัน (บาท)</legend><div class="senior-sum-buttons" role="group" aria-label="ทุนประกันวัยเก๋าคุ้มได้ใจ">${SENIOR_SUMS.map((s,i)=>`<button type="button" data-senior-sum="${s}" aria-pressed="${i===0}">${s.toLocaleString('th-TH')}</button>`).join('')}</div></fieldset>
<fieldset class="rider-box"><legend>เพิ่มความคุ้มครองอุบัติเหตุ</legend><label class="rider-toggle"><input id="senior-pa" type="checkbox"><span><strong>อุบัติเหตุส่วนบุคคล สบายใจ</strong><small>เพื่อผู้สูงอายุ · เลือกเพิ่มได้ · กลุ่มอาชีพ 1 และ 2</small></span></label><div id="senior-pa-controls" hidden><div class="field"><label for="senior-pa-plan">เลือกแผนอุบัติเหตุ</label><select id="senior-pa-plan"></select><small>ทุนหลัก 500,000 บาท เลือกอุบัติเหตุแผน 4 หรือ 5 ได้</small></div><div id="senior-pa-benefits" class="rider-benefits"></div><small id="senior-pa-limit" class="rider-description" hidden></small></div></fieldset>
<fieldset class="rider-box"><legend>เพิ่มค่าชดเชยรายวัน</legend><label class="rider-toggle"><input id="senior-health" type="checkbox"><span><strong>สุขภาพวงเงินแน่นอน</strong><small>เพื่อผู้สูงอายุ · ผู้ป่วยในและ ICU</small></span></label><div id="senior-health-controls" hidden><fieldset class="senior-daily-field"><legend>ชดเชยต่อวัน (บาท)</legend><div id="senior-daily-buttons" class="senior-sum-buttons" role="group" aria-label="ชดเชยรายวันวัยเก๋า"></div></fieldset><p class="rider-description">ผู้ป่วยในตามวงเงินที่เลือก / ICU 2 เท่า · วันนอนรวมกันสูงสุด 10 วันต่อปีกรมธรรม์ · ปีที่ 1–2 คุ้มครองอุบัติเหตุเท่านั้น · ต่ออายุได้ถึง 89 ปี คุ้มครองถึงอายุ 90 ปีตามเงื่อนไข</p></div></fieldset>
<p id="senior-eligibility" class="senior-subtitle">ไม่ต้องตรวจสุขภาพและไม่ต้องตอบคำถามสุขภาพ<br>ชำระผ่านบัตรเครดิตได้ · อาชีพกลุ่ม 1 และ 2</p>
<div id="senior-error" class="error" role="alert" hidden></div></form></aside>
<section class="results" aria-live="polite"><div class="result-top"><div class="result-heading"><span class="step">02</span><h2>มรดกของคุณ</h2></div><span id="senior-badge" class="plan-badge">99/10</span></div>
<div class="main-result card"><p id="senior-headline-label">เบี้ยสัญญาหลักรายปี</p><div class="headline"><strong id="senior-premium">—</strong><span id="senior-headline-unit">บาท/ปี</span></div><div class="result-divider"></div><div class="complement"><span>ทุนประกัน</span><strong id="senior-sum-value">—</strong></div></div>
<div class="metrics"><article class="metric card"><p id="senior-paid-label">เบี้ยหลักรวม 10 ปี</p><strong id="senior-paid">—</strong><small>บาท · ไม่รวมสัญญาเพิ่มเติม</small></article><article class="metric card"><p id="senior-maturity-label">เงินครบสัญญา อายุ 99 ปี</p><strong id="senior-maturity">—</strong><small>บาท · ตามเงื่อนไขกรมธรรม์</small></article><article id="senior-tax-card" class="metric card"><p>ส่วนเบี้ยชีวิตสำหรับภาษี</p><strong id="senior-tax">—</strong><small>บาท/ปี · ตามเงื่อนไขภาษี</small></article></div>
<section class="rider-cost card"><h3 id="senior-premium-title">เบี้ยรวมปีแรก • ชำระรายปี</h3><div class="premium-view-switch" role="group" aria-label="มุมมองเบี้ยวัยเก๋า"><button id="senior-view-selected" type="button" aria-pressed="true">เฉพาะงวดที่เลือก</button><button id="senior-view-all" type="button" aria-pressed="false">ทุกงวดชำระ</button></div><dl id="senior-cost" class="premium-breakdown"></dl><div id="senior-cost-all" class="premium-payment-table" hidden></div><p>เบี้ยสัญญาเพิ่มเติมปรับตามอายุ แยกจากเบี้ยสะสมของสัญญาหลัก</p></section>
</section></div>
<section class="schedule-section card"><div class="schedule-header"><div><p id="senior-schedule-plan" class="eyebrow">วัยเก๋าคุ้มได้ใจ · 99/10</p><h2 id="senior-schedule-title">เบี้ยและความคุ้มครองรายปี</h2><p id="senior-schedule-description"></p></div><div class="export-actions"><button id="senior-excel" type="button" class="outline-button">ดาวน์โหลด Excel ↓</button><button id="senior-pdf" type="button" class="outline-button">ดาวน์โหลด PDF ↓</button></div></div>
<div class="schedule-premium-switch" role="group" aria-label="มุมมองเบี้ยในตาราง"><button id="senior-schedule-view-modal" type="button" aria-pressed="false">แสดงเบี้ยตามโหมดชำระ</button><button id="senior-schedule-view-annual" type="button" aria-pressed="true">แสดงเบี้ยทั้งปี</button></div>
<p id="senior-table-note" class="legacy-timing">* ผลประโยชน์เสียชีวิตเป็นขั้นต่ำที่คำนวณได้ ยังไม่รวมมูลค่าเวนคืน · เบี้ยสะสมแสดงเฉพาะสัญญาหลัก</p>
<div class="table-scroll" tabindex="0" aria-label="ตารางเบี้ยรายปีวัยเก๋า"><table><thead><tr><th>อายุ</th><th id="senior-main-heading">เบี้ยหลัก<br>(บาท/ปี)</th><th id="senior-riders-heading">เบี้ยสัญญาเพิ่มเติม<br>(บาท/ปี)</th><th id="senior-total-heading">เบี้ยประกันหลักสะสม<br>(บาท)</th><th>กรณีเสียชีวิต<br>(บาท)</th><th>กรณีเสียชีวิตจากอุบัติเหตุ<br>(บาท)</th><th>เงินครบสัญญา<br>(บาท)</th></tr></thead><tbody id="senior-schedule"></tbody></table></div></section>
<section class="card senior-notes"><h3>เงื่อนไขและหมายเหตุ</h3><ul id="senior-notes-list"></ul></section>
<section class="customer-summary card"><div class="customer-summary-heading"><div><p class="eyebrow">พร้อมส่งให้ลูกค้า</p><h2>สรุปความคุ้มครองสำหรับ LINE</h2></div><button id="senior-copy" class="copy-summary-button" type="button">คัดลอกข้อความ</button></div><label class="summary-text-label" for="senior-summary">ข้อความสรุปสำหรับลูกค้า</label><textarea id="senior-summary" rows="16" spellcheck="false"></textarea><div class="customer-summary-bottom"><p id="senior-copy-status" role="status"></p><button id="senior-regenerate" type="button" class="text-button">สร้างข้อความใหม่จากผลคำนวณ</button></div></section>`;
document.querySelector('#legacy-9920-content').before(planner);
for(const id of ['senior-pdf','senior-excel','senior-copy','senior-regenerate'])$(id).disabled=true;
let daily=500,paPlan=1,dirty=false;
const input=()=>({age:$('senior-age').value,gender:document.querySelector('input[name="senior-gender"]:checked')?.value,sum,frequency:$('senior-frequency').value,paEnabled:$('senior-pa').checked,paPlan,dailyEnabled:$('senior-health').checked,daily});
const activeProduct=()=>$('legacy-product').value==='senior90'?'senior90':'senior';
function controls(){
 const happy=activeProduct()==='senior90',name=happy?'วัยเก๋าคุ้มสุขใจ':'วัยเก๋าคุ้มได้ใจ',ageMax=happy?75:80;
 $('senior-product-title').textContent=name;document.querySelector('.senior-sum-buttons[aria-label]').setAttribute('aria-label','ทุนประกัน'+name);
 $('senior-product-subtitle').innerHTML=happy?'เมืองไทย สบายใจ 90/90 (เพื่อผู้สูงอายุ)<br>ชำระเบี้ยหลักและคุ้มครองถึงอายุ 90 ปี':'เมืองไทย สบายใจ 99/10 (เพื่อผู้สูงอายุ)<br>ชำระเบี้ยหลัก 10 ปี · คุ้มครองถึงอายุ 99 ปี';
 $('senior-age').max=String(ageMax);$('senior-age-hint').textContent=`สัญญาหลัก 50–${ageMax} ปี · สัญญาเพิ่มเติม 50–75 ปี`;
 $('senior-badge').textContent=happy?'90/90':'99/10';$('senior-schedule-plan').textContent=name+' · '+(happy?'90/90':'99/10');
 $('senior-paid-label').textContent=happy?'เบี้ยหลักรวมถึงอายุ 90 ปี':'เบี้ยหลักรวม 10 ปี';$('senior-maturity-label').textContent='เงินครบสัญญา อายุ '+(happy?'90':'99')+' ปี';
 $('senior-tax-card').hidden=happy;$('senior-eligibility').hidden=happy;
 $('senior-table-note').textContent=happy?'ตารางรวมเบี้ยทุกงวดในแต่ละปี ผลประโยชน์เป็นไปตามเงื่อนไขสัญญาหลักและสัญญาเพิ่มเติมที่เลือก':'* ผลประโยชน์เสียชีวิตเป็นขั้นต่ำที่คำนวณได้ ยังไม่รวมมูลค่าเวนคืน';
 const notes=seniorNotes({product:activeProduct(),health:{}});$('senior-notes-list').innerHTML=notes.map((n,i)=>`<li${i===notes.length-1?' id="senior-health-note" hidden':''}>${esc(n).replaceAll('\n','<br>')}</li>`).join('');
 $('senior-pa-limit').hidden=!happy;$('senior-pa-limit').textContent='ชดเชยผู้ป่วยในและ ICU รวมสูงสุด 365 วันต่ออุบัติเหตุ โดย ICU สูงสุด 7 วันต่ออุบัติเหตุ';
 document.querySelectorAll('[data-senior-sum]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.seniorSum)===sum)));
 const plans=SENIOR_PA_PLANS.filter(p=>p.baseSum===sum);if(!plans.some(p=>p.id===paPlan))paPlan=plans[0].id;
 $('senior-pa-plan').innerHTML=plans.map(p=>`<option value="${p.id}" ${p.id===paPlan?'selected':''}>แผน ${p.id} · อุบัติเหตุทั่วไป ${p.accident.toLocaleString('th-TH')} บาท</option>`).join('');
 $('senior-pa-controls').hidden=!$('senior-pa').checked;
 const p=plans.find(p=>p.id===paPlan);
 $('senior-pa-benefits').innerHTML='<dl>'+[['อุบัติเหตุทั่วไป',p.accident],['รถจักรยานยนต์',p.motorcycle],['ฆาตกรรมหรือทำร้ายร่างกาย',p.assault],['อุบัติเหตุสาธารณะ',p.publicAccident],['ค่ารักษาต่ออุบัติเหตุ',p.medical],['ชดเชยผู้ป่วยใน (บาท/วัน)',p.daily],['ชดเชย ICU (บาท/วัน)',p.icu]].map(([n,v])=>`<div><dt>${n}</dt><dd>${money(v)} บาท</dd></div>`).join('')+'</dl>';
 const options=seniorDailyOptions(sum,activeProduct());if(!options.includes(daily))daily=500;
 $('senior-health-controls').hidden=!$('senior-health').checked;$('senior-health-note').hidden=!$('senior-health').checked;
 $('senior-daily-buttons').innerHTML=options.map(n=>`<button type="button" data-senior-daily="${n}" aria-pressed="${n===daily}">${n.toLocaleString('th-TH')}</button>`).join('');
}
function costs(r){
 const rows=[['main','เบี้ยสัญญาหลัก',r.premium],...(r.pa?[['pa',`อุบัติเหตุสบายใจ · แผน ${r.pa.id}`,r.pa.premium]]:[]),...(r.health?[['health',`ชดเชยรายวัน · ${money(r.health.daily)} บาท/วัน`,r.health.premium]]:[]),['total','เบี้ยหลักและสัญญาเพิ่มเติมรวมปีแรก',r.combinedPremium]];
 const all=view==='all';$('senior-cost').hidden=all;$('senior-cost-all').hidden=!all;
 for(const v of ['selected','all'])$('senior-view-'+v).setAttribute('aria-pressed',String(v===view));
 $('senior-premium-title').textContent=all?'เบี้ยรวมปีแรก • ทุกงวดชำระ':'เบี้ยรวมปีแรก • ชำระ'+r.frequencyLabel;
 $('senior-cost').innerHTML=rows.map(([key,n,v],i)=>`<div class="${i===rows.length-1?'rider-cost-total':''}"><dt>${esc(n)}</dt><dd>${money(v)} บาท/${r.unit}</dd></div>`).join('');
 const views=seniorPaymentViews(data,input());
 $('senior-cost-all').innerHTML='<table><caption>เบี้ยปีแรกสำหรับทุนและสัญญาเพิ่มเติมเดียวกัน (บาท/โหมดชำระ)</caption><thead><tr><th>รายการ</th><th>รายปี</th><th>รายเดือน</th></tr></thead><tbody>'+rows.map(([key,n])=>`<tr><th scope="row">${esc(n)}</th>${views.map(v=>`<td>${v[key]===null?'ยังไม่มีอัตรา':money(v[key])}</td>`).join('')}</tr>`).join('')+'</tbody></table>';
}
function renderSeniorSchedule(r){
 const unit=scheduleUnit(r,scheduleDisplay),modal=scheduleDisplay==='modal';
 $('senior-schedule-title').textContent=modal?'เบี้ยและความคุ้มครองตามโหมดชำระ':'เบี้ยและความคุ้มครองรายปี';
 for(const display of ['modal','annual'])$('senior-schedule-view-'+display).setAttribute('aria-pressed',String(display===scheduleDisplay));
 for(const [id,label] of [['senior-main-heading','เบี้ยหลัก'],['senior-riders-heading','เบี้ยสัญญาเพิ่มเติม']])$(id).innerHTML=label+'<br>(บาท/'+unit+')';
 $('senior-total-heading').innerHTML='เบี้ยประกันหลักสะสม<br>(บาท)';
 $('senior-table-note').textContent=(r.product==='senior90'?'ผลประโยชน์ตามสัญญาหลักและสัญญาเพิ่มเติมที่เลือก':'* ผลประโยชน์เสียชีวิตเป็นขั้นต่ำที่คำนวณได้ ยังไม่รวมมูลค่าเวนคืน')+' · ตารางเบี้ย'+(modal?'ต่องวดตามโหมดชำระที่เลือก':'รวมทุกงวดต่อปี')+' · เบี้ยประกันหลักสะสมรวมทุกงวดตั้งแต่ปีแรกถึงปีนั้น ไม่รวมสัญญาเพิ่มเติม (บาท)';
  $('senior-schedule-description').textContent=`${r.gender==='male'?'ชาย':'หญิง'} อายุเริ่ม ${r.age} ปี · ทุน ${money(r.sum)} บาท · ชำระ${r.frequencyLabel} · ${scheduleDisplay==='modal'?'ตารางเบี้ยต่องวดตามโหมดชำระ':'ตารางรวมทุกงวดในแต่ละปี'}`;
  $('senior-schedule').innerHTML=r.schedule.map(original=>{const x=scheduleViewRow(r,original,scheduleDisplay);return `<tr class="${[1,r.payYears].includes(x.policyYear)||x.age===r.maturityAge?'milestone':''}"><td>${x.age}<small class="phase">${elapsedYearLabel(r,x)}${x.age===r.maturityAge?' · ครบสัญญา':''}</small></td>${[x.pay,Math.round((x.paPay+x.dailyPay)*100)/100,original.paid,x.illness,x.combinedAccident,x.maturity].map(n=>`<td>${n?money(n):'—'}</td>`).join('')}</tr>`;}).join('');
}
function render(){
 controls();if(!data)return;
 try{
  const r=calculateSenior(data,input());result=r;$('senior-error').hidden=true;
  $('senior-headline-label').textContent='เบี้ยสัญญาหลัก'+r.frequencyLabel;$('senior-headline-unit').textContent='บาท/'+r.unit;$('senior-premium').textContent=money(r.premium);$('senior-sum-value').textContent=money(r.sum)+' บาท';$('senior-paid').textContent=money(r.totalPaid);$('senior-maturity').textContent=money(r.maturity);$('senior-tax').textContent=r.taxLife===null?'—':money(r.taxLife);
  costs(r);
  renderSeniorSchedule(r);
  if(!dirty)$('senior-summary').value=seniorSummary(r);
  for(const id of ['senior-pdf','senior-excel','senior-copy','senior-regenerate'])$(id).disabled=false;
  if(['senior','senior90'].includes($('legacy-product').value))$('print').disabled=false;
 }catch(e){
  result=null;$('senior-error').hidden=false;$('senior-error').textContent=e.message;
  for(const id of ['senior-premium','senior-sum-value','senior-paid','senior-maturity','senior-tax'])$(id).textContent='—';
  for(const id of ['senior-cost','senior-cost-all','senior-schedule'])$(id).replaceChildren();
  $('senior-schedule-description').textContent='กรุณาตรวจข้อมูลเพื่อคำนวณใหม่';if(!dirty)$('senior-summary').value='';
  for(const id of ['senior-pdf','senior-excel','senior-copy','senior-regenerate'])$(id).disabled=true;
  if(['senior','senior90'].includes($('legacy-product').value))$('print').disabled=true;
 }
}
const oldIntro=document.querySelector('.intro-text').innerHTML,oldStamp=document.querySelector('.intro-stamp strong').textContent;
$('legacy-product').addEventListener('change',()=>{
 const premier=$('legacy-product').value==='premier991',wealth=$('legacy-product').value==='wealth995',premier5=$('legacy-product').value==='premier995',premier10=$('legacy-product').value==='premier9910',smartPremier=$('legacy-product').value==='smart9999premier',senior=['senior','senior90'].includes($('legacy-product').value),happy=activeProduct()==='senior90';data=dataSets[activeProduct()];dirty=false;planner.hidden=!senior;$('legacy-9920-content').hidden=senior;document.body.classList.toggle('senior-active',senior);
 if(senior)$('senior-form').before(picker);else document.querySelector('#legacy-9920-content .mode-tabs').after(picker);
 $('legacy-product-hint').textContent=smartPremier?'ทุนประกันขั้นต่ำ 10,000,000 บาท · ชำระเบี้ยและคุ้มครองถึงอายุ 99 ปี':premier?'ทุนประกันขั้นต่ำ 10,000,000 บาท · เบี้ยรายปี ชำระครั้งเดียว':premier10?'ทุนประกันขั้นต่ำ 10,000,000 บาท · ชำระเบี้ย 10 ปี':wealth||premier5?'ทุนประกันขั้นต่ำ 10,000,000 บาท · ชำระเบี้ย 5 ปี':senior?(happy?'เพื่อผู้สูงอายุ 50–75 ปี · ชำระเบี้ยและคุ้มครองถึงอายุ 90 ปี':'เพื่อผู้สูงอายุ 50–80 ปี · ชำระเบี้ยหลัก 10 ปี คุ้มครองถึงอายุ 99 ปี'):'ชำระเบี้ย 20 ปี คุ้มครองถึงอายุ 99 ปี · ต้องเลือก PA';
 document.querySelector('.intro-text').innerHTML=smartPremier?'เมืองไทย สมาร์ท โพรเทคชั่น 99/99 (Premier)<br>ชำระเบี้ยและคุ้มครองถึงอายุ 99 ปี':premier?'เมืองไทย พรีเมียร์ เลกาซี่ 99/1 (มูลค่าเวนคืนคงที่)<br>ชำระเบี้ยครั้งเดียว คุ้มครองถึงอายุ 99 ปี':premier10?'เมืองไทย พรีเมียร์ เลกาซี่ 99/10<br>ชำระเบี้ย 10 ปี คุ้มครองถึงอายุ 99 ปี · Standard Class':premier5?'เมืองไทย พรีเมียร์ เลกาซี่ 99/5<br>ชำระเบี้ย 5 ปี คุ้มครองถึงอายุ 99 ปี · Standard Class':wealth?'เมืองไทย เลกาซี่ เวลธ์ 99/5 (มูลค่าเวนคืนคงที่)<br>ชำระเบี้ย 5 ปี คุ้มครองถึงอายุ 99 ปี':senior?(happy?'วัยเก๋าคุ้มสุขใจ · เมืองไทย สบายใจ 90/90 (เพื่อผู้สูงอายุ)<br>เลือกทุนประกันและความคุ้มครองที่เหมาะกับคุณ':'วัยเก๋าคุ้มได้ใจ · เมืองไทย สบายใจ 99/10 (เพื่อผู้สูงอายุ)<br>เลือกทุนประกันและความคุ้มครองที่เหมาะกับคุณ'):oldIntro;
 document.querySelector('.intro-stamp strong').textContent=smartPremier?'ชำระเบี้ยถึงอายุ 99 ปี':premier?'ชำระเบี้ยครั้งเดียว':premier10?'ชำระเบี้ย 10 ปี':wealth||premier5?'ชำระเบี้ย 5 ปี':senior?(happy?'ชำระเบี้ยถึงอายุ 90 ปี':'ชำระเบี้ย 10 ปี'):oldStamp;
 document.querySelector('.intro-stamp>span').textContent=senior&&happy?'90':'99';
 document.dispatchEvent(new Event('legacy-product-change'));
 if(senior)render();else $('age').dispatchEvent(new Event('input',{bubbles:true}));
});
$('senior-form').addEventListener('submit',e=>{e.preventDefault();render();});
$('senior-form').addEventListener('click',e=>{
 const s=e.target.closest('[data-senior-sum]'),d=e.target.closest('[data-senior-daily]');
 if(s){sum=Number(s.dataset.seniorSum);render();}if(d){daily=Number(d.dataset.seniorDaily);render();}
});
$('senior-age').addEventListener('input',render);
for(const id of ['senior-frequency','senior-pa','senior-health'])$(id).addEventListener('change',render);
$('senior-pa-plan').addEventListener('change',()=>{paPlan=Number($('senior-pa-plan').value);render();});
document.querySelectorAll('input[name="senior-gender"]').forEach(el=>el.addEventListener('change',render));
for(const display of ['modal','annual'])$('senior-schedule-view-'+display).addEventListener('click',()=>{scheduleDisplay=display;if(result)renderSeniorSchedule(result);});
for(const v of ['selected','all'])$('senior-view-'+v).addEventListener('click',()=>{view=v;if(result)costs(result);});
$('senior-summary').addEventListener('input',()=>{dirty=true;$('senior-copy-status').textContent='แก้ไขข้อความแล้ว ผลคำนวณยังอัปเดตตามข้อมูลที่เลือก';});
$('senior-regenerate').addEventListener('click',()=>{dirty=false;render();$('senior-copy-status').textContent='สร้างข้อความใหม่แล้ว';});
$('senior-copy').addEventListener('click',async()=>{if(!result)return;try{await navigator.clipboard.writeText($('senior-summary').value);$('senior-copy-status').textContent='คัดลอกแล้ว';}catch{$('senior-summary').focus();$('senior-summary').select();$('senior-copy-status').textContent='กรุณาคัดลอกข้อความที่เลือกด้วยตนเอง';}});
$('print').addEventListener('click',e=>{if(!['senior','senior90'].includes($('legacy-product').value))return;e.stopImmediatePropagation();render();if(result)window.print();},true);
for(const kind of ['pdf','excel'])$('senior-'+kind).addEventListener('click',async()=>{
 render();if(!result)return;const r=result,button=$('senior-'+kind),label=button.textContent;button.disabled=true;button.textContent='กำลังสร้างไฟล์…';
 try{const blob=await(kind==='pdf'?createSeniorPDF({...r,schedulePremiumDisplay:scheduleDisplay,legacyCumulativeMain:true}):createSeniorExcel({...r,legacyCumulativeMain:true})),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`TYINSURE_Senior_${r.product==='senior90'?'90-90':'99-10'}_age${r.age}.${kind==='pdf'?'pdf':'xlsx'}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 catch(e){$('senior-error').hidden=false;$('senior-error').textContent='ดาวน์โหลดไม่สำเร็จ: '+e.message;}
 finally{button.textContent=label;button.disabled=!result;}
});
if(['senior','senior90'].includes(new URLSearchParams(location.search).get('plan'))){$('legacy-product').value=new URLSearchParams(location.search).get('plan');$('legacy-product').dispatchEvent(new Event('change'));}
try{const entries=await Promise.all(['senior','senior90'].map(async key=>{const response=await fetch(key==='senior'?'./senior-rates.json':'./senior90-rates.json');if(!response.ok)throw Error('โหลดอัตราไม่สำเร็จ');return [key,await response.json()];}));dataSets=Object.fromEntries(entries);data=dataSets[activeProduct()];render();}
catch(e){$('senior-error').hidden=false;$('senior-error').textContent='โหลดอัตราวัยเก๋าไม่สำเร็จ กรุณารีเฟรชหน้าเว็บ';for(const id of ['senior-pdf','senior-excel','senior-copy','senior-regenerate'])$(id).disabled=true;}
