import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {calculateLegacyWealth,legacyWealthSummary} from './dist/legacy-wealth-calculator.mjs';
import {reportParts} from './dist/excel-export.mjs';
import {drawPDFPage,reportPageLayouts} from './dist/pdf-export.mjs';
import {schedulePremiumValues} from './dist/legacy-schedule-view.mjs';
import {elapsedYear} from './dist/elapsed-year.mjs';
const data=JSON.parse(await fs.readFile('dist/premier-legacy995-rates.json'));
const template=JSON.parse(await fs.readFile('dist/excel-template.json'));
const base={age:35,gender:'male',mode:'sum',amount:1e7,frequency:'annual'};
const anchors=[[0,22.90,18.62],[19,42.62,34.53],[20,43.83,35.33],[29,54.72,42.68],[30,54.90,44.29],[35,63.47,52.13],[38,70.05,57.92],[44,81.81,69.40],[50,97.27,84.41],[60,127.05,114.26],[68,152.08,137.33],[70,158.83,143.66]];
for(const [age,male,female] of anchors)for(const [gender,rate] of [['male',male],['female',female]])assert.equal(calculateLegacyWealth(data,{...base,age,gender}).premium,Math.round(rate*10000));
assert.deepEqual(data.rates.map(x=>x.age),Array.from({length:71},(_,i)=>i));
let cases=0;
for(const row of data.rates)for(const gender of ['male','female']){
 const [annual,semi,quarter,month]=row[gender],cents=Math.round(annual*100);
 assert.equal(semi,Math.floor((cents*51+50)/100)/100);assert.equal(quarter,Math.floor((cents*26+50)/100)/100);assert.equal(month,Math.floor((cents*88+50)/100)/1000);
 for(const frequency of data.frequencies){
  const r=calculateLegacyWealth(data,{...base,age:row.age,gender,frequency:frequency.id});
  assert.equal(r.premium,Math.round(row[gender][frequency.rateIndex]*1e6)/100);
  assert.equal(calculateLegacyWealth(data,{...base,age:row.age,gender,frequency:frequency.id,mode:'premium',amount:r.premium}).sum,1e7);
  assert.equal(r.schedule.length,100-row.age);assert.equal(r.schedule.filter(x=>x.pay>0).length,5);assert.equal(elapsedYear(r,r.schedule[0]),0);assert.equal(elapsedYear(r,r.schedule[4]),4);
  assert.equal(r.schedule[5].pay,0);assert.equal(r.totalPaid,r.annualPaid*5);assert.equal(r.schedule.at(-1).age,99);assert.equal(r.schedule.at(-1).maturity,1e7);assert.equal(r.schedule.at(-1).coverage,0);
  for(const x of r.schedule){assert.equal(x.paid,Math.round(r.annualPaid*Math.min(x.age-r.age+1,5)*100)/100);if(x.age<99)assert.equal(x.coverage,Math.max(r.sum,Math.round(x.paid*101)/100));}
  assert.equal(schedulePremiumValues(r,r.schedule[0],'modal').total,r.premium);assert.equal(schedulePremiumValues(r,r.schedule[0],'annual').total,r.annualPaid);
  assert.deepEqual(reportPageLayouts(r).flatMap(x=>x.rows),r.schedule);
  const xml=reportParts(template,r,'sum')['xl/worksheets/sheet1.xml'];assert.ok(xml.includes('101%'));assert.ok(xml.includes('ปีที่ 0–4'));assert.ok(!/NaN|undefined|บำนาญ|ชำระเบี้ยครั้งเดียว/.test(xml));
  for(const [i,x] of r.schedule.entries())for(const [j,v] of [x.age,x.pay,x.pay,x.coverage,x.maturity].entries())assert.match(xml,new RegExp(`<x:c r="${'ABCDE'[j]}${i+11}"[^>]*><x:v>${v}</x:v></x:c>`));
  cases++;
 }
}
for(const input of [{age:''},{age:-1},{age:71},{age:0.5},{amount:9999999.99},{mode:'premium',amount:634699.99},{amount:0},{amount:NaN},{amount:Infinity},{amount:1e12+1},{gender:'other'},{mode:'other'},{frequency:'other'}])assert.throws(()=>calculateLegacyWealth(data,{...base,...input}));
assert.equal(calculateLegacyWealth(data,{...base,age:0}).premium,229000);assert.equal(calculateLegacyWealth(data,base).product,'premier995');assert.equal(calculateLegacyWealth(data,base).plan.label,'Premier Legacy 99/5'); // 30-day source row maps directly to age0.
const r=calculateLegacyWealth({...data,rates:[{age:35,male:[250]}]},base);assert.equal(r.schedule[0].coverage,1e7);assert.equal(r.schedule[3].coverage,10100000);assert.equal(r.schedule[4].coverage,12625000);assert.equal(r.maturityAmount,12625000);
const normal=calculateLegacyWealth(data,{...base,frequency:'monthly'});assert.match(legacyWealthSummary(normal),/5 ปี \(ปีที่ 0–4\)/);assert.match(legacyWealthSummary(normal),/101%/);
for(const display of ['annual','modal']){
 const text=[],context=new Proxy({measureText:s=>({width:String(s).length*4}),fillText:s=>text.push(String(s))},{get:(t,k)=>k in t?t[k]:()=>{}}),canvas={getContext:()=>context};
 const r={...normal,schedulePremiumDisplay:display},layouts=reportPageLayouts(r);for(const [i,l] of layouts.entries())drawPDFPage(canvas,r,'sum',l,i,layouts.length);
 assert.ok(text.includes('ปีที่ 0'));assert.ok(text.includes('ปีที่ 64'));assert.ok(text.includes('5 ปี'));assert.ok(!text.includes('ครั้งเดียว'));assert.ok(text.includes('เบี้ยประกันรวม'));assert.ok(text.some(x=>x.includes('101%')));assert.ok(text.includes((display==='modal'?55850:670200).toLocaleString('th-TH',{minimumFractionDigits:2})));
}
console.log(`PASS: Premier Legacy99/5 Standard Class ${cases} age/sex/frequency quotes, image anchors, decimal modal rounding, age0 mapping, minimum sums, year0–4 payments, 101% benefits, LINE, all Excel cells and both PDF views`);
