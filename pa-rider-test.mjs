import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PA_PLANS,paAnnualPremium} from './dist/pa-easy.mjs';
import {calculateLegacy,legacySummary} from './dist/legacy-calculator.mjs';
import {reportParts,zipParts} from './dist/excel-export.mjs';
import {reportPageLayouts,drawPDFPage} from './dist/pdf-export.mjs';
const data=JSON.parse(await fs.readFile('dist/legacy-rates.json')),template=JSON.parse(await fs.readFile('dist/excel-template.json'));
for(const [age,plan,expected] of [[0,1,1300],[15,3,3000],[15,4,null],[16,4,5500],[60,7,21000],[61,7,null],[61,1,1600],[65,6,14200],[66,1,1900],[70,6,16500],[71,1,2500],[75,6,22700],[76,1,3050],[85,4,14950],[86,1,null],[76,5,null]])assert.equal(paAnnualPremium(age,plan),expected);
assert.deepEqual(PA_PLANS.map(p=>p.medical),[15000,25000,50000,100000,150000,200000,300000]);
assert.equal(paAnnualPremium(35,7,true),23000);assert.equal(paAnnualPremium(76,4,true),15350);
const baseInput={age:35,gender:'male',frequency:'annual',mode:'sum',amount:1000000};
const base=calculateLegacy(data,baseInput);assert.equal(base.rider,undefined);
for(const frequency of ['annual','semiannual','quarterly','monthly'])for(const id of [1,2,3,4,5,6,7])for(const holiday of [false,true]){
 const opts={...baseInput,frequency};const plain=calculateLegacy(data,opts),r=calculateLegacy(data,{...opts,paEnabled:true,paPlan:id,paOccupation:'2',paHoliday:holiday});
 assert.equal(r.rider.occupation,'1');assert.equal(r.rider.holiday,false);const factor={annual:1,semiannual:0.51,quarterly:0.26,monthly:0.088}[frequency];const modal=Math.round(paAnnualPremium(35,id,false)*factor*100)/100;assert.equal(r.rider.premium,modal);assert.equal(r.rider.annualPremium,Math.round(modal*plain.frequency.payments*100)/100);assert.equal(r.combinedFirstYearPremium,Math.round((plain.premium+modal)*100)/100);assert.equal(r.combinedFirstYearAnnual,plain.annualPaid+r.rider.annualPremium);
 assert.equal(r.sum,plain.sum);assert.equal(r.totalPaid,plain.totalPaid);assert.equal(r.maturityAmount,plain.maturityAmount);
 r.schedule.forEach((row,i)=>{assert.equal(row.coverage,plain.schedule[i].coverage);assert.equal(row.paid,plain.schedule[i].paid);const source=row.age>85?0:paAnnualPremium(row.age,id,false);const expected=source===null?null:Math.round(Math.round(source*factor*100)/100*plain.frequency.payments*100)/100;assert.equal(row.riderPremium,expected);});
 assert.deepEqual(reportPageLayouts(r).flatMap(p=>p.rows),r.schedule);
 assert.ok(legacySummary(r).includes(`PA Easy Plan Rider แผน ${id}`));
 const parts=reportParts(template,r,'sum'),xml=parts['xl/worksheets/sheet1.xml'];
 assert.ok(xml.includes('r="F10"'));assert.ok(xml.includes('ref="F10:G10"'));assert.ok(xml.includes('ref="A9:G9"'));assert.ok(parts['xl/workbook.xml'].includes('$G$'));assert.ok(!xml.includes('undefined'));
 assert.equal((xml.match(/<x:row r="11"[^>]*>(.*?)<\/x:row>/s)?.[1].match(/<x:c /g)||[]).length,6);
 const texts=[],ctx={scale(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},measureText(t){return {width:t.length*5};},fillText(t){texts.push(String(t));}};
 drawPDFPage({getContext:()=>ctx},r,'sum',reportPageLayouts(r)[0],0,reportPageLayouts(r).length,1);assert.ok(texts.includes('เบี้ยPA'));assert.ok(texts.some(t=>t.includes('เบี้ย PA ปีแรก')));
}
for(const patch of [{age:61,paPlan:7},{age:10,paPlan:4},{age:0,paAtLeast30Days:false}])assert.throws(()=>calculateLegacy(data,{...baseInput,paEnabled:true,paPlan:1,paOccupation:'1',...patch}));
assert.equal(calculateLegacy(data,{...baseInput,age:0,paEnabled:true,paPlan:1,paOccupation:'1',paAtLeast30Days:true}).rider.annualPremium,1300);
for(const id of [1,7]){
 const r=calculateLegacy(data,{...baseInput,paEnabled:true,paPlan:id,paOccupation:'1'});
 await fs.writeFile(path.join(os.tmpdir(),`pa-plan${id}.xlsx`),new Uint8Array(await zipParts(reportParts(template,r,'sum')).arrayBuffer()));
}
console.log('PASS: PA age bands, plan eligibility, fixed occupation 1 and infant checks, holiday rates, 56 payment combinations, unchanged main benefits, 7-column exports and PDF labels');
