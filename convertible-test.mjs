import assert from 'node:assert/strict';
import fs from 'node:fs';
import {convertibleAges,convertiblePlan,lowerDeductible} from './dist/dhealth-convertible.mjs';
import {calculateLegacy} from './dist/health-calculator.mjs';
import {addHealthRider,healthReportResult,healthQuote} from './dist/health-rider.mjs';
import {scheduleViewResult} from './dist/schedule-premium-view.mjs';
import {reportPageLayouts,drawPDFPage} from './dist/health-pdf-export.mjs';
import {reportParts} from './dist/health-excel-export.mjs';
const read=n=>JSON.parse(fs.readFileSync('dist/'+n)),data=read('health-rates.json'),rates=read('health-premiums.json');
const base={age:6,gender:'male',amount:1000000,mode:'sum',frequency:'annual',paEnabled:true,paPlan:1,healthProduct:'dhealth',healthBenefit:5000000,healthType:'deductible',healthOption:'ded100000',healthConvertible:true,convertibleAge1:14,convertibleAge2:64};
assert.deepEqual(convertiblePlan(base),[{age:14,from:'ded100000',to:'ded50000'},{age:64,from:'ded50000',to:'ded30000'}]);
assert.deepEqual(convertibleAges(10,0),[15]);assert.deepEqual(convertibleAges(11,0),[]);assert.deepEqual(convertibleAges(60,1),[65]);assert.deepEqual(convertibleAges(61,1),[]);
assert.throws(()=>convertiblePlan({...base,age:10,convertibleAge1:14}),/5 ปี/);
assert.throws(()=>convertiblePlan({...base,convertibleAge2:66}),/5 ปี/);
assert.deepEqual(convertiblePlan({...base,healthType:'copay',healthOption:'copay20'}),[]);
assert.deepEqual(convertiblePlan({...base,healthConvertible:false}),[]);
assert.deepEqual(convertiblePlan({...base,healthProduct:'elite'}),[]);
const options={1000000:['ded20000','ded50000'],5000000:['ded30000','ded50000','ded100000']};
const step=(id,benefit)=>id==='ded100000'?'ded50000':id==='ded50000'?(benefit===1000000?'ded20000':'ded30000'):'ded0';
let cases=0,checks=0;
for(const age of [6,10,11,35,50,55,60,61,65,70])for(const gender of ['male','female'])for(const frequency of ['annual','semiannual','quarterly','monthly'])for(const benefit of [1000000,5000000])for(const option of options[benefit]){
 const age1=age+5<=15?Math.max(11,age+5):'',age2=age+5<=65?Math.max(55,age+5):'';
 const i={...base,age,gender,frequency,healthBenefit:benefit,healthOption:option,convertibleAge1:age1,convertibleAge2:age2};
 const main=calculateLegacy(data,i),r=addHealthRider(main,rates,i),off=addHealthRider(main,rates,{...i,healthConvertible:false});
 assert.equal(r.combinedFirstYearPremium,off.combinedFirstYearPremium);
 for(const [index,row] of r.schedule.entries()){
  assert.equal(row.coverage,off.schedule[index].coverage);assert.equal(row.pay,off.schedule[index].pay);assert.equal(row.riderPremium,off.schedule[index].riderPremium);
  if(row.age===99){assert.equal(row.healthPremium,0);continue;}
  let expectedOption=option;
  if(age1!==''&&row.age>=age1)expectedOption=step(expectedOption,benefit);
  if(age2!==''&&row.age>=age2)expectedOption=step(expectedOption,benefit);
  assert.equal(row.healthDeductibleOption,expectedOption);
  const columns=benefit===1000000?['ded0','ded20000','ded50000','copay20','copay10']:['ded0','ded30000','ded50000','ded100000','copay20','copay10'];
  const band=rates.dhealth[benefit][frequency].find(b=>row.age>=b.min&&row.age<=b.max),premium=band?.values[columns.indexOf(expectedOption)*2+(gender==='female'?1:0)]??null;
  assert.equal(row.healthPremium,premium===null?null:Math.round(premium*r.frequency.payments*100)/100);
  assert.equal(row.totalPremium,premium===null?null:Math.round((row.pay+row.riderPremium+row.healthPremium)*100)/100);
  checks++;
 }
 cases++;
}
assert.equal(lowerDeductible('ded50000',1000000),'ded20000');assert.equal(lowerDeductible('ded50000',5000000),'ded30000');
const r=addHealthRider(calculateLegacy(data,base),rates,base),report=healthReportResult(r),modal=scheduleViewResult(report,'modal');
assert.deepEqual(modal.health.convertibleChanges,r.health.convertibleChanges);
assert.ok(reportPageLayouts(report).some(p=>p.kind==='convertible'));
assert.ok(!reportPageLayouts(healthReportResult(addHealthRider(calculateLegacy(data,base),rates,{...base,healthConvertible:false}))).some(p=>p.kind==='convertible'));
const texts=[],ctx={scale(){},fillRect(){},fillText(s){texts.push(s);},measureText:s=>({width:[...s].length*4})};
drawPDFPage({getContext:()=>ctx},report,'sum',{kind:'convertible'},0,1,1);assert.ok(texts.some(s=>s.includes('อายุ 14 ปี')));assert.ok(texts.some(s=>s.includes('อายุ 64 ปี')));
const sheet=reportParts(read('excel-template.json'),report,'sum')['xl/worksheets/sheet1.xml'];assert.ok(sheet.includes('Convertible Option'));assert.ok(sheet.includes('อายุ 64 ปี'));
for(const input of [{...base,healthType:'none',healthOption:'ded0'},{...base,healthType:'copay',healthOption:'copay20'}])assert.equal(healthQuote(rates,input,65).premium,healthQuote(rates,{...input,healthConvertible:false},65).premium);
console.log(`PASS: Convertible ${cases} schedules / ${checks} source-rate rows, 5-year boundaries, two windows, one-step reductions, modal/annual totals, unchanged main benefits, PDF/Excel notes and disabled/Copay behavior`);
