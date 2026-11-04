import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {calculate,round2} from './dist/calculator.mjs';
import {createCustomerSummary} from './dist/customer-summary.mjs';
const plans=JSON.parse(await fs.readFile('dist/plans.json')),news=plans.filter(p=>p.family==='pro901');
assert.equal(news.length,4);let count=0;
for(const p of news)for(const [age,tiers] of Object.entries(p.rates))for(let tier=0;tier<3;tier++)for(let sex=0;sex<2;sex++){
 const input={planId:p.id,age:Number(age),gender:sex?'female':'male',mode:'sum',amount:[75000,150000,1000000][tier]};
 const r=calculate(plans,input);assert.equal(r.rate,tiers[tier][sex]);assert.equal(r.premium,round2(input.amount*tiers[tier][sex]/1000));assert.equal(r.payYears,1);assert.equal(r.totalPaid,r.premium);assert.equal(r.schedule.filter(s=>s.pay>0).length,1);
 assert.equal(r.firstPension,input.amount*.30);assert.equal(r.totalReceived,round2(input.amount*({55:6,60:5.4,65:4.8,70:4.2}[p.pensionAge])));
 for(const s of r.schedule){const expected=s.age<p.pensionAge?0:s.age===p.pensionAge?.30:s.age<=70?.12:s.age<=75?.15:s.age<=80?.18:s.age<=85?.21:.24;assert.equal(s.pct,expected);assert.equal(s.coverage,s.age<p.pensionAge?round2(r.premium*1.05):Math.max(0,round2(r.premium-s.received)));}
 const inv=calculate(plans,{...input,mode:'premium',amount:r.premium});assert.equal(inv.premium,r.premium);assert.ok(inv.sum>=r.sum-.02);assert.equal(inv.sum,round2(inv.premium*1000/inv.rate));
 count++;
}
for(const p of news){
 const input={planId:p.id,age:35,gender:'male',mode:'sum'};
 for(const [amount,tier] of [[50000,0],[99999.99,0],[100000,1],[199999.99,1],[200000,2]])assert.equal(calculate(plans,{...input,amount}).tier,tier);
 assert.throws(()=>calculate(plans,{...input,amount:49999.99}),/50,000/);assert.throws(()=>calculate(plans,{...input,age:p.maxAge+1,amount:1000000}),/อายุ/);
 const r=calculate(plans,{...input,mode:'premium',amount:350000.12}),text=createCustomerSummary(r);assert.equal(r.premium,350000.12);assert.ok(text.includes('ชำระครั้งเดียว'));assert.ok(!text.includes('เบี้ยรายปี'));assert.ok(text.includes(`อายุ ${p.pensionAge} ปี: ปีละ`));assert.ok(!/undefined|NaN/.test(text));
 if(p.pensionAge===70){assert.ok(!text.includes('อายุ 70–70'));assert.equal(r.schedule.find(s=>s.age===71).pct,.15);}
}
console.log(`PASS: ${count} new source-rate cases, single payment, exact input premium, 3 tier boundaries, four pension totals (600/540/480/420%), 30% first pension, age limits and LINE summary`);
