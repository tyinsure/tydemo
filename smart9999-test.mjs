import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {calculateLegacy,legacySummary} from './dist/health-calculator.mjs';
import {addHealthRider,healthReportResult} from './dist/health-rider.mjs';
import {reportParts,zipParts} from './dist/health-excel-export.mjs';
import {reportPageLayouts,drawPDFPage} from './dist/health-pdf-export.mjs';
const data=JSON.parse(await fs.readFile('dist/health-rates.json')),health=JSON.parse(await fs.readFile('dist/health-premiums.json')),template=JSON.parse(await fs.readFile('dist/excel-template.json'));
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
let lookups=0;
for(const band of data.smart9999.bands)for(const row of band.rates)for(const gender of ['male','female'])for(const f of data.frequencies){
 const amount=band.min===50001?100000:band.min;
 const i={mainPlan:amount<200000?'smart9999-small':'smart9999-large',age:row.age,gender,amount,frequency:f.id,mode:'sum',mainAtLeast30Days:true};
 const r=calculateLegacy(data,i);
 assert.equal(r.rate,row[gender][f.rateIndex]);assert.equal(r.premium,round(amount*r.rate/1000));
 assert.equal(r.payYears,99-row.age);assert.equal(r.schedule.length,100-row.age);
 assert.equal(r.schedule.at(-2).age,98);assert.equal(r.schedule.at(-2).pay,r.annualPaid);
 assert.equal(r.schedule.at(-1).pay,0);assert.equal(r.maturityAmount,Math.max(amount,round(r.totalPaid*1.01)));
 for(const item of r.schedule.slice(0,-1))assert.equal(item.coverage,Math.max(amount,round(item.paid*1.01)));
 lookups++;
}
const base={mainPlan:'smart9999-small',age:35,gender:'male',amount:100000,frequency:'annual',mode:'sum'};
for(const [amount,rate] of [[50001,21.66],[199999,21.66],[200000,21.66],[499999.99,21.66],[500000,19.69],[999999.99,19.69],[1000000,17.33],[9999999.99,17.33]])assert.equal(calculateLegacy(data,{...base,amount,mainPlan:amount<200000?'smart9999-small':'smart9999-large'}).rate,rate);
for(const amount of [0,50000,200000])assert.throws(()=>calculateLegacy(data,{...base,amount}));
assert.throws(()=>calculateLegacy(data,{...base,mainPlan:'smart9999-large',amount:10000000}));
for(const age of ['',-1,91,1.5])assert.throws(()=>calculateLegacy(data,{...base,age}));
assert.throws(()=>calculateLegacy(data,{...base,age:0}));
const sample=calculateLegacy(data,base);assert.equal(sample.totalPaid,138624);assert.equal(sample.maturityAmount,140010.24);
assert.equal(calculateLegacy(data,{...base,mode:'premium',amount:2166}).sum,100000);
assert.throws(()=>calculateLegacy(data,{...base,mainPlan:'smart9999-large',mode:'premium',amount:10000}),/หลายช่วง/);
for(const mainPlan of ['smart9999-small','smart9999-large'])for(const frequency of ['annual','monthly'])for(const riders of [false,true]){
 const i={...base,mainPlan,frequency,amount:mainPlan.endsWith('small')?100000:1000000,healthProduct:riders?'dhealth':'',healthBenefit:'5000000',healthType:'none',healthOption:'ded0',careEnabled:riders,careBenefit:'5000000',careCondition:'both',paEnabled:riders,paPlan:1};
 const r=addHealthRider(calculateLegacy(data,i),health,i),report=healthReportResult(r),parts=reportParts(template,report,'sum'),xml=parts['xl/worksheets/sheet1.xml'];
 assert.ok(xml.includes('101%'));assert.ok(xml.includes('99/99'));assert.ok(!/undefined|NaN/.test(xml));
 for(const row of r.schedule)assert.equal(row.totalPremium,round(row.pay+(row.healthPremium??0)+(row.carePremium??0)+(row.riderPremium??0)));
 const summary=legacySummary(r);assert.ok(summary.includes('ชำระเบี้ย 64 ปี'));assert.ok(summary.includes('101%'));
 const texts=[];const c={scale(){},fillRect(){},fillText(t){texts.push(String(t))},measureText(t){return{width:String(t).length*4}},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
 const pages=reportPageLayouts(report);assert.deepEqual(pages.flatMap(p=>p.rows),report.schedule);
 pages.forEach((page,n)=>drawPDFPage({getContext:()=>c},report,'sum',page,n,pages.length));
 assert.ok(texts.some(t=>t.includes('101%')));assert.ok(texts.includes('64 ปี'));assert.ok(!texts.some(t=>/undefined|NaN/.test(t)));
 await fs.writeFile(path.join(os.tmpdir(),`smart-${mainPlan}-${frequency}-${riders}.xlsx`),new Uint8Array(await zipParts(parts).arrayBuffer()));
}
console.log(`PASS: ${lookups} rates, all entry ages/modalities, tier boundaries, 101% death/maturity benefits, inverse/ambiguous inputs, all riders and 8 Excel/PDF report variants`);
