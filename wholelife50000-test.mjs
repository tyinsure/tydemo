import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {calculateLegacy,legacySummary} from './dist/health-calculator.mjs';
import {addHealthRider,healthReportResult,validateMainRiders} from './dist/health-rider.mjs';
import {reportParts,zipParts} from './dist/health-excel-export.mjs';
import {reportPageLayouts,drawPDFPage} from './dist/health-pdf-export.mjs';
const data=JSON.parse(await fs.readFile('dist/health-rates.json')),health=JSON.parse(await fs.readFile('dist/health-premiums.json')),template=JSON.parse(await fs.readFile('dist/excel-template.json'));
const input={mainPlan:'wholelife50000',age:35,gender:'male',amount:50000,frequency:'annual',mode:'sum'};
const base=calculateLegacy(data,input);
assert.equal(base.premium,765.5);assert.equal(base.payYears,64);assert.equal(base.totalPaid,48992);assert.equal(base.maturityAmount,50000);
assert.equal(calculateLegacy(data,{...input,frequency:'monthly'}).premium,70);
assert.equal(calculateLegacy(data,{...input,age:0,gender:'female'}).premium,400.5);
assert.equal(calculateLegacy(data,{...input,age:90}).premium,12500);
assert.equal(calculateLegacy(data,{...input,age:90,gender:'female',frequency:'quarterly'}).premium,3375);
for(const amount of [49999,50000.01,100000])assert.throws(()=>calculateLegacy(data,{...input,amount}),/50,000/);
assert.throws(()=>calculateLegacy(data,{...input,mode:'premium'}));
for(const annual of [0,4999,4999.99])assert.throws(()=>validateMainRiders({...base,health:{annual}}),/เบี้ยสัญญาเพิ่มเติมไม่ครบ 5,000บาท กรุณาเพิ่มให้ครบ/);
for(const annual of [5000,5000.01,10000])assert.doesNotThrow(()=>validateMainRiders({...base,health:{annual}}));
assert.doesNotThrow(()=>validateMainRiders({...base,health:{annual:2000},care:{annual:1700},rider:{annualPremium:1300}}));
assert.throws(()=>validateMainRiders({...base,health:{annual:2000},care:{annual:1699.99},rider:{annualPremium:1300}}));
for(const frequency of ['annual','semiannual','quarterly','monthly']){
 const low={...input,frequency,paEnabled:true,paPlan:1};
 assert.throws(()=>validateMainRiders(addHealthRider(calculateLegacy(data,low),health,low)),/ไม่ครบ/);
 for(const extras of [{paEnabled:true,paPlan:4},{healthProduct:'dhealth',healthBenefit:'5000000',healthType:'none',healthOption:'ded0'},{careEnabled:true,careBenefit:'5000000',careCondition:'both',paEnabled:true,paPlan:4}]){
  const i={...input,frequency,...extras},r=addHealthRider(calculateLegacy(data,i),health,i);validateMainRiders(r);
  for(const row of r.schedule.slice(0,-1))assert.equal(row.coverage,50000);
  assert.equal(r.schedule.at(-2).age,98);assert.ok(r.schedule.at(-2).pay>0);assert.equal(r.schedule.at(-1).maturity,50000);
  assert.ok(legacySummary(r).includes('100% ของทุนประกัน 50,000'));
  const report=healthReportResult(r),parts=reportParts(template,report,'sum'),xml=parts['xl/worksheets/sheet1.xml'];
  assert.ok(xml.includes('50,000'));assert.ok(!xml.includes('101%'));assert.ok(!/undefined|NaN/.test(xml));
  const texts=[],c={scale(){},fillRect(){},fillText(t){texts.push(String(t))},measureText(t){return{width:String(t).length*4}},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
  const pages=reportPageLayouts(report);pages.forEach((p,n)=>drawPDFPage({getContext:()=>c},report,'sum',p,n,pages.length));
  assert.ok(texts.some(t=>t.includes('100% ของทุน')));assert.ok(!texts.some(t=>t.includes('101%')));
  if(extras.paPlan===4&&!extras.careEnabled)await fs.writeFile(path.join(os.tmpdir(),`wholelife50-${frequency}.xlsx`),new Uint8Array(await zipParts(parts).arrayBuffer()));
 }
}
console.log('PASS: fixed sum, source-rate anchors, 100% death/maturity, 5,000 threshold and combined riders across four payment modes; Excel/PDF benefits');
