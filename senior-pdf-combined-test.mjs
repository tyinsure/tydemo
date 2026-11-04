import fs from 'node:fs';
import assert from 'node:assert/strict';
import {calculateSenior,seniorDailyOptions,seniorMoney} from './dist/senior-calculator.mjs';
import {seniorPDFLayouts} from './dist/senior-report.mjs';
const measure=s=>[...s].reduce((n,c)=>n+(/[0-9]/.test(c)?4.3:c===' '?2:4.2),0);
let cases=0;
for(const file of ['senior-rates.json','senior90-rates.json']){
 const data=JSON.parse(fs.readFileSync('dist/'+file));
 for(const {age} of data.rates)for(const gender of ['male','female'])for(const sum of [100000,500000])for(const frequency of ['annual','monthly'])for(let riders=0;riders<4;riders++){
  if(age>75&&riders)continue;
  const r=calculateSenior(data,{age,gender,sum,frequency,paEnabled:!!(riders&1),paPlan:sum===500000?5:1,dailyEnabled:!!(riders&2),daily:seniorDailyOptions(sum,data.product).at(-1)});
  const pages=seniorPDFLayouts(r,measure);assert.equal(pages.length,1);const p=pages[0];
  assert.equal(p.rows.length,r.schedule.length);assert.equal(p.widths.length,7);assert.ok(p.fontSize>=8.5);
  assert.ok(105+p.headerHeight+p.rows.reduce((n,x)=>n+x.height,0)+p.noteHeight<=745);
  assert.equal(p.noteLines.length,r.health?3:0);
  for(let i=0;i<r.schedule.length;i++){
   const row=r.schedule[i],values=[String(row.age),seniorMoney(row.pay),seniorMoney(Math.round((row.paPay+row.dailyPay)*100)/100),seniorMoney(row.total),seniorMoney(row.illness),seniorMoney(row.combinedAccident),seniorMoney(row.maturity)];
   assert.deepEqual(p.rows[i].lines.map(x=>x[0]),values);
   values.forEach((text,j)=>assert.ok(measure(text)<=p.widths[j]-8));
  }
  assert.equal(p.rows[0].lines[0][0],String(age));assert.equal(p.rows.at(-1).lines[0][0],String(r.maturityAge));cases++;
 }
}
console.log(`PASS: ${cases} combined senior A4 layouts, one page, complete ages and numeric cells, minimum font size, note visibility and column fit.`);
