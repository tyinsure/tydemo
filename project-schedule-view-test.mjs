import assert from 'node:assert/strict';
import fs from 'node:fs';
import {scheduleUnit,scheduleViewRow,scheduleViewResult} from './dist/schedule-premium-view.mjs';
import {calculate} from './dist/calculator.mjs';
import {calculateLegacy} from './dist/health-calculator.mjs';
import {addHealthRider,healthReportResult} from './dist/health-rider.mjs';
import {calculateSenior} from './dist/senior-calculator.mjs';
import {seniorPDFLayouts} from './dist/senior-report.mjs';
import {drawPDFPage as pensionPDF,reportPageLayouts as pensionPages} from './dist/pdf-export.mjs';
import {drawPDFPage as healthPDF,reportPageLayouts as healthPages} from './dist/health-pdf-export.mjs';
const read=n=>JSON.parse(fs.readFileSync('dist/'+n));
const premiumKeys=new Set(['pay','riderPremium','healthPremium','dailyPremium','carePremium','ciPremium','totalPremium','paPay','dailyPay','total']);
const m=n=>n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
let cases=0;
function check(r,pdf,pages){
 const before=JSON.stringify(r),count=r.frequency?.payments??r.payments??1;
 for(const display of ['annual','modal']){
  const view=scheduleViewResult(r,display);
  for(let i=0;i<r.schedule.length;i++){
   const original=r.schedule[i],row=view.schedule[i];
   for(const key of Object.keys(original)){
    if(display==='modal'&&premiumKeys.has(key)&&typeof original[key]==='number')assert.equal(row[key],Math.round((original[key]/count+Number.EPSILON)*100)/100);
    else assert.deepEqual(row[key],original[key],key);
   }
  }
  assert.equal(view.totalPaid,r.totalPaid);
  if(pdf){
   const text=[],ctx={scale(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},measureText(t){return {width:String(t).length*4};},fillText(t){text.push(String(t));}};
   const layout=pages(view)[0];pdf({getContext:()=>ctx},view,'sum',layout,0,pages(view).length,1);
   if(r.plan.kind!=='single_premium')assert.ok(text.includes(`(บาท/${scheduleUnit(r,display)})`));
   assert.ok(text.includes(m(view.schedule[0].pay)));
  }
  cases++;
 }
 assert.equal(JSON.stringify(r),before);
}
for(const p of read('plans.json'))for(const gender of ['male','female'])for(const frequency of p.family==='mt8560'?['annual','semiannual','quarterly','monthly']:['annual']){
 const r=calculate(read('plans.json'),{planId:p.id,gender,age:35,amount:1000000,mode:'sum',frequency});
 check(r,pensionPDF,pensionPages);
 const modal=scheduleViewRow(r,r.schedule[0],'modal');assert.equal(modal.pay,r.premium);
}
const data=read('health-rates.json'),rates=read('health-premiums.json');rates.ci=read('ci-perfect-care-rates.json');
for(const mainPlan of ['smart9920','smart9999-small','smart9999-large','wholelife50000'])for(const frequency of ['annual','semiannual','quarterly','monthly']){
 const input={mainPlan,age:35,gender:'male',amount:mainPlan==='wholelife50000'?50000:mainPlan==='smart9999-small'?100000:1000000,mode:'sum',frequency,paEnabled:true,paPlan:2,healthProduct:'elite',healthPlan:1,healthArea:0,careEnabled:true,careBenefit:5000000,careCondition:'both',ciEnabled:true,ciSum:1000000,dailyEnabled:true,dailyBenefit:500};
 const r=addHealthRider(calculateLegacy(data,input),rates,input),report=healthReportResult(r);
 const first=scheduleViewResult(report,'modal').schedule[0];
 assert.equal(first.pay,r.premium);assert.equal(first.riderPremium,report.rider.premium);assert.equal(first.totalPremium,r.combinedFirstYearPremium);
 check(report,healthPDF,healthPages);
}
for(const file of ['senior-rates.json','senior90-rates.json'])for(const age of [50,55,75])for(const gender of ['male','female'])for(const frequency of ['annual','monthly']){
 const r=calculateSenior(read(file),{age,gender,frequency,sum:500000,paEnabled:true,paPlan:5,dailyEnabled:true,daily:2000});check(r);
 const first=scheduleViewRow(r,r.schedule[0],'modal');assert.equal(first.pay,r.premium);assert.equal(first.paPay,r.pa.premium);assert.equal(first.dailyPay,r.health.premium);assert.equal(first.total,r.combinedPremium);
 const layout=seniorPDFLayouts({...r,schedulePremiumDisplay:'modal'},s=>s.length*4)[0];assert.equal(layout.rows[0].lines[1][0],m(r.premium));assert.equal(layout.rows[0].lines[3][0],m(r.combinedPremium));assert.ok(layout.header.flat().join('').includes('บาท/'+r.unit));assert.equal(layout.rows.length,r.schedule.length);
}
assert.equal(scheduleViewRow({payments:12},{pay:0,totalPremium:null,coverage:100000},'modal').totalPremium,null);
assert.equal(fs.readFileSync('dist/index.html','utf8'),fs.readFileSync('dist/insure_retire.html','utf8'));
console.log(`PASS: ${cases} project schedule/PDF views, 15 pension plans, 4 Health main plans, both senior plans, actual modal premiums, null rates and unchanged benefits.`);
