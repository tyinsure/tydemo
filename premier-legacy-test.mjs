import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {calculatePremierLegacy,premierLegacySummary} from './dist/premier-legacy-calculator.mjs';
import {reportParts} from './dist/excel-export.mjs';
import {reportPageLayouts,drawPDFPage} from './dist/pdf-export.mjs';
import {elapsedYear} from './dist/elapsed-year.mjs';
const data=JSON.parse(await fs.readFile('dist/premier-legacy-rates.json'));
const template=JSON.parse(await fs.readFile('dist/excel-template.json'));
const base={age:35,gender:'male',mode:'sum',amount:1e7,frequency:'annual',premierAtLeast30Days:true};
// Independently read anchors from the supplied table: infant, working ages and oldest entry.
for(const [age,male,female] of [[0,94.30,75.55],[1,96.56,77.34],[20,177.17,143.60],[35,276.97,234.19],[50,430.84,379.30],[65,645.40,595.77],[70,725.11,681.16],[80,869.18,842.04]]){
 for(const [gender,rate] of [['male',male],['female',female]])assert.equal(calculatePremierLegacy(data,{...base,age,gender}).premium,Math.round(rate*10000));
}
assert.equal(data.rates.length,81);assert.deepEqual(data.rates.map(x=>x.age),Array.from({length:81},(_,i)=>i));
let count=0;
for(const age of data.rates.map(x=>x.age))for(const gender of ['male','female']){
 const r=calculatePremierLegacy(data,{...base,age,gender});
 assert.equal(r.schedule.length,100-age);assert.equal(r.payYears,1);assert.equal(r.totalPaid,r.premium);assert.equal(r.schedule[0].pay,r.premium);
 assert.equal(r.schedule.filter(x=>x.pay>0).length,1);assert.equal(elapsedYear(r,r.schedule[0]),0);
 assert.equal(r.schedule.at(-1).age,99);assert.equal(r.schedule.at(-1).maturity,1e7);assert.equal(r.schedule.at(-1).coverage,0);
 assert.ok(r.schedule.slice(0,-1).every(x=>x.coverage===1e7&&x.paid===r.premium));
 assert.equal(calculatePremierLegacy(data,{...base,age,gender,mode:'premium',amount:r.premium}).sum,1e7);
 assert.deepEqual(reportPageLayouts(r).flatMap(p=>p.rows),r.schedule);
 const xml=reportParts(template,r,'sum')['xl/worksheets/sheet1.xml'];
 assert.ok(xml.includes('101%'));assert.ok(xml.includes('ปีที่ 0'));assert.ok(!/บำนาญ|20 ปี|NaN|undefined/.test(xml));
 for(const [i,x] of r.schedule.entries())for(const [j,v] of [x.age,x.pay,x.pay,x.coverage,x.maturity].entries())assert.match(xml,new RegExp(`<x:c r="${'ABCDE'[j]}${11+i}"[^>]*><x:v>${v}</x:v></x:c>`));
 count++;
}
for(const input of [{age:''},{age:-1},{age:81},{age:1.5},{age:0,premierAtLeast30Days:false},{amount:9999999.99},{amount:0},{amount:NaN},{amount:Infinity},{amount:1e12+1},{frequency:'monthly'},{frequency:'quarterly'},{frequency:'semiannual'},{mode:'other'},{gender:'other'},{mode:'premium',amount:2769699.99}])assert.throws(()=>calculatePremierLegacy(data,{...base,...input}));
// Exercise the 101% branch using a synthetic rate, without adding it to the source rate table.
const higher={...data,rates:[{age:35,male:[1000]}]},rHigh=calculatePremierLegacy(higher,base);
assert.equal(rHigh.initialCoverage,10100000);assert.equal(rHigh.maturityAmount,10100000);
const r=calculatePremierLegacy(data,base),summary=premierLegacySummary(r);
assert.match(summary,/ชำระครั้งเดียว/);assert.match(summary,/101%/);assert.match(summary,/ปีที่ 0/);assert.ok(!summary.includes('PA'));
const text=[],context=new Proxy({measureText:s=>({width:String(s).length*4}),fillText:s=>text.push(String(s))},{get:(t,k)=>k in t?t[k]:()=>{}}),canvas={getContext:()=>context};
for(const [i,layout] of reportPageLayouts(r).entries())drawPDFPage(canvas,r,'sum',layout,i,reportPageLayouts(r).length);
assert.ok(text.includes('ปีที่ 0'));assert.ok(text.includes('ปีที่ 64'));assert.ok(text.includes('ครั้งเดียว'));assert.ok(text.some(s=>s.includes('101%')));assert.ok(text.includes('เบี้ยประกันรวม'));assert.ok(!text.includes('เบี้ยสะสม'));
console.log(`PASS: Premier Legacy ${count} age/sex quotes, image anchors, inverse quotes, minimum/annual/30-day limits, single year0 payment, 101% death/maturity, LINE and numeric Excel/PDF schedules`);
