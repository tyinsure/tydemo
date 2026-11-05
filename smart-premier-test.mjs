import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {calculateLegacyWealth,legacyWealthSummary} from './dist/legacy-wealth-calculator.mjs';
import {reportParts} from './dist/excel-export.mjs';
import {reportPageLayouts,drawPDFPage} from './dist/pdf-export.mjs';
import {schedulePremiumValues} from './dist/legacy-schedule-view.mjs';
import {elapsedYear} from './dist/elapsed-year.mjs';
const data=JSON.parse(await fs.readFile('dist/smart-protection9999-premier-rates.json'));
const template=JSON.parse(await fs.readFile('dist/excel-template.json'));
const base={age:35,gender:'male',mode:'sum',amount:1e7,frequency:'annual'};
// All four columns are explicit source-table cells, not the conflicting footer factors.
const anchors=[[0,[7.17,3.73,1.94,.645],[6.44,3.35,1.74,.580]],[35,[15.17,7.89,4.10,1.365],[12.91,6.71,3.49,1.162]],[43,[19.52,10.15,5.27,1.757],[16.49,8.57,4.45,1.484]],[44,[20.48,10.65,5.53,1.843],[17.29,8.99,4.67,1.556]],[63,[53.76,27.96,14.52,4.838],[44.64,23.21,12.05,4.018]],[70,[81,42.12,21.87,7.290],[67.77,35.24,18.30,6.099]],[80,[167.32,87.01,45.18,15.059],[143.88,74.82,38.85,12.949]]];
for(const [age,male,female] of anchors){assert.deepEqual(data.rates[age].male,male);assert.deepEqual(data.rates[age].female,female);}
assert.deepEqual(data.rates.map(x=>x.age),Array.from({length:81},(_,i)=>i));
let count=0;
for(const row of data.rates)for(const gender of ['male','female']){
 const [annual,semi,quarter,monthly]=row[gender],a=Math.round(annual*100);
 assert.equal(semi,Math.floor((a*52+50)/100)/100);assert.equal(quarter,Math.floor((a*27+50)/100)/100);assert.equal(monthly,Math.floor((a*90+50)/100)/1000);
 for(const f of data.frequencies){
  const r=calculateLegacyWealth(data,{...base,age:row.age,gender,frequency:f.id}),years=99-row.age;
  assert.equal(r.product,'smart9999premier');assert.equal(r.plan.label,'Smart Protection 99/99 (Premier)');assert.equal(r.payYears,years);assert.equal(r.schedule.length,years+1);
  assert.equal(r.premium,Math.round(row[gender][f.rateIndex]*1e6)/100);assert.equal(calculateLegacyWealth(data,{...base,age:row.age,gender,frequency:f.id,mode:'premium',amount:r.premium}).sum,1e7);
  assert.equal(r.schedule.filter(x=>x.pay>0).length,years);assert.equal(elapsedYear(r,r.schedule[0]),0);assert.equal(r.schedule.at(-2).age,98);assert.equal(elapsedYear(r,r.schedule.at(-2)),years-1);
  assert.equal(r.schedule.at(-1).age,99);assert.equal(r.schedule.at(-1).pay,0);assert.equal(r.schedule.at(-1).coverage,0);
  assert.equal(r.totalPaid,Math.round(r.annualPaid*years*100)/100);assert.equal(r.maturityAmount,Math.max(r.sum,Math.round(r.totalPaid*101)/100));assert.equal(r.schedule.at(-1).maturity,r.maturityAmount);
  for(const [i,x] of r.schedule.entries()){
   assert.equal(x.paid,Math.round(r.annualPaid*Math.min(i+1,years)*100)/100);
   if(x.age<99){assert.equal(x.pay,r.annualPaid);assert.equal(x.coverage,Math.max(r.sum,Math.round(x.paid*101)/100));}
  }
  assert.equal(schedulePremiumValues(r,r.schedule[0],'modal').total,r.premium);assert.equal(schedulePremiumValues(r,r.schedule[0],'annual').total,r.annualPaid);
  assert.deepEqual(reportPageLayouts(r).flatMap(x=>x.rows),r.schedule);
  const xml=reportParts(template,r,'sum')['xl/worksheets/sheet1.xml'];assert.ok(xml.includes('101%'));assert.ok(xml.includes(`ปีที่ 0–${years-1}`));assert.ok(!/NaN|undefined|บำนาญ|ชำระเบี้ยครั้งเดียว/.test(xml));
  for(const [i,x] of r.schedule.entries())for(const [j,v] of [x.age,x.pay,x.pay,x.coverage,x.maturity].entries())assert.match(xml,new RegExp(`<x:c r="${'ABCDE'[j]}${i+11}"[^>]*><x:v>${v}</x:v></x:c>`));
  count++;
 }
}
for(const input of [{age:''},{age:-1},{age:81},{age:1.5},{amount:9999999.99},{mode:'premium',amount:151699.99},{amount:0},{amount:NaN},{amount:Infinity},{amount:1e12+1},{gender:'other'},{mode:'other'},{frequency:'other'}])assert.throws(()=>calculateLegacyWealth(data,{...base,...input}));
const r=calculateLegacyWealth(data,{...base,age:80});assert.equal(r.payYears,19);assert.equal(r.totalPaid,31790800);assert.equal(r.maturityAmount,32108708);assert.ok(legacyWealthSummary(r).includes('19 ปี (ปีที่ 0–18)'));
const m=calculateLegacyWealth(data,{...base,frequency:'monthly'});assert.equal(m.premium,13650);assert.equal(m.maturityAmount,10588032);
for(const display of ['annual','modal']){
 const text=[],context=new Proxy({measureText:s=>({width:String(s).length*4}),fillText:s=>text.push(String(s))},{get:(t,k)=>k in t?t[k]:()=>{}}),canvas={getContext:()=>context};
 const p={...r,schedulePremiumDisplay:display},layouts=reportPageLayouts(p);for(const [i,l] of layouts.entries())drawPDFPage(canvas,p,'sum',l,i,layouts.length);
 assert.ok(text.includes('ปีที่ 0'));assert.ok(text.includes('ปีที่ 19'));assert.ok(text.includes('19 ปี'));assert.ok(text.includes('32,108,708.00'));assert.ok(text.some(x=>x.includes('ปีที่ 0–18')));assert.ok(!text.includes('ครั้งเดียว'));
}
console.log(`PASS: Smart Premier ${count} explicit rates/quotes, source anchors and conflicting-factor precedence, lifetime payments through98, age0, inverse quotes, minimum, 101% benefits, LINE and Excel/PDF`);
