import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const html=await fs.readFile('dist/health.html','utf8'),data=JSON.parse(await fs.readFile('dist/health-rates.json'));
const nodes={};for(const [,id] of html.matchAll(/id="([^"]+)"/g))nodes[id]={value:'',checked:false,disabled:false,hidden:false,textContent:'',innerHTML:'',events:{},classList:{toggle(){},remove(){},add(){}},addEventListener(t,fn){this.events[t]=fn;},replaceChildren(){this.innerHTML='';},remove(){},options:[],setAttribute(){}};
nodes.age.value='35';nodes.amount.value='1000000';nodes.frequency.value='annual';nodes['pa-plan'].value='1';nodes['pa-plan'].options=Array.from({length:7},(_,i)=>({value:String(i+1)}));
const radio={value:'male',addEventListener(){}};
const healthData=JSON.parse(await fs.readFile('dist/health-premiums.json'));
nodes['health-product'].value='';nodes['health-benefit'].value='5000000';nodes['health-type'].value='none';nodes['health-option'].value='ded0';nodes['health-plan'].value='1';nodes['health-area'].value='0';
const oldDocument=globalThis.document,oldFetch=globalThis.fetch;
globalThis.document={getElementById:id=>nodes[id],querySelector:()=>radio,querySelectorAll:()=>[radio],body:{classList:{toggle(){}}}};
globalThis.fetch=async url=>({ok:true,json:async()=>String(url).includes('health-premiums')?healthData:data});
try{
 await import('./dist/health.mjs?health-ui-test');
 assert.equal(nodes['pa-premium-heading'].hidden,true);assert.ok(!nodes['customer-summary-text'].value.includes('PA Easy'));assert.equal(nodes.pdf.disabled,true);assert.ok(nodes.error.textContent.includes('อย่างน้อย 1 แผน'));
 nodes['pa-enabled'].checked=true;nodes['pa-enabled'].events.change();assert.equal(nodes['pa-plan'].value,'2');assert.ok(nodes['pa-annual'].textContent.includes('2,000'));nodes['pa-plan'].value='1';nodes['pa-plan'].events.change();assert.equal(nodes.pdf.disabled,false);assert.ok(nodes['customer-summary-text'].value.includes('กลุ่มอาชีพ 1'));
 assert.equal(nodes.pdf.disabled,false);assert.equal(nodes['pa-premium-heading'].hidden,false);assert.ok(nodes['schedule-body'].innerHTML.includes('rider-premium-value'));assert.ok(nodes['pa-annual'].textContent.includes('1,300'));assert.ok(nodes['customer-summary-text'].value.includes('PA Easy Plan Rider แผน 1'));
 nodes.frequency.value='monthly';nodes.frequency.events.change();assert.ok(nodes['pa-annual'].textContent.includes('114.40'));assert.ok(nodes['pa-annual'].textContent.includes('บาท/เดือน'));assert.ok(nodes['customer-summary-text'].value.includes('114.40 บาท/งวด'));assert.ok(nodes['schedule-body'].innerHTML.includes('1,372.80'));
 nodes['pa-plan'].value='7';nodes.age.value='61';nodes.age.events.input();assert.equal(nodes.pdf.disabled,true);assert.ok(nodes.error.textContent.includes('ไม่มีอัตรา'));
 nodes['pa-enabled'].checked=false;nodes['pa-enabled'].events.change();assert.equal(nodes.pdf.disabled,true);assert.equal(nodes['pa-premium-heading'].hidden,true);assert.equal(nodes['pa-cost'].hidden,true);assert.ok(!nodes['schedule-body'].innerHTML.includes('rider-premium-value'));assert.ok(!nodes['customer-summary-text'].value.includes('PA Easy'));
 nodes['care-benefit'].value='1000000';nodes['care-condition'].value='both';nodes['care-enabled'].checked=true;
 nodes.age.value='35';nodes['health-product'].value='dhealth';nodes['health-product'].events.change();assert.ok(nodes['health-premium'].textContent.includes('1,504'));assert.equal(nodes['health-cost'].hidden,false);assert.equal(nodes['health-premium-heading'].hidden,false);assert.ok(nodes['customer-summary-text'].value.includes('D Health Lite'));
 nodes['health-product'].value='elite';nodes['health-plan'].value='4';nodes['health-area'].value='3';nodes['health-product'].events.change();assert.equal(nodes['health-plan'].value,'1');assert.equal(nodes['health-area'].value,'0');nodes['health-plan'].value='4';nodes['health-area'].value='3';nodes['health-plan'].events.change();assert.equal(nodes['dhealth-controls'].hidden,true);assert.equal(nodes['elite-controls'].hidden,false);assert.ok(nodes['customer-summary-text'].value.includes('ทั่วโลก'));
 nodes['health-product'].value='';nodes['health-product'].events.change();assert.equal(nodes['health-cost'].hidden,true);assert.equal(nodes['health-premium-heading'].hidden,true);
 nodes['care-benefit'].value='1000000';nodes['care-condition'].value='both';nodes['care-enabled'].checked=true;nodes['care-enabled'].events.change();assert.equal(nodes['care-benefit'].value,'5000000');assert.equal(nodes['care-controls'].hidden,false);assert.equal(nodes['health-controls'].hidden,true);assert.equal(nodes['care-premium-heading'].hidden,false);assert.ok(nodes['customer-summary-text'].value.includes('Care Plus'));
 nodes['health-product'].value='dhealth';nodes['health-product'].events.change();assert.equal(nodes['care-controls'].hidden,false);assert.equal(nodes['health-controls'].hidden,false);assert.ok(nodes['customer-summary-text'].value.includes('D Health Lite'));assert.ok(nodes['customer-summary-text'].value.includes('Care Plus'));
 nodes['care-enabled'].checked=false;nodes['care-enabled'].events.change();assert.equal(nodes['care-controls'].hidden,true);assert.equal(nodes['care-premium-heading'].hidden,true);assert.equal(nodes['health-controls'].hidden,false);assert.ok(!nodes['customer-summary-text'].value.includes('Care Plus'));
 // Verify every optional-column combination against the calculator, including the PA age boundary.
 const {calculateLegacy}=await import('./dist/health-calculator.mjs');
 const {addHealthRider}=await import('./dist/health-rider.mjs');
 assert.ok(html.indexOf('id="health-premium-heading"')<html.indexOf('id="care-premium-heading"'));
 assert.ok(html.indexOf('id="care-premium-heading"')<html.indexOf('id="pa-premium-heading"'));
 assert.ok(html.includes('id="pa-premium-heading" hidden>เบี้ยPA'));
 nodes.age.value='35';nodes['pa-plan'].value='1';nodes['care-benefit'].value='1000000';nodes['care-condition'].value='both';
 for(const frequency of ['annual','monthly'])for(const health of [false,true])for(const care of [false,true])for(const pa of [false,true]){
  nodes.frequency.value=frequency;nodes['health-product'].value=health?'dhealth':'';nodes['care-enabled'].checked=care;nodes['pa-enabled'].checked=pa;
  nodes['pa-plan'].events.change();
  if(!pa&&!care){assert.equal(nodes.pdf.disabled,true);assert.ok(nodes.error.textContent.includes('อย่างน้อย 1 แผน'));assert.equal(nodes['schedule-body'].innerHTML,'');continue;}
  const input={age:35,gender:'male',amount:1000000,mode:'sum',frequency,healthProduct:health?'dhealth':'',healthBenefit:'5000000',healthType:'none',healthOption:'ded0',careEnabled:care,careBenefit:'1000000',careCondition:'both',paEnabled:pa,paPlan:1};
  const result=addHealthRider(calculateLegacy(data,input),healthData,input);
  const rows=[...nodes['schedule-body'].innerHTML.matchAll(/<tr[^>]*>(.*?)<\/tr>/g)].map(m=>m[1]);
  for(const age of [35,55,85,86,98,99]){
   const row=result.schedule.find(r=>r.age===age);
   const actual=[...rows[age-35].matchAll(/<td[^>]*>(.*?)<\/td>/g)].slice(1).map(m=>Number(m[1].replaceAll(',','').replace('—','0')));
   const expected=[row.pay,...(health?[row.healthPremium]:[]),...(care?[row.carePremium]:[]),...(pa?[row.riderPremium]:[]),row.totalPremium,row.coverage,row.maturity];
   assert.deepEqual(actual,expected,`${frequency}, health=${health}, care=${care}, PA=${pa}, age=${age}`);
  }
 }
 console.log('PASS: health → Care Plus → PA headers and numeric values for all 16 selection/payment combinations at six ages');
 nodes['pa-enabled'].checked=false;nodes['care-enabled'].checked=false;nodes['health-product'].value='';nodes.frequency.value='annual';nodes.age.value='35';
 nodes['main-plan'].value='smart9999-small';nodes['main-plan'].events.change();assert.equal(nodes.pdf.disabled,true);assert.ok(nodes.error.textContent.includes('ต้องเลือกแผน PA'));nodes['pa-enabled'].checked=true;nodes['pa-enabled'].events.change();
 assert.equal(nodes.amount.value,'100000');assert.equal(nodes['headline-value'].textContent,'2,166.00');assert.ok(nodes['pay-note'].textContent.includes('64 ปี'));assert.equal(nodes['maturity-value'].textContent,'140,010.24');
 nodes['main-plan'].value='smart9999-large';nodes['main-plan'].events.change();assert.equal(nodes.amount.value,'200000');assert.equal(nodes['headline-value'].textContent,'4,332.00');
 nodes.amount.value='1000000';nodes.amount.events.input();assert.equal(nodes['headline-value'].textContent,'17,330.00');assert.ok(nodes['customer-summary-text'].value.includes('101%'));
 nodes['pa-enabled'].checked=false;nodes['main-plan'].value='smart9920';nodes['main-plan'].events.change();assert.equal(nodes.pdf.disabled,true);nodes['pa-enabled'].checked=true;nodes['pa-enabled'].events.change();assert.equal(nodes['headline-value'].textContent,'25,980.00');assert.ok(nodes['pay-note'].textContent.includes('20 ปี'));
 console.log('PASS: 99/99 plan selection, small/large sum bounds, tier selection, 64-year payments, 101% maturity and switching back to 99/20');
 nodes.amount.value='199999.99';nodes.amount.events.input();
 assert.equal(nodes.error.hidden,false);assert.ok(nodes.error.textContent.includes('ทุนประกันขั้นต่ำ 200,000'));
 for(const id of ['excel','pdf','print'])assert.equal(nodes[id].disabled,true);
 assert.equal(nodes['schedule-body'].innerHTML,'');
 nodes.amount.value='200000';nodes.amount.events.input();assert.equal(nodes.error.hidden,true);assert.equal(nodes.excel.disabled,false);
 assert.ok(html.includes('สมาร์ท โพรเทคชั่น 99/20 (ชำระ 20 ปี)'));
 console.log('PASS: 99/20 minimum-sum alert, cleared results, disabled exports below 200,000 and valid boundary');
 // A health rider by itself never meets 99/20's required rider condition.
 nodes['pa-enabled'].checked=false;nodes['care-enabled'].checked=false;
 for(const product of ['', 'dhealth','elite']){
  nodes['health-product'].value=product;nodes['health-product'].events.change();
  assert.equal(nodes.pdf.disabled,true);assert.ok(nodes.error.textContent.includes('อย่างน้อย 1 แผน'));
 }
 nodes['care-enabled'].checked=true;nodes['care-enabled'].events.change();assert.equal(nodes.pdf.disabled,false);
 nodes['care-enabled'].checked=false;nodes['care-enabled'].events.change();assert.equal(nodes.pdf.disabled,true);
 nodes['pa-enabled'].checked=true;nodes['pa-enabled'].events.change();assert.equal(nodes.pdf.disabled,false);
 console.log('PASS: 99/20 requires PA or Care Plus, health alone rejected, clearing/reselecting riders updates warning and exports; 99/99 exempt');
 nodes['main-plan'].value='smart9999-small';nodes['main-plan'].events.change();
 nodes['pa-enabled'].checked=false;nodes['care-enabled'].checked=true;nodes['care-enabled'].events.change();
 assert.equal(nodes.pdf.disabled,true);assert.ok(nodes.error.textContent.includes('ต้องเลือกแผน PA'));
 assert.equal(nodes['schedule-body'].innerHTML,'');assert.equal(nodes.excel.disabled,true);assert.equal(nodes.print.disabled,true);
 nodes['pa-enabled'].checked=true;nodes['pa-enabled'].events.change();assert.equal(nodes.pdf.disabled,false);
 nodes['pa-enabled'].checked=false;nodes['pa-enabled'].events.change();assert.equal(nodes.pdf.disabled,true);
 nodes['main-plan'].value='smart9999-large';nodes['main-plan'].events.change();
 nodes['care-enabled'].checked=false;nodes['health-product'].value='';nodes['care-enabled'].events.change();assert.equal(nodes.pdf.disabled,false);
 console.log('PASS: small 99/99 requires PA; Care Plus/health cannot substitute; removing PA blocks exports; large 99/99 exempt');
 nodes['pa-enabled'].checked=false;nodes['care-enabled'].checked=false;nodes['health-product'].value='';nodes.frequency.value='annual';nodes.age.value='35';
 nodes['main-plan'].value='wholelife50000';nodes['main-plan'].events.change();
 assert.equal(nodes.amount.value,'50000');assert.equal(nodes.amount.disabled,true);assert.equal(nodes['mode-premium'].disabled,true);
 assert.equal(nodes.error.textContent,'เบี้ยสัญญาเพิ่มเติมไม่ครบ 5,000บาท กรุณาเพิ่มให้ครบ');assert.equal(nodes.pdf.disabled,true);
 nodes['pa-enabled'].checked=true;nodes['pa-plan'].value='1';nodes['pa-plan'].events.change();assert.equal(nodes.pdf.disabled,true);
 nodes['pa-plan'].value='4';nodes['pa-plan'].events.change();assert.equal(nodes.pdf.disabled,false);assert.equal(nodes['headline-value'].textContent,'765.50');
 assert.equal(nodes['maturity-value'].textContent,'50,000.00');assert.ok(nodes['pay-note'].textContent.includes('64 ปี'));
 nodes['pa-enabled'].checked=false;nodes['pa-enabled'].events.change();assert.equal(nodes.pdf.disabled,true);
 nodes['main-plan'].value='smart9920';nodes['main-plan'].events.change();assert.equal(nodes.amount.disabled,false);assert.equal(nodes['mode-premium'].disabled,false);assert.equal(nodes.amount.value,'200000');
 console.log('PASS: fixed 50,000 input/mode lock, required 5,000 annual rider threshold and unlocking when switching plans');
 nodes['main-plan'].value='smart9999-large';nodes['main-plan'].events.change();nodes['health-product'].value='';
 nodes['care-enabled'].checked=true;nodes['care-enabled'].events.change();assert.equal(nodes['care-benefit'].value,'5000000');
 nodes['care-benefit'].value='1000000';nodes['care-benefit'].events.change();nodes.frequency.events.change();assert.equal(nodes['care-benefit'].value,'1000000');
 nodes['care-enabled'].checked=false;nodes['care-enabled'].events.change();nodes['care-enabled'].checked=true;nodes['care-enabled'].events.change();assert.equal(nodes['care-benefit'].value,'5000000');
 nodes['pa-enabled'].checked=true;nodes['pa-enabled'].events.change();assert.equal(nodes['pa-plan'].value,'2');
 nodes['pa-plan'].value='3';nodes['pa-plan'].events.change();nodes.frequency.events.change();assert.equal(nodes['pa-plan'].value,'3');
 nodes['pa-enabled'].checked=false;nodes['pa-enabled'].events.change();nodes['pa-enabled'].checked=true;nodes['pa-enabled'].events.change();assert.equal(nodes['pa-plan'].value,'2');
 console.log('PASS: Care Plus defaults to 5M and PA to plan 2 whenever enabled; explicit choices survive other input changes');
 nodes['health-product'].value='elite';nodes['health-product'].events.change();assert.equal(nodes['health-plan'].value,'1');assert.equal(nodes['health-area'].value,'0');
 nodes['health-plan'].value='4';nodes['health-area'].value='3';nodes['health-area'].events.change();nodes.frequency.events.change();assert.equal(nodes['health-plan'].value,'4');assert.equal(nodes['health-area'].value,'3');
 nodes['health-product'].value='dhealth';nodes['health-product'].events.change();nodes['health-product'].value='elite';nodes['health-product'].events.change();assert.equal(nodes['health-plan'].value,'1');assert.equal(nodes['health-area'].value,'0');
 assert.ok(nodes['health-selection'].textContent.includes('แผน 1 · เฉพาะประเทศไทย'));
 console.log('PASS: Elite defaults to plan 1 / Thailand when selected and custom options persist during other input changes');
 nodes['health-product'].value='dhealth';nodes['health-product'].events.change();
 assert.equal(nodes['health-type'].value,'none');assert.equal(nodes['health-option-field'].hidden,false);assert.equal(nodes['health-option'].disabled,false);assert.equal(nodes['health-option'].value,'ded0');
 assert.ok(nodes['health-selection'].textContent.includes('ไม่มีความรับผิดชอบส่วนแรกและส่วนร่วมจ่าย'));
 const fullPremium=nodes['health-premium'].textContent;
 const {healthQuote,healthOptions}=await import('./dist/health-rider.mjs');
 for(const benefit of ['1000000','5000000']){
  nodes['health-benefit'].value=benefit;nodes['health-benefit'].events.change();
  for(const type of ['none','deductible','copay'])for(const option of healthOptions(benefit,type)){
   assert.ok(nodes['health-option'].innerHTML.includes('value="'+option.id+'"'));
   nodes['health-option'].value=option.id;nodes['health-option'].events.change();assert.equal(nodes['health-type'].value,type);assert.equal(nodes.pdf.disabled,false);
   const expected=healthQuote(healthData,{healthProduct:'dhealth',healthBenefit:benefit,healthType:type,healthOption:option.id,age:35,gender:'male',frequency:nodes.frequency.value});
   assert.ok(nodes['health-premium'].textContent.includes(expected.premium.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2})));
   const before=nodes['health-premium'].textContent,table=nodes['schedule-body'].innerHTML;
   assert.equal(nodes['convertible-use'].disabled,type!=='deductible');assert.equal(nodes['convertible-option-field'].hidden,type!=='deductible');
   nodes['convertible-use'].events.click();assert.equal(nodes['health-premium'].textContent,before);
   if(type==='deductible'){assert.notEqual(nodes['schedule-body'].innerHTML,table);assert.equal(nodes['convertible-controls'].hidden,false);assert.ok(nodes['customer-summary-text'].value.includes('Convertible Option'));}else assert.equal(nodes['schedule-body'].innerHTML,table);
   nodes.frequency.events.change();assert.equal(nodes['health-option'].value,option.id);
   nodes['convertible-no'].events.click();assert.equal(nodes['health-premium'].textContent,before);assert.equal(nodes['schedule-body'].innerHTML,table);
  }
 }
 nodes['health-option'].value='ded100000';nodes['health-option'].events.change();nodes['health-benefit'].value='1000000';nodes['health-benefit'].events.change();assert.equal(nodes['health-option'].value,'ded0');assert.equal(nodes['health-type'].value,'none');assert.ok(!nodes['health-option'].innerHTML.includes('ded100000'));
 nodes['health-benefit'].value='5000000';nodes['health-benefit'].events.change();nodes['health-option'].value='ded0';nodes['health-option'].events.change();assert.equal(nodes['health-premium'].textContent,fullPremium);
 console.log('PASS: unified Deduct / Copay covers both limits, Convertible only enables deductibles, preserves first premium, adjusts future rows, and disabling restores original schedule');
 nodes.age.value='6';nodes.age.events.input();nodes['health-option'].value='ded100000';nodes['health-option'].events.change();nodes['convertible-use'].events.click();
 nodes['convertible-age-1'].value='14';nodes['convertible-age-1'].events.change();nodes['convertible-age-2'].value='64';nodes['convertible-age-2'].events.change();
 assert.ok(nodes['customer-summary-text'].value.includes('อายุ 14 ปี'));assert.ok(nodes['customer-summary-text'].value.includes('อายุ 64 ปี'));nodes.frequency.events.change();assert.equal(nodes['convertible-age-1'].value,'14');assert.equal(nodes['convertible-age-2'].value,'64');
 nodes['convertible-age-1'].value='';nodes['convertible-age-1'].events.change();nodes.frequency.events.change();assert.equal(nodes['convertible-age-1'].value,'');assert.ok(!nodes['convertible-plan'].textContent.includes('อายุ 14 ปี'));
 nodes.age.value='10';nodes.age.events.input();assert.equal(nodes['convertible-first-window'].hidden,false);assert.ok(nodes['convertible-age-1'].innerHTML.includes('value="15"'));
 nodes.age.value='11';nodes.age.events.input();assert.equal(nodes['convertible-first-window'].hidden,true);assert.equal(nodes['convertible-age-1'].value,'');assert.equal(nodes['convertible-option-field'].hidden,false);
 nodes.age.value='60';nodes.age.events.input();assert.equal(nodes['convertible-option-field'].hidden,false);assert.equal(nodes['convertible-controls'].hidden,false);assert.equal(nodes['convertible-age-2'].value,'65');assert.ok(nodes['customer-summary-text'].value.includes('อายุ 65 ปี'));
 nodes.age.value='61';nodes.age.events.input();assert.equal(nodes['convertible-option-field'].hidden,true);assert.equal(nodes['convertible-controls'].hidden,true);assert.equal(nodes['convertible-age-2'].disabled,true);assert.equal(nodes['convertible-age-2'].value,'');assert.equal(nodes.pdf.disabled,false);assert.ok(!nodes['customer-summary-text'].value.includes('Convertible Option'));
 nodes.age.value='60';nodes.age.events.input();assert.equal(nodes['convertible-option-field'].hidden,false);assert.equal(nodes['convertible-controls'].hidden,true);nodes['convertible-use'].events.click();assert.equal(nodes['convertible-controls'].hidden,false);assert.equal(nodes['convertible-age-2'].value,'65');
 nodes['health-option'].value='copay10';nodes['health-option'].events.change();assert.equal(nodes['convertible-use'].disabled,true);assert.equal(nodes['convertible-controls'].hidden,true);assert.ok(!nodes['customer-summary-text'].value.includes('Convertible Option'));
 nodes['health-product'].value='';nodes['health-product'].events.change();nodes['daily-enabled'].checked=false;nodes['ci-enabled'].checked=false;nodes['pa-enabled'].checked=false;nodes['main-plan'].value='smart9999-large';nodes.amount.value='1000000';nodes['main-plan'].events.change();
 nodes.age.value='80';nodes.age.events.input();nodes['care-enabled'].checked=true;nodes['care-enabled'].events.change();assert.equal(nodes['care-selector'].hidden,false);assert.equal(nodes['care-enabled'].disabled,false);assert.equal(nodes['care-cost'].hidden,false);assert.ok(nodes['customer-summary-text'].value.includes('Care Plus'));assert.equal(nodes.pdf.disabled,false);
 nodes.age.value='81';nodes.age.events.input();assert.equal(nodes['care-enabled'].checked,false);assert.equal(nodes['care-enabled'].disabled,true);assert.equal(nodes['care-selector'].hidden,true);assert.equal(nodes['care-controls'].hidden,true);assert.equal(nodes['care-cost'].hidden,true);assert.equal(nodes['care-premium-heading'].hidden,true);assert.ok(!nodes['customer-summary-text'].value.includes('Care Plus'));assert.ok(!nodes['schedule-body'].innerHTML.includes('carePremium'));assert.equal(nodes.pdf.disabled,false);
 nodes.age.value='80';nodes.age.events.input();assert.equal(nodes['care-selector'].hidden,false);assert.equal(nodes['care-enabled'].checked,false);assert.equal(nodes['care-enabled'].disabled,false);nodes['care-enabled'].checked=true;nodes['care-enabled'].events.change();assert.equal(nodes['care-cost'].hidden,false);assert.equal(nodes.pdf.disabled,false);
 console.log('PASS: Care Plus selectable through 80, cleared/disabled/hidden at 81, removed from totals/summary, and remains unchecked when returning to 80');
 console.log('PASS: initial state, checkbox selection, fixed occupation 1, annual quote/summary/column, invalid-age handling, complete rider removal');
}finally{globalThis.document=oldDocument;globalThis.fetch=oldFetch;}
