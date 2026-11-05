import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculateLegacy} from './dist/legacy-calculator.mjs';
import {calculatePremierLegacy} from './dist/premier-legacy-calculator.mjs';
import {calculateLegacyWealth} from './dist/legacy-wealth-calculator.mjs';
import {calculateSenior} from './dist/senior-calculator.mjs';
import {drawPDFPage,reportPageLayouts} from './dist/pdf-export.mjs';
import {reportParts} from './dist/excel-export.mjs';
import {seniorReportSections,seniorPDFLayouts,drawSeniorPDFPage,seniorExcelParts} from './dist/senior-report.mjs';
const read=n=>JSON.parse(fs.readFileSync(`dist/${n}.json`)),template=read('excel-template'),money=n=>n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
const base={age:35,gender:'male',mode:'sum',amount:1e7,frequency:'annual',premierAtLeast30Days:true};
function capture(draw){const text=[];const ctx=new Proxy({measureText:s=>({width:String(s).length*4}),fillText:s=>text.push(String(s))},{get:(t,k)=>k in t?t[k]:()=>{}});draw({getContext:()=>ctx});return text;}
let cases=0;
for(const [name,calc] of [['legacy-rates',calculateLegacy],['premier-legacy-rates',calculatePremierLegacy],['legacy-wealth-rates',calculateLegacyWealth],['premier-legacy995-rates',calculateLegacyWealth],['premier-legacy9910-rates',calculateLegacyWealth],['smart-protection9999-premier-rates',calculateLegacyWealth]]){
 const data=read(name);
 for(const frequency of data.frequencies){
 const input={...base,frequency:frequency.id,...(name==='legacy-rates'?{amount:1e6,paEnabled:true,paPlan:1}:{})},r=calc(data,input);
 const expected=r.schedule.map((x,i)=>Math.round(r.annualPaid*Math.min(i+1,r.payYears)*100)/100);
 assert.deepEqual(r.schedule.map(x=>x.paid),expected);
 for(const display of ['annual','modal']){
 const flagged={...r,schedulePremiumDisplay:display,legacyCumulativeMain:true},layouts=reportPageLayouts(flagged);
 for(const [i,page] of layouts.entries()){
 const texts=capture(canvas=>drawPDFPage(canvas,flagged,'sum',page,i,layouts.length));
 assert.ok(texts.includes('เบี้ยประกันหลักสะสม'));assert.ok(!texts.includes('เบี้ยประกันรวม'));
 for(const row of page.rows)assert.ok(texts.includes(money(row.paid)));
 }
 const xml=reportParts(template,flagged,'sum')['xl/worksheets/sheet1.xml'];assert.ok(xml.includes('เบี้ยประกันหลักสะสม'));
 r.schedule.forEach((row,i)=>assert.match(xml,new RegExp(`<x:c r="${r.rider?'D':'C'}${i+11}"[^>]*><x:v>${row.paid}</x:v></x:c>`)));
 cases++;
 }
 if(r.rider){const other=calc(data,{...input,paPlan:2});assert.deepEqual(other.schedule.map(x=>x.paid),r.schedule.map(x=>x.paid));assert.notEqual(other.rider.annualPremium,r.rider.annualPremium);}
 }
}
for(const name of ['senior-rates','senior90-rates'])for(const frequency of ['annual','monthly']){
 const r=calculateSenior(read(name),{age:55,gender:'female',sum:500000,frequency,paEnabled:true,paPlan:5,dailyEnabled:true,daily:500}),flagged={...r,legacyCumulativeMain:true};
 const section=seniorReportSections(flagged)[1];assert.ok(section.headers.includes('เบี้ยประกันหลักสะสม (บาท)'));
 section.rows.forEach((row,i)=>assert.equal(row[4],r.schedule[i].paid));
 assert.notEqual(section.rows[0][4],seniorReportSections(r)[1].rows[0][4]);
 const excel=Object.values(seniorExcelParts(flagged)).join('');assert.ok(excel.includes('เบี้ยประกันหลักสะสม'));
 for(const display of ['annual','modal']){const report={...flagged,schedulePremiumDisplay:display},pages=seniorPDFLayouts(report,s=>s.length*4);
 for(const [i,page] of pages.entries()){const text=capture(canvas=>drawSeniorPDFPage(canvas,report,page,i,pages.length));assert.ok(text.includes('หลักสะสม'));}
 cases++;}
}
const missing=calculateLegacy(read('legacy-rates'),{...base,age:60,amount:1e6,frequency:'monthly',paEnabled:true,paPlan:7});assert.equal(missing.schedule[1].riderPremium,null);assert.ok(missing.schedule[1].paid>0);
console.log(`PASS: ${cases} Legacy cumulative-main PDF/Excel views, all payment durations, PA exclusion, senior riders and missing PA rates`);
