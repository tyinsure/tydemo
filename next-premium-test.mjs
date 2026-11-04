import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {calculate,round2} from './dist/calculator.mjs';
import {createCustomerSummary} from './dist/customer-summary.mjs';
const plans=JSON.parse(await fs.readFile('dist/plans.json')),news=plans.filter(p=>p.family==='next901');assert.equal(news.length,4);let count=0;
for(const p of news)for(const [age,tiers] of Object.entries(p.rates))for(let t=0;t<3;t++)for(let sex=0;sex<2;sex++){
 const input={planId:p.id,age:Number(age),gender:sex?'female':'male',mode:'sum',amount:[75000,150000,1000000][t]};const r=calculate(plans,input);
 assert.equal(r.rate,tiers[t][sex]);assert.equal(r.premium,round2(input.amount*tiers[t][sex]/1000));assert.equal(r.payYears,1);assert.equal(r.totalPaid,r.premium);assert.equal(r.schedule.filter(s=>s.pay>0).length,1);
 assert.equal(r.firstPension,input.amount*.12);assert.equal(r.totalReceived,round2(input.amount*({55:5.82,60:5.22,65:4.62,70:4.02}[p.pensionAge])));
 for(const row of r.schedule){const pct=row.age<p.pensionAge?0:row.age<=70?.12:row.age<=75?.15:row.age<=80?.18:row.age<=85?.21:.24;assert.equal(row.pct,pct);assert.equal(row.coverage,row.age<p.pensionAge?round2(r.premium*1.05):Math.max(0,round2(r.premium-row.received)));}
 const inv=calculate(plans,{...input,mode:'premium',amount:r.premium});assert.equal(inv.premium,r.premium);assert.ok(inv.sum>=r.sum-.02);assert.equal(inv.sum,round2(inv.premium*1000/inv.rate));count++;
}
for(const p of news){const input={planId:p.id,age:35,gender:'male',mode:'sum'};
 for(const [amount,tier] of [[50000,0],[99999.99,0],[100000,1],[199999.99,1],[200000,2]])assert.equal(calculate(plans,{...input,amount}).tier,tier);
 assert.throws(()=>calculate(plans,{...input,amount:49999.99}),/50,000/);assert.throws(()=>calculate(plans,{...input,age:p.maxAge+1,amount:1000000}),/อายุ/);
 const r=calculate(plans,{...input,mode:'premium',amount:350000.12}),text=createCustomerSummary(r);assert.equal(r.premium,350000.12);assert.ok(text.includes('ชำระครั้งเดียว'));assert.ok(!text.includes('เบี้ยรายปี'));assert.ok(!/NaN|undefined/.test(text));
}
const a=calculate(plans,{planId:'next901_70',age:65,gender:'female',mode:'sum',amount:1000000});assert.equal(a.premium,2836500);assert.equal(a.schedule.find(s=>s.age===70).pension,120000);assert.equal(a.schedule.find(s=>s.age===71).pension,150000);assert.equal(a.totalReceived,4020000);
console.log(`PASS: ${count} Next source-rate cases, 12% first pension, 582/522/462/402% totals, exact input premiums, age/tier boundaries, coverage and summary`);
