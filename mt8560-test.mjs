import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {calculate,round2,pensionRanges} from './dist/calculator.mjs';
import {createCustomerSummary} from './dist/customer-summary.mjs';
import {reportParts} from './dist/excel-export.mjs';
const pv=[1396.19,1314.48,1230.31,1143.62,1054.33,962.36,867.63,770.06,669.56,566.05,459.43,349.62,236.50,120.00];
const plans=JSON.parse(await fs.readFile('dist/plans.json')),p=plans.find(p=>p.id==='mt8560_g15'),template=JSON.parse(await fs.readFile('dist/excel-template.json'));let count=0;
assert.deepEqual(pensionRanges(p),[{start:60,end:85,pct:.12}]);
for(const [age,sexes] of Object.entries(p.modalRates))for(let sex=0;sex<2;sex++)for(const [fi,frequency] of ['annual','semiannual','quarterly','monthly'].entries())for(const [t,amount] of [200000,400000,1000000,2000000].entries()){
 const input={planId:p.id,age:Number(age),gender:sex?'female':'male',frequency,mode:'sum',amount};const r=calculate(plans,input),source=sexes[sex][fi]-(fi===0?[0,1.25,2.5,3][t]:0);
 assert.ok(Math.abs(r.rate-source)<1e-8);assert.equal(r.premium,round2(source*amount/1000));assert.equal(r.annualPaid,round2(r.premium*[1,2,4,12][fi]));assert.equal(r.payYears,60-Number(age));assert.equal(r.totalPaid,round2(r.annualPaid*r.payYears));
 assert.equal(r.schedule.at(-1).age,85);assert.equal(r.schedule.length,86-Number(age));assert.equal(r.schedule.filter(s=>s.pay>0).length,r.payYears);assert.equal(r.schedule.filter(s=>s.pension>0).length,26);
 assert.equal(r.totalReceived,round2(amount*3.12));assert.equal(r.firstPension,round2(amount*.12));
 for(const row of r.schedule){assert.equal(row.coverage,row.age>=60?(row.age<=73?round2(amount/1000*pv[row.age-60]):null):round2(amount*(row.age<45?1:1+(row.age-44)*.1)));}
 const inv=calculate(plans,{...input,mode:'premium',amount:r.premium});assert.equal(inv.premium,r.premium);assert.ok(inv.sum>=r.sum-.02);assert.equal(inv.sum,round2(inv.premium*1000/inv.rate));count++;
}
const input={planId:p.id,age:35,gender:'male',mode:'sum',amount:1000000};const annual=calculate(plans,input),monthly=calculate(plans,{...input,frequency:'monthly'});
assert.equal(annual.premium,65810);assert.equal(monthly.premium,6011);assert.equal(monthly.totalPaid,1803300);assert.equal(annual.schedule.find(s=>s.age===44).coverage,1000000);assert.equal(annual.schedule.find(s=>s.age===45).coverage,1100000);assert.equal(annual.schedule.find(s=>s.age===59).coverage,2500000);
for(const [amount,t] of [[100000,0],[299999.99,0],[300000,1],[499999.99,1],[500000,2],[1499999.99,2],[1500000,3]])assert.equal(calculate(plans,{...input,amount}).tier,t);
for(const frequency of ['annual','semiannual','quarterly','monthly']){
 const r=calculate(plans,{...input,mode:'premium',frequency,amount:35000.12});assert.equal(r.premium,35000.12);const text=createCustomerSummary(r);assert.ok(text.includes('อายุ 60–85 ปี'));assert.ok(text.includes('อายุ 74–85 ปี: -'));assert.ok(!text.includes('105%'));assert.ok(!text.includes('อายุ 90'));assert.ok(!/undefined|NaN/.test(text));
 const xml=reportParts(template,r,'premium')['xl/worksheets/sheet1.xml'];assert.ok(xml.includes('อายุ 74–85 ปี: -'));assert.ok(xml.includes(`เบี้ย${r.frequency.label} (บาท/งวด)`));assert.ok(!xml.includes('105%'));
}
for(const patch of [{age:19},{age:56},{age:''},{amount:99999},{frequency:'bad'}])assert.throws(()=>calculate(plans,{...input,...patch}));
console.log(`PASS: ${count} 8560 age/sex/payment/tier cases, annual-only discounts, exact inverse premiums, 85-year end, 312% pension, attained-age coverage and G15 present values after pension with age 74–85 dashes`);
