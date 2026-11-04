import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EXTRA_AGES,EXTRA_RATES} from './dist/maochai-extra-rates.mjs';
import {EXTRA_PLANS,EXTRA_TERMS,extraQuote,extraBenefits,extraICULimit} from './dist/maochai-extra.mjs';
import {calculateLegacy} from './dist/health-calculator.mjs';
import {addHealthRider,healthReportResult,validateMainRiders} from './dist/health-rider.mjs';
import {scheduleViewResult} from './dist/schedule-premium-view.mjs';
import {premiumPaymentViews} from './dist/premium-payment-views.mjs';
import {reportPageLayouts,drawPDFPage} from './dist/health-pdf-export.mjs';
import {reportParts} from './dist/health-excel-export.mjs';
const read=n=>JSON.parse(fs.readFileSync('dist/'+n)),data=read('health-rates.json'),rates=read('health-premiums.json');rates.ci=read('ci-perfect-care-rates.json');
const base={age:35,gender:'male',amount:1000000,mode:'sum',frequency:'annual',paEnabled:true,paPlan:1,healthProduct:'maochai-extra',extraPlan:1};
assert.deepEqual(EXTRA_PLANS.map(p=>[p.room,p.limit]),[[2000,200000],[4000,200000],[4000,500000]]);
assert.deepEqual(EXTRA_PLANS.map(p=>extraICULimit(p.id)),[4000,8000,8000]);
let lookups=0;
for(const [frequency,table] of Object.entries(EXTRA_RATES)){
 assert.equal(table.length,17);for(const [b,row] of table.entries()){
  assert.equal(row.length,6);
  for(const plan of [1,2,3])for(const gender of ['male','female']){
   const expected=row[(plan-1)*2+(gender==='female'?1:0)];assert.ok(Number.isInteger(expected)&&expected>0);
   for(let age=EXTRA_AGES[b][0];age<=EXTRA_AGES[b][1];age++){
    const quote=extraQuote({...base,frequency,extraPlan:plan,gender},age,true);assert.equal(quote.premium,expected);lookups++;
   }
   if(frequency!=='annual'){
    const factor={semiannual:520,quarterly:270,monthly:90}[frequency],annual=EXTRA_RATES.annual[b][(plan-1)*2+(gender==='female'?1:0)];
    assert.equal(expected,Math.floor((annual*factor+500)/1000),`${frequency}, band ${b}, plan ${plan}, ${gender}`);
   }
  }
 }
}
// Independent source anchors, one plan pair at every age band plus direct modal anchors.
const anchors=[[11,1,8434,7943],[18,2,10050,9663],[21,3,12317,15265],[31,1,11500,12800],[36,2,15300,16850],[41,3,17200,19858],[46,1,16400,19242],[51,2,23661,26510],[56,3,33280,27563],[61,1,33941,32127],[66,2,40712,39319],[71,3,78546,70275],[76,1,123500,105500],[81,2,152754,127470],[86,1,154917,119637],[91,3,216453,169365],[96,2,235616,185198]];
for(const [age,plan,male,female] of anchors)for(const [gender,premium] of [['male',male],['female',female]])assert.equal(extraQuote({...base,extraPlan:plan,gender},age,true).premium,premium);
for(const [frequency,plan,age,gender,expected] of [['semiannual',1,11,'female',4130],['quarterly',2,36,'female',4550],['monthly',3,76,'male',12621],['monthly',1,96,'female',14486],['semiannual',3,96,'female',99520]])assert.equal(extraQuote({...base,frequency,extraPlan:plan,gender},age,true).premium,expected);
for(const age of [10,99,10.5])assert.throws(()=>extraQuote({...base,age}),/11–90/);
assert.throws(()=>extraQuote({...base,age:91}),/ต่ออายุ/);assert.equal(extraQuote({...base,age:90}).premium,154917);
assert.throws(()=>extraQuote({...base,extraPlan:4}),/เลือกแผน/);
for(const plan of EXTRA_PLANS){
 const benefits=extraBenefits(plan.id);assert.equal(benefits[0][1],plan.room.toLocaleString('th-TH')+' บาท/วัน');assert.ok(benefits.some(b=>b[0].includes('ICU')&&b[1].includes((plan.room*2).toLocaleString('th-TH'))));
 for(const category of ['6.1','6.2','7.','8.','9.','10.','11.','13.'])assert.equal(benefits.find(b=>b[0].startsWith(category))[1],'ไม่คุ้มครอง');
 assert.ok(benefits.some(b=>b[0].startsWith('12.')&&b[1]==='จ่ายตามจริง'));assert.ok(benefits.some(b=>b[1]===plan.limit.toLocaleString('th-TH')+' บาท'));
}
let combinations=0;
for(const gender of ['male','female'])for(const frequency of ['annual','semiannual','quarterly','monthly'])for(const extraPlan of [1,2,3])for(const all of [false,true]){
 const input={...base,gender,frequency,extraPlan,careEnabled:all,careBenefit:5000000,careCondition:'both',opdType:all?'per-visit':'',opdBenefit:500,ciEnabled:all,ciSum:1000000,dailyEnabled:all,dailyBenefit:500};
 const main=calculateLegacy(data,input),r=addHealthRider(main,rates,input);validateMainRiders(r);
 assert.equal(r.health.premium,extraQuote(input).premium);
 for(const row of r.schedule){assert.equal(row.coverage,main.schedule.find(x=>x.age===row.age).coverage);if(row.age<99)assert.equal(row.healthPremium,extraQuote(input,row.age,true).premium*r.frequency.payments);else assert.equal(row.healthPremium,0);}
 assert.equal(r.combinedFirstYearAnnual,Math.round(r.combinedFirstYearPremium*r.frequency.payments*100)/100);
 const report=healthReportResult(r),modal=scheduleViewResult(report,'modal');assert.ok(reportPageLayouts(report).some(p=>p.kind==='maochai-extra'));assert.ok(!reportPageLayouts(report).some(p=>['dhealth','elite','convertible'].includes(p.kind)));
 assert.equal(modal.schedule[0].healthPremium,r.health.premium);
 const views=premiumPaymentViews(data,rates,input,r);for(const v of views)assert.equal(v.health,extraQuote({...input,frequency:v.id}).premium);
 const parts=reportParts(read('excel-template.json'),report,'sum');assert.ok(parts['xl/worksheets/sheet1.xml'].includes('เหมาจ่าย Extra'));assert.ok(parts['xl/worksheets/sheet1.xml'].includes('91–98'));
 combinations++;
}
// Actual page module under the shared DOM harness: switching, all choices, age boundaries and removal.
const html=fs.readFileSync('dist/health.html','utf8'),nodes={};for(const [,id] of html.matchAll(/id="([^"]+)"/g))nodes[id]={value:'',checked:false,disabled:false,hidden:false,textContent:'',innerHTML:'',events:{},classList:{toggle(){},remove(){},add(){}},addEventListener(t,fn){this.events[t]=fn;},replaceChildren(){this.innerHTML='';},remove(){},options:[],setAttribute(){}};
Object.assign(nodes.age,{value:'35'});nodes.amount.value='1000000';nodes.frequency.value='annual';nodes['pa-plan'].value='1';nodes['pa-plan'].options=Array.from({length:7},(_,i)=>({value:String(i+1)}));nodes['health-benefit'].value='5000000';nodes['health-type'].value='none';nodes['health-option'].value='ded0';nodes['health-plan'].value='1';nodes['health-area'].value='0';
const radio={value:'male',addEventListener(){}},oldDocument=globalThis.document,oldFetch=globalThis.fetch;
globalThis.document={getElementById:id=>nodes[id],querySelector:()=>radio,querySelectorAll:()=>[radio],body:{classList:{toggle(){}}}};globalThis.fetch=async url=>({ok:true,json:async()=>String(url).includes('health-premiums')?rates:data});
try{
 await import('./dist/health.mjs?extra-test');nodes['pa-enabled'].checked=true;nodes['pa-enabled'].events.change();nodes['health-product'].value='maochai-extra';nodes['health-product'].events.change();
 assert.equal(nodes['extra-plan'].value,'1');assert.equal(nodes['extra-controls'].hidden,false);assert.equal(nodes['dhealth-controls'].hidden,true);assert.equal(nodes['elite-controls'].hidden,true);assert.equal(nodes['convertible-option-field'].hidden,true);
 for(const plan of [1,2,3])for(const frequency of ['annual','semiannual','quarterly','monthly']){
  nodes['extra-plan'].value=String(plan);nodes['extra-plan'].events.change();nodes.frequency.value=frequency;nodes.frequency.events.change();assert.equal(nodes['extra-plan'].value,String(plan));assert.equal(nodes.pdf.disabled,false);assert.ok(nodes['health-selection'].textContent.includes(EXTRA_PLANS[plan-1].label));assert.ok(nodes['health-premium'].textContent.includes(extraQuote({...base,extraPlan:plan,frequency}).premium.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2})));assert.ok(nodes['customer-summary-text'].value.includes('เหมาจ่าย Extra'));assert.ok(nodes['extra-benefits'].innerHTML.includes('120 วัน'));
 }
 nodes.age.value='10';nodes.age.events.input();assert.equal(nodes.pdf.disabled,true);assert.ok(nodes.error.textContent.includes('11–90'));
 nodes.age.value='11';nodes.age.events.input();assert.equal(nodes.pdf.disabled,false);
 nodes['health-product'].value='';nodes['health-product'].events.change();assert.equal(nodes['extra-controls'].hidden,true);assert.equal(nodes['health-cost'].hidden,true);assert.ok(!nodes['customer-summary-text'].value.includes('เหมาจ่าย Extra'));
 nodes['health-product'].value='maochai-extra';nodes['health-product'].events.change();assert.equal(nodes['extra-plan'].value,'1');assert.equal(nodes.pdf.disabled,false);
}finally{globalThis.document=oldDocument;globalThis.fetch=oldFetch;}
console.log(`PASS: Extra 408 source cells / ${lookups} rate lookups, modal anchors, 48 rider combinations, three plans, eligibility/renewal, totals, benefits, PDF/Excel and UI switching`);
