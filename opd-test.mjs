import assert from 'node:assert/strict';
import fs from 'node:fs';
import {OPD_ANNUAL_BANDS,OPD_BENEFITS,OPD_TERMS,opdQuote,opdSummary} from './dist/opd-maochai.mjs';
import {calculateLegacy} from './dist/health-calculator.mjs';
import {addHealthRider,healthReportResult,validateMainRiders} from './dist/health-rider.mjs';
import {scheduleViewResult} from './dist/schedule-premium-view.mjs';
import {premiumPaymentViews,premiumPaymentTable} from './dist/premium-payment-views.mjs';
import {reportPageLayouts,drawPDFPage} from './dist/health-pdf-export.mjs';
import {reportParts} from './dist/health-excel-export.mjs';
const read=n=>JSON.parse(fs.readFileSync('dist/'+n)),data=read('health-rates.json'),rates=read('health-premiums.json');rates.ci=read('ci-perfect-care-rates.json');
const base={age:35,gender:'male',amount:1000000,mode:'sum',frequency:'annual',paEnabled:true,paPlan:1,opdType:'lump',opdBenefit:15000};
assert.deepEqual(OPD_BENEFITS,[15000,20000,25000,30000,50000,100000]);
for(const [age,gender,benefit,expected] of [[6,'male',15000,13500],[11,'female',20000,8132],[21,'female',25000,10868],[35,'male',15000,8569],[41,'female',30000,20141],[51,'female',50000,36950],[61,'male',100000,59494],[71,'male',100000,74671],[76,'male',100000,82453],[81,'female',100000,90000],[98,'male',25000,23750]])assert.equal(opdQuote({...base,age,gender,opdBenefit:benefit},age,true).premium,expected);
let count=0;
for(const band of OPD_ANNUAL_BANDS)for(let age=band.min;age<=band.max;age++)for(const gender of ['male','female'])for(const [j,benefit] of OPD_BENEFITS.entries())for(const [frequency,factor] of Object.entries({annual:1,semiannual:0.52,quarterly:0.26,monthly:0.087})){
 const q=opdQuote({...base,gender,frequency,opdBenefit:benefit},age,true),annual=band.rates[j*2+(gender==='female'?1:0)];
 assert.equal(q.annualRate,annual);assert.equal(q.premium,Math.floor(annual*factor+0.500000001));count++;
}
assert.equal(opdQuote({...base,age:6,frequency:'monthly'}).premium,1175);
assert.equal(opdQuote({...base,frequency:'semiannual'}).premium,4456);assert.equal(opdQuote({...base,frequency:'quarterly'}).premium,2228);assert.equal(opdQuote({...base,frequency:'monthly'}).premium,746);
for(const patch of [{age:5},{age:99},{age:''},{age:91},{opdType:'unknown'},{opdBenefit:17000},{frequency:'weekly'},{gender:'x'}])assert.throws(()=>opdQuote({...base,...patch}));
assert.equal(opdQuote({...base,opdType:''}),null);
for(const frequency of ['annual','semiannual','quarterly','monthly'])for(const gender of ['male','female'])for(const benefit of OPD_BENEFITS){
 const input={...base,frequency,gender,opdBenefit:benefit,healthProduct:'elite',healthPlan:1,healthArea:0,dailyEnabled:true,dailyBenefit:500,careEnabled:true,careBenefit:5000000,careCondition:'both',ciEnabled:true,ciSum:1000000};
 const before=addHealthRider(calculateLegacy(data,input),rates,{...input,opdType:''}),r=addHealthRider(calculateLegacy(data,input),rates,input);validateMainRiders(r);
 assert.equal(r.combinedFirstYearPremium,Math.round((before.combinedFirstYearPremium+r.opd.premium)*100)/100);
 for(let i=0;i<r.schedule.length;i++){
  const row=r.schedule[i],old=before.schedule[i];for(const key of ['paid','coverage','maturity','pay','riderPremium','healthPremium','dailyPremium','carePremium','ciPremium'])assert.equal(row[key],old[key]);
  assert.equal(row.opdPremium,row.age===99?0:opdQuote(input,row.age,true).premium*r.frequency.payments);
  assert.equal(row.totalPremium,old.totalPremium===null?null:Math.round((old.totalPremium+row.opdPremium)*100)/100);
 }
 const report=healthReportResult(r),modal=scheduleViewResult(r,'modal');assert.equal(modal.schedule[0].opdPremium,r.opd.premium);
 assert.equal(report.schedule[0].riderPremium,Math.round((r.combinedFirstYearAnnual-r.annualPaid)*100)/100);
 const layouts=reportPageLayouts(report);assert.equal(layouts.filter(x=>x.kind==='opd').length,1);
 const text=[],ctx={scale(){},fillRect(){},fillText(t){text.push(String(t));},measureText(t){return {width:String(t).length*4.5};}},canvas={getContext:()=>ctx};
 drawPDFPage(canvas,report,'sum',layouts.find(x=>x.kind==='opd'),1,layouts.length,1);assert.ok(text.join('').includes(OPD_TERMS[2]));assert.equal(canvas.height,842);
 const xml=reportParts(read('excel-template.json'),report,'sum')['xl/worksheets/sheet1.xml'];assert.ok(xml.includes('OPD เหมาจ่าย'));assert.ok(xml.includes('180 วัน'));assert.ok(xml.includes(String(r.schedule[0].totalPremium)));
}
const r=addHealthRider(calculateLegacy(data,base),rates,base);assert.equal(r.combinedFirstYearPremium,35849);
const modal=addHealthRider(calculateLegacy(data,{...base,frequency:'monthly'}),rates,{...base,frequency:'monthly'});assert.equal(modal.combinedFirstYearPremium,3146.4);assert.equal(modal.combinedFirstYearAnnual,37756.8);
assert.equal(r.schedule.find(x=>x.age===98).opdPremium,14250);assert.equal(r.schedule.at(-1).opdPremium,0);
assert.ok(opdSummary(r.opd,r.frequency).includes('2 ครั้งต่อวัน'));
const views=premiumPaymentViews(data,rates,base,r);assert.deepEqual(views.map(x=>x.opd),[8569,4456,2228,746]);assert.ok(premiumPaymentTable(views,r,'annual').includes('OPD เหมาจ่าย'));
const onlyOPD={...base,paEnabled:false};assert.throws(()=>validateMainRiders(addHealthRider(calculateLegacy(data,onlyOPD),rates,onlyOPD)),/ต้องเลือก/);
const fixed={...onlyOPD,mainPlan:'wholelife50000',amount:50000};assert.doesNotThrow(()=>validateMainRiders(addHealthRider(calculateLegacy(data,fixed),rates,fixed)));
assert.equal(reportPageLayouts(healthReportResult(addHealthRider(calculateLegacy(data,base),rates,{...base,opdType:''}))).some(p=>p.kind==='opd'),false);
console.log(`PASS: ${count} OPD rate/modal lookups, source anchors, half-up rounding, age/renewal boundaries, 48 all-rider combinations, totals, unchanged benefits, comparisons and PDF/Excel.`);
