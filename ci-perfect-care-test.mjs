import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ciQuote,ciBenefits,ciSummary} from './dist/ci-perfect-care.mjs';
import {calculateLegacy} from './dist/health-calculator.mjs';
import {addHealthRider,healthReportResult,validateMainRiders} from './dist/health-rider.mjs';
import {reportParts} from './dist/health-excel-export.mjs';
import {reportPageLayouts,drawPDFPage} from './dist/health-pdf-export.mjs';
const ci=JSON.parse(await fs.readFile('dist/ci-perfect-care-rates.json'));
const data=JSON.parse(await fs.readFile('dist/health-premiums.json'));data.ci=ci;
const base=JSON.parse(await fs.readFile('dist/health-rates.json')),template=JSON.parse(await fs.readFile('dist/excel-template.json'));
const input={mainPlan:'smart9920',age:35,gender:'male',frequency:'annual',mode:'sum',amount:1000000,ciEnabled:true,ciSum:'1000000'};
// Independent source anchors from the supplied image, including renewal-only rows.
const anchors={0:[4.67,2.38,1.21,.411,2.32,1.18,.60,.204],6:[1.51,.77,.39,.133,1.05,.54,.27,.092],35:[4.85,2.47,1.26,.427,4.28,2.18,1.11,.377],63:[55.32,28.21,14.38,4.868,27.11,13.83,7.05,2.386],65:[66.27,33.80,17.23,5.832,33.10,16.88,8.61,2.913],76:[230.20,117.40,59.85,20.258,115.65,58.98,30.07,10.177],83:[369.88,188.64,96.17,32.549,187.60,95.68,48.78,16.509],84:[381.15,194.39,99.10,33.541,187.60,95.68,48.78,16.509]};
for(const [age,rates] of Object.entries(anchors))assert.deepEqual(ci.rates[age],rates,`image row ${age}`);
assert.equal(ci.rates.length,85);
for(let age=0;age<=84;age++)for(const gender of ['male','female'])for(const frequency of ci.frequencies){
 const q=ciQuote(ci,{...input,age,gender,frequency});
 assert.ok(Number.isFinite(q.premium)&&q.premium>0);
 assert.equal(ciQuote(ci,{...input,age,gender,frequency,ciSum:2000000}).premium,q.premium*2);
}
assert.deepEqual(ciBenefits(1000000).map(x=>x.amount),[1000000,250000,500000,1000000,100000,100000]);
for(const ciSum of ['',0,-1,NaN,Infinity,'abc',1.001,1e13])assert.throws(()=>ciQuote(ci,{...input,ciSum}));
assert.equal(ciQuote(ci,{...input,age:85}),null);
const quote=i=>addHealthRider(calculateLegacy(base,i),data,i);
for(const age of [0,65])assert.doesNotThrow(()=>quote({...input,age}));
assert.throws(()=>quote({...input,age:66}),/ต่ออายุเท่านั้น/);
for(const frequency of ci.frequencies)for(const paEnabled of [false,true])for(const careEnabled of [false,true])for(const health of [false,true]){
 const i={...input,frequency,paEnabled,paPlan:2,careEnabled,careBenefit:'5000000',careCondition:'both',healthProduct:health?'dhealth':'',healthBenefit:'5000000',healthType:'none'};
 const r=quote(i),plain=quote({...i,ciEnabled:false});
 validateMainRiders(r);
 assert.equal(r.sum,plain.sum);assert.equal(r.totalPaid,plain.totalPaid);assert.equal(r.maturityAmount,plain.maturityAmount);
 assert.equal(r.ci.premium,{annual:4850,semiannual:2470,quarterly:1260,monthly:427}[frequency]);
 assert.equal(r.combinedFirstYearPremium,Math.round((r.premium+(r.rider?.premium??0)+(r.health?.premium??0)+(r.care?.premium??0)+r.ci.premium)*100)/100);
 for(const age of [35,65,66,84,85,98,99]){
  const row=r.schedule.find(x=>x.age===age);
  assert.equal(row.ciPremium,age>84?0:ciQuote(ci,i,age).premium*r.frequency.payments);
  assert.ok(Number.isFinite(row.totalPremium));
  if(age>=85){const without=plain.schedule.find(x=>x.age===age);assert.equal(row.totalPremium,without.totalPremium);}
 }
 const report=healthReportResult(r),xml=reportParts(template,report,'sum')['xl/worksheets/sheet1.xml'];
 assert.ok(xml.includes('ซีไอ เพอร์เฟค แคร์'));assert.ok(xml.includes('250,000.00'));assert.ok(!/undefined|NaN/.test(xml));
 const layouts=reportPageLayouts(report);assert.equal(layouts.at(-1).kind,'ci');assert.deepEqual(layouts.flatMap(p=>p.rows),report.schedule);
 const texts=[],ctx={scale(){},fillRect(){},fillText(t){texts.push(String(t));},measureText(t){return {width:String(t).length*5}},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
 layouts.forEach((p,j)=>drawPDFPage({getContext:()=>ctx},report,'sum',p,j,layouts.length,1));
 assert.ok(texts.includes('250,000.00 บาท'));assert.ok(!texts.some(t=>/undefined|NaN/.test(t)));
 assert.ok(!texts.includes('ไม่มีอัตรา'),'valid ended CI must not blank the PDF totals');
 assert.ok(ciSummary(r.ci,r.frequency).includes('250,000.00'));assert.ok(ciSummary(r.ci,r.frequency).includes('หักผลประโยชน์'));
}
assert.throws(()=>validateMainRiders(quote({...input,ciEnabled:false})),/อย่างน้อย 1 แผน/);
assert.throws(()=>validateMainRiders(quote({...input,mainPlan:'smart9999-small',amount:100000})),/ต้องเลือกแผน PA/);
assert.throws(()=>validateMainRiders(quote({...input,mainPlan:'wholelife50000',amount:50000})),/5,000/);
assert.doesNotThrow(()=>validateMainRiders(quote({...input,mainPlan:'wholelife50000',amount:50000,ciSum:1100000})));
// An actual missing rate during cover must remain unknown; only ended CI becomes zero.
const missing=structuredClone(data);missing.ci.rates[84]=null;
const incomplete=addHealthRider(calculateLegacy(base,input),missing,input);
assert.equal(incomplete.schedule.find(row=>row.age===84).totalPremium,null);
assert.equal(incomplete.schedule.find(row=>row.age===85).ciPremium,0);
assert.equal(incomplete.schedule.find(row=>row.age===85).totalPremium,0);
console.log('PASS: 680 CI rate cases, image anchors, benefits/terms, entry vs renewal ages, invalid sums, 32 rider/payment combinations, unchanged main benefits, reports and eligibility');
