import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {calculate,round2} from './dist/calculator.mjs';
const plans=JSON.parse(await fs.readFile(new URL('./dist/plans.json',import.meta.url),'utf8'));
assert.equal(plans.length,15);let checks=0;
for(const plan of plans.filter(p=>p.kind!=='single_premium'&&p.family!=='mt8560'))for(const [age,rows] of Object.entries(plan.rates))for(let t=0;t<rows.length;t++)for(let sex=0;sex<2;sex++){
 const amount=plan.kind==='five_years'?1000000:[200000,400000,750000,1500000][t];
 const inp={age:Number(age),gender:sex===0?'male':'female',planId:plan.id,mode:'sum',amount};
 const r=calculate(plans,inp);
 assert.equal(r.rate,rows[t][sex]);assert.equal(r.premium,round2(rows[t][sex]*amount/1000));
 assert.equal(r.payYears,plan.kind==='five_years'?5:plan.pensionAge-Number(age));
 assert.equal(r.schedule[0].age,Number(age));assert.equal(r.schedule.at(-1).age,90);
 assert.equal(r.schedule.filter(row=>row.pay>0).length,r.payYears);
 assert.equal(r.totalReceived,round2(amount*[5.82,5.22,4.62][[55,60,65].indexOf(plan.pensionAge)]));
 const inv=calculate(plans,{...inp,mode:'premium',amount:r.premium});
 assert.equal(inv.premium,r.premium);assert.ok(inv.sum>=amount-.02);
 const chosen=round2(inv.premium*1000/inv.rate);assert.equal(inv.sum,chosen);
 checks++;
}
const example=calculate(plans,{planId:'p4',age:35,gender:'male',mode:'premium',amount:42000});
assert.equal(example.sum,301572.49);assert.equal(example.premium,42000);
assert.equal(example.schedule[0].coverage,44100);
assert.throws(()=>calculate(plans,{planId:'p6',age:61,gender:'male',mode:'sum',amount:1000000}),/อายุ/);
assert.throws(()=>calculate(plans,{planId:'p4',age:35,gender:'male',mode:'sum',amount:99999}),/100,000/);
assert.throws(()=>calculate(plans,{planId:'p4',age:35,gender:'male',mode:'premium',amount:1}),/ขั้นต่ำ/);
assert.throws(()=>calculate(plans,{planId:'p1',age:35,gender:'male',mode:'premium',amount:0}),/มากกว่า 0/);
console.log(`PASS: ${checks} rate combinations, forward/reverse calculations, pension totals, coverage and validation.`);
