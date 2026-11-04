import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {healthQuote,addHealthRider,healthReportResult} from './dist/health-rider.mjs';
import {calculateLegacy} from './dist/health-calculator.mjs';
import {reportParts} from './dist/health-excel-export.mjs';
import {reportPageLayouts,drawPDFPage} from './dist/health-pdf-export.mjs';
const d=JSON.parse(await fs.readFile('dist/health-premiums.json')),base=JSON.parse(await fs.readFile('dist/health-rates.json')),template=JSON.parse(await fs.readFile('dist/excel-template.json'));let cells=0;
for(const [benefit,freqs] of Object.entries(d.dhealth))for(const [frequency,rows] of Object.entries(freqs))for(const row of rows)for(const age of [row.min,row.max])for(const [i,value] of row.values.entries()){
 const options=benefit==='1000000'?['ded0','ded20000','ded50000','copay20','copay10']:['ded0','ded30000','ded50000','ded100000','copay20','copay10'];const healthOption=options[Math.floor(i/2)];
 assert.equal(healthQuote(d,{healthProduct:'dhealth',healthBenefit:benefit,frequency,age,gender:i%2?'female':'male',healthType:healthOption==='ded0'?'none':healthOption.startsWith('copay')?'copay':'deductible',healthOption}).premium,value);cells++;
}
for(const [frequency,ages] of Object.entries(d.elite))for(const [age,values] of Object.entries(ages))for(const [i,value] of values.entries())for(const gender of ['male','female']){assert.equal(healthQuote(d,{healthProduct:'elite',frequency,age:Number(age),gender,healthPlan:Math.floor(i/4)+1,healthArea:i%4}).premium,value);cells++;}
const input={age:35,gender:'male',amount:1000000,mode:'sum',frequency:'annual',healthProduct:'dhealth',healthBenefit:'5000000',healthType:'none',healthOption:'ded0'};
let r=addHealthRider(calculateLegacy(base,input),d,input);assert.equal(r.health.premium,16714);assert.equal(r.combinedFirstYearPremium,42694);assert.equal(r.schedule.find(x=>x.age===36).healthPremium,18106);assert.equal(r.schedule.at(-1).healthPremium,0);
const monthly={...input,frequency:'monthly',paEnabled:true,paPlan:1,paOccupation:'1'};r=addHealthRider(calculateLegacy(base,monthly),d,monthly);assert.equal(r.health.premium,1504);assert.equal(r.combinedFirstYearPremium,Math.round((r.premium+1504+114.4)*100)/100);
for(const patch of [{healthProduct:'dhealth'},{healthProduct:'elite',healthPlan:4,healthArea:3},{healthProduct:''}])for(const paEnabled of [false,true]){
 const i={...input,...patch,paEnabled,paPlan:1,paOccupation:'1'},x=addHealthRider(calculateLegacy(base,i),d,i),report=healthReportResult(x),xml=reportParts(template,report,'sum')['xl/worksheets/sheet1.xml'];
 assert.ok(!/undefined|NaN/.test(xml));if(x.health)assert.ok(xml.includes(String(x.schedule[0].healthPremium+(x.schedule[0].riderPremium??0))));
 const texts=[];const c={scale(){},fillRect(){},fillText(t){texts.push(String(t))},measureText(t){return {width:String(t).length*5}},beginPath(){},moveTo(){},lineTo(){},stroke(){}};const canvas={getContext(){return c}};
 const layouts=reportPageLayouts(report);layouts.forEach((layout,j)=>drawPDFPage(canvas,report,'sum',layout,j,layouts.length));assert.ok(!texts.some(t=>/undefined|NaN/.test(t)));
}
assert.equal(healthQuote(d,{...input,age:5}).premium,null);assert.throws(()=>addHealthRider(calculateLegacy(base,{...input,age:5}),d,{...input,age:5}));assert.equal(healthQuote(d,{...input,healthProduct:'elite',healthPlan:1,healthArea:0,age:10}).premium,null);
console.log(`PASS: ${cells} rate lookups, band edges, missing rates, modal rates, PA totals, health tables and Excel/PDF report content`);

// PA ends in the supplied projection at 85; health and Care rates continue.
for(const frequency of ['annual','semiannual','quarterly','monthly']){
 const i={...input,frequency,paEnabled:true,paPlan:1,careEnabled:true,careBenefit:'5000000',careCondition:'both'};
 const x=addHealthRider(calculateLegacy(base,i),d,i),report=healthReportResult(x);
 for(const age of [85,86,90,91,98,99]){
  const row=x.schedule.find(r=>r.age===age),out=report.schedule.find(r=>r.age===age);
  assert.equal(row.riderPremium,age>85?0:row.riderPremium);
  assert.ok(Number.isFinite(row.totalPremium));
  assert.equal(out.riderPremium,row.riderPremium+row.healthPremium+row.carePremium);
  assert.equal(row.totalPremium,row.pay+out.riderPremium);
 }
 const xml=reportParts(template,report,'sum')['xl/worksheets/sheet1.xml'];
 assert.ok(!xml.includes('ไม่มีอัตรา</t>'));
}
// Missing rates within the PA table must still remain missing, never zero.
const missing=calculateLegacy(base,{...input,paEnabled:true,paPlan:5});
assert.equal(missing.schedule.find(r=>r.age===76).riderPremium,null);
console.log('PASS: PA age 85/86 boundary, health/Care through 98, maturity 99, four payment frequencies and Excel numeric cells');
for(const frequency of ['annual','semiannual','quarterly','monthly']){
 const i={...input,mainPlan:'smart9999-large',age:80,frequency,careEnabled:true,careBenefit:5000000,careCondition:'both'};
 const accepted=addHealthRider(calculateLegacy(base,i),d,i);assert.ok(accepted.care);assert.ok(accepted.schedule.find(row=>row.age===81).carePremium>0);assert.ok(accepted.schedule.find(row=>row.age===98).carePremium>0);
 const over={...i,age:81};assert.throws(()=>addHealthRider(calculateLegacy(base,over),d,over),/ไม่เกิน 80 ปี/);
 assert.equal(addHealthRider(calculateLegacy(base,over),d,{...over,careEnabled:false}).care,undefined);
}
console.log('PASS: Care Plus entry age 80 accepted, 81 rejected in all modes, existing policies renew beyond 80 through 98');
