import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {calculate} from './dist/calculator.mjs';
import {createCustomerSummary,copyPlainText} from './dist/customer-summary.mjs';
const plans=JSON.parse(await fs.readFile('dist/plans.json','utf8'));
for(const p of plans)for(const mode of ['sum','premium']){
 const r=calculate(plans,{planId:p.id,gender:'male',age:35,mode,amount:mode==='sum'?1000000:p.kind==='single_premium'?350000:42000});
 const text=createCustomerSummary(r);
 for(const age of [p.pensionAge,71,76,81,86].filter(age=>age<=(p.maturityAge??90))){
  const row=r.schedule.find(row=>row.age===age);
  assert.ok(text.includes(row.pension.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2})));
 }
 assert.ok(text.includes(p.kind==='single_premium'?'ชำระครั้งเดียว':`${r.payYears} ปี`));
 assert.ok(text.includes(p.family==='mt8560'?'110–250% ของทุน':'105% ของเบี้ยประกันที่ชำระสะสม'));
 assert.ok(!/undefined|NaN/.test(text));
 assert.ok(text.endsWith('https://line.me/R/ti/p/@tyinsure'));
}
assert.equal(createCustomerSummary(null),'');
let received;
assert.equal(await copyPlainText('ข้อความทดสอบ',{navigatorObject:{clipboard:{writeText:async t=>{received=t;}}}}),'clipboard');
assert.equal(received,'ข้อความทดสอบ');
let removed=false;
const doc={activeElement:{focus(){}},body:{appendChild(){}},createElement:()=>({style:{},setAttribute(){},focus(){},select(){},setSelectionRange(){},remove(){removed=true;}}),execCommand:()=>true};
assert.equal(await copyPlainText('ข้อความ',{navigatorObject:{clipboard:{writeText:async()=>{throw Error('denied');}}},documentObject:doc}),'legacy');
assert.ok(removed);
await assert.rejects(copyPlainText('ข้อความ',{navigatorObject:{},documentObject:{...doc,execCommand:()=>false}}));
console.log('PASS: customer summary for all 15 plans / both modes; clipboard API, fallback and blocked clipboard.');
