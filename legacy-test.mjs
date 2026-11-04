import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {calculateLegacy} from './dist/legacy-calculator.mjs';
import {reportParts,zipParts} from './dist/excel-export.mjs';
import {reportPageLayouts} from './dist/pdf-export.mjs';
const data=JSON.parse(await fs.readFile('dist/legacy-rates.json'));
const template=JSON.parse(await fs.readFile('dist/excel-template.json'));
let checked=0;
for(const row of data.rates)for(const gender of ['male','female'])for(const f of data.frequencies){
 const rate=row[gender][f.rateIndex],p={age:row.age,gender,frequency:f.id,mode:'sum',amount:1000000};
 const r=calculateLegacy(data,p);
 assert.equal(r.premium,Math.round(rate*100000)/100);
 assert.ok(Math.abs(r.schedule.reduce((a,v)=>a+v.pay,0)-r.totalPaid)<.01);
 assert.equal(r.schedule.at(-1).age,99);assert.equal(r.schedule.at(-1).maturity,r.sum);
 assert.equal(r.schedule.at(-1).coverage,0);assert.equal(r.schedule.at(-1).paid,r.totalPaid);
 assert.equal(r.schedule[0].paid,r.annualPaid);assert.equal(r.schedule[19].paid,r.totalPaid);
 for(const s of r.schedule.slice(0,-1))assert.equal(s.coverage,Math.max(r.sum,s.paid));
 const inverted=calculateLegacy(data,{...p,mode:'premium',amount:r.premium});assert.equal(inverted.sum,r.sum);
 assert.deepEqual(reportPageLayouts(r).flatMap(p=>p.rows),r.schedule);
 const annualCents=Math.round(row[gender][0]*100),prec=f.id==='monthly'?1000:100;
 const factor=[1,.51,.26,.088][f.rateIndex];
 assert.ok(Math.abs(rate-Math.round(annualCents/100*factor*prec+1e-8)/prec)<1e-8);
 checked++;
}
for(const mode of ['annual','semiannual','quarterly','monthly']){
 const r=calculateLegacy(data,{age:35,gender:'male',frequency:mode,mode:'premium',amount:10000});
 const parts=reportParts(template,r,'premium'),xml=parts['xl/worksheets/sheet1.xml'];
 assert.ok(!/บำนาญ|105%|undefined|NaN/.test(xml));
 assert.ok(xml.includes('สรุปแผนสร้างมรดก'));
 r.schedule.forEach((item,i)=>{[item.age,item.pay,item.paid,item.coverage,item.maturity].forEach((v,j)=>{
  const ref='ABCDEF'[j]+(i+11);assert.ok(xml.match(new RegExp(`<x:c r="${ref}"[^>]*>(.*?)</x:c>`,'s'))?.[1].includes(`<x:v>${v}</x:v>`));
 });});
 await fs.writeFile(path.join(os.tmpdir(),`legacy-${mode}.xlsx`),new Uint8Array(await zipParts(parts).arrayBuffer()));
}
for(const age of ['',-1,71,1.5])assert.throws(()=>calculateLegacy(data,{age,gender:'male',frequency:'annual',mode:'sum',amount:1e6}));
for(const amount of ['',0,-1,Infinity,'abc'])assert.throws(()=>calculateLegacy(data,{age:35,gender:'male',frequency:'annual',mode:'sum',amount}));
console.log(`PASS: ${checked} source rates and modal factors; inverse premiums; complete payment/coverage/maturity schedules; 4 XLSX exports; invalid inputs`);
