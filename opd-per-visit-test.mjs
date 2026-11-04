import assert from 'node:assert/strict';
import fs from 'node:fs';
import {OPD_PER_VISIT_AGES,OPD_PER_VISIT_RATES} from './dist/opd-per-visit-rates.mjs';
import {OPD_PER_VISIT_BENEFITS,OPD_PER_VISIT_TERMS} from './dist/opd-per-visit.mjs';
import {opdQuote,opdSummary} from './dist/opd-maochai.mjs';
import {calculateLegacy} from './dist/health-calculator.mjs';
import {addHealthRider,healthReportResult,validateMainRiders} from './dist/health-rider.mjs';
import {premiumPaymentViews} from './dist/premium-payment-views.mjs';
import {scheduleViewResult} from './dist/schedule-premium-view.mjs';
import {reportPageLayouts,drawPDFPage} from './dist/health-pdf-export.mjs';
import {reportParts} from './dist/health-excel-export.mjs';
const read=n=>JSON.parse(fs.readFileSync('dist/'+n)),data=read('health-rates.json'),rates=read('health-premiums.json');rates.ci=read('ci-perfect-care-rates.json');
const base={age:35,gender:'male',amount:1000000,mode:'sum',frequency:'annual',paEnabled:true,paPlan:1,opdType:'per-visit',opdBenefit:500};
assert.deepEqual(OPD_PER_VISIT_BENEFITS,[500,800,1000,1500,2000,2500,3000]);
assert.deepEqual(OPD_PER_VISIT_BENEFITS.map(n=>opdQuote({...base,opdBenefit:n}).annualLimit),[15000,24000,30000,45000,60000,75000,90000]);
// Direct anchors from all supplied tables, including renewal-only rows.
for(const [age,gender,benefit,expected] of [[6,'male',3000,[13815,7184,3730,1243]],[11,'female',800,[3670,1908,991,330]],[35,'female',1500,[6282,3267,1696,565]],[40,'male',2500,[9047,4704,2443,814]],[50,'female',3000,[20088,10446,5424,1808]],[65,'male',2000,[18954,9856,5118,1706]],[75,'female',500,[8546,4444,2307,769]],[80,'male',3000,[47385,24640,12794,4265]],[85,'female',800,[17951,9335,4847,1616]],[90,'male',3000,[60487,31453,16331,5444]],[98,'female',2000,[48000,24960,12960,4320]]]){
 for(const [i,frequency] of ['annual','semiannual','quarterly','monthly'].entries())assert.equal(opdQuote({...base,age,gender,frequency,opdBenefit:benefit},age,true).premium,expected[i]);
}
let cells=0,lookups=0;
for(const [frequency,table] of Object.entries(OPD_PER_VISIT_RATES)){
 assert.equal(table.length,19);
 for(let band=0;band<table.length;band++){
  assert.equal(table[band].length,14);cells+=14;
  for(let age=OPD_PER_VISIT_AGES[band][0];age<=OPD_PER_VISIT_AGES[band][1];age++)for(const gender of ['male','female'])for(const [plan,benefit] of OPD_PER_VISIT_BENEFITS.entries()){
   const q=opdQuote({...base,gender,frequency,opdBenefit:benefit},age,true);assert.equal(q.premium,table[band][plan*2+(gender==='female'?1:0)]);lookups++;
  }
 }
}
assert.equal(cells,1064);assert.equal(lookups,5208);
// Arithmetic cross-check for transcription only; production always looks up supplied modal cells.
for(const [frequency,factor] of [['semiannual',52],['quarterly',27],['monthly',9]])for(let row=0;row<19;row++)for(let col=0;col<14;col++)assert.equal(OPD_PER_VISIT_RATES[frequency][row][col],Math.floor((OPD_PER_VISIT_RATES.annual[row][col]*factor+50)/100));
for(const patch of [{age:5},{age:81},{age:99},{age:''},{opdBenefit:15000},{opdBenefit:501},{gender:'x'},{frequency:'weekly'}])assert.throws(()=>opdQuote({...base,...patch}));
assert.equal(opdQuote({...base,age:80}).renewalAge,81);assert.equal(opdQuote({...base,opdType:'lump',opdBenefit:15000,age:81}).renewalAge,91);
for(const frequency of ['annual','semiannual','quarterly','monthly'])for(const gender of ['male','female'])for(const benefit of OPD_PER_VISIT_BENEFITS){
 const input={...base,frequency,gender,opdBenefit:benefit,healthProduct:'elite',healthPlan:1,healthArea:0,careEnabled:true,careBenefit:5000000,careCondition:'both',dailyEnabled:true,dailyBenefit:500,ciEnabled:true,ciSum:1000000};
 const before=addHealthRider(calculateLegacy(data,input),rates,{...input,opdType:''}),r=addHealthRider(calculateLegacy(data,input),rates,input);validateMainRiders(r);
 assert.equal(r.combinedFirstYearPremium,Math.round((before.combinedFirstYearPremium+r.opd.premium)*100)/100);
 for(let i=0;i<r.schedule.length;i++){
  const row=r.schedule[i],old=before.schedule[i];for(const key of ['paid','coverage','maturity','pay','riderPremium','healthPremium','dailyPremium','carePremium','ciPremium'])assert.equal(row[key],old[key]);
  assert.equal(row.opdPremium,row.age===99?0:opdQuote(input,row.age,true).premium*r.frequency.payments);
 }
 const modal=scheduleViewResult(r,'modal');assert.equal(modal.schedule[0].opdPremium,r.opd.premium);
 const report=healthReportResult(r),layouts=reportPageLayouts(report),text=[],ctx={scale(){},fillRect(){},fillText(t){text.push(String(t));},measureText(t){return {width:String(t).length*4.5};}};
 drawPDFPage({getContext:()=>ctx},report,'sum',layouts.find(x=>x.kind==='opd'),1,layouts.length,1);
 assert.ok(text.join('').includes(OPD_PER_VISIT_TERMS[1]));assert.ok(!text.join('').includes('120 วัน'));assert.ok(!text.join('').includes('ค่ายา'));
 const xml=reportParts(read('excel-template.json'),report,'sum')['xl/worksheets/sheet1.xml'];assert.ok(xml.includes('OPD ต่อครั้ง'));assert.ok(xml.includes('7 ครั้ง'));assert.ok(xml.includes(String(r.schedule[0].totalPremium)));
}
const r=addHealthRider(calculateLegacy(data,base),rates,base);assert.equal(r.combinedFirstYearPremium,29359);
assert.deepEqual(premiumPaymentViews(data,rates,base,r).map(v=>v.opd),[2079,1081,561,187]);
const monthly={...base,frequency:'monthly'},m=addHealthRider(calculateLegacy(data,monthly),rates,monthly);assert.equal(m.combinedFirstYearPremium,2587.4);assert.equal(m.combinedFirstYearAnnual,31048.8);
assert.ok(opdSummary(r.opd,r.frequency).includes('OPD ต่อครั้ง'));assert.ok(!opdSummary(r.opd,r.frequency).includes('180 วัน'));
const oldInput={...base,age:80,mainPlan:'smart9999-large',amount:200000,paEnabled:false,frequency:'monthly'},old=addHealthRider(calculateLegacy(data,oldInput),rates,oldInput);
assert.equal(old.schedule[0].opdPremium,759*12);assert.equal(old.schedule.find(s=>s.age===81).opdPremium,873*12);assert.equal(old.schedule.find(s=>s.age===98).opdPremium,1080*12);assert.equal(old.schedule.at(-1).opdPremium,0);
console.log('PASS: 1,064 per-visit source cells / 5,208 lookups, four exact modal tables, seven benefits, 81+ renewal only, 56 all-rider combinations, totals and product-specific PDF/Excel/LINE terms.');
