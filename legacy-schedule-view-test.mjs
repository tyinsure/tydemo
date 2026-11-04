import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculateLegacy} from './dist/legacy-calculator.mjs';
import {schedulePremiumUnit,schedulePremiumValues} from './dist/legacy-schedule-view.mjs';
import {drawPDFPage,reportPageLayouts} from './dist/pdf-export.mjs';
const data=JSON.parse(fs.readFileSync('dist/legacy-rates.json'));
let cases=0;
for(const frequency of ['annual','semiannual','quarterly','monthly'])for(const gender of ['male','female'])for(const age of [35,60,70]){
 const r=calculateLegacy(data,{age,gender,amount:1000000,mode:'sum',frequency,paEnabled:true,paPlan:1});
 const before=JSON.stringify(r);
 for(const display of ['annual','modal']){
  const unit=schedulePremiumUnit(r,display),first=schedulePremiumValues(r,r.schedule[0],display);
  assert.equal(first.main,display==='modal'?r.premium:r.annualPaid);
  assert.equal(first.rider,display==='modal'?r.rider.premium:r.rider.annualPremium);
  for(const row of r.schedule){
   const values=schedulePremiumValues(r,row,display);
   assert.equal(values.total,Math.round((values.main+values.rider)*100)/100);
   if(row.policyYear>20)assert.equal(values.main,0);
   if(row.age>85)assert.equal(values.rider,0);
  }
  const report={...r,schedulePremiumDisplay:display},layouts=reportPageLayouts(report);
  for(const [index,layout] of layouts.entries()){
   const text=[],ctx={scale(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},measureText(t){return {width:String(t).length*4};},fillText(t){text.push(String(t));}};
   drawPDFPage({getContext:()=>ctx},report,'sum',layout,index,layouts.length,1);
   assert.ok(text.includes(`(บาท/${unit})`));assert.ok(text.includes('เบี้ยประกันรวม'));
   for(const row of layout.rows){
    const values=schedulePremiumValues(r,row,display),m=n=>n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
    assert.ok(text.includes(m(values.total)));
    if(row.coverage)assert.ok(text.includes(m(row.coverage)));
   }
  }
  cases++;
 }
 assert.equal(JSON.stringify(r),before);
}
const r=calculateLegacy(data,{age:60,gender:'male',amount:1000000,mode:'sum',frequency:'monthly',paEnabled:true,paPlan:7});
assert.equal(schedulePremiumValues(r,r.schedule.find(x=>x.age===61),'modal').total,null);
assert.equal(schedulePremiumValues(r,r.schedule.find(x=>x.age===61),'annual').total,null);
console.log(`PASS: ${cases} Legacy schedule/PDF views, actual modal premiums, yearly totals, payment/rider end ages, missing rates and unchanged benefits.`);
