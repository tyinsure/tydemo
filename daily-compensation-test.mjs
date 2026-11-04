import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {dailyQuote,dailyBenefits,dailySummary} from './dist/daily-compensation.mjs';
import {calculateLegacy} from './dist/health-calculator.mjs';
import {addHealthRider,healthReportResult,validateMainRiders} from './dist/health-rider.mjs';
import {reportParts} from './dist/health-excel-export.mjs';
import {reportPageLayouts,drawPDFPage} from './dist/health-pdf-export.mjs';
const base=JSON.parse(await fs.readFile('dist/health-rates.json')),data=JSON.parse(await fs.readFile('dist/health-premiums.json')),template=JSON.parse(await fs.readFile('dist/excel-template.json'));
data.ci=JSON.parse(await fs.readFile('dist/ci-perfect-care-rates.json'));
const initial={mainPlan:'smart9999-large',age:35,gender:'male',mode:'sum',amount:1000000,frequency:'annual',dailyEnabled:true,dailyBenefit:500};
const freqs=['annual','semiannual','quarterly','monthly'];
// Table on PDF pages 4–6. In particular, age46+ monthly is 95 vs189,
// so the 1,000 benefit must never be inferred by doubling a rounded 500 rate.
const tables=[{min:16,max:35,rates:{500:[800,416,216,72],1000:[1600,832,432,144]}},{min:36,max:45,rates:{500:[900,468,243,81],1000:[1800,936,486,162]}},{min:46,max:64,rates:{500:[1050,546,284,95],1000:[2100,1092,567,189]}}];
let checks=0;
for(const band of tables)for(let age=band.min;age<=band.max;age++)for(const gender of ['male','female'])for(const dailyBenefit of [500,1000])for(const [index,frequency] of freqs.entries()){
 const quote=dailyQuote({...initial,age,gender,dailyBenefit,frequency});
 assert.equal(quote.premium,band.rates[dailyBenefit][index]);checks++;
}
for(const dailyBenefit of ['',0,100,3000,6000,8000,'abc'])assert.throws(()=>dailyQuote({...initial,dailyBenefit}));
for(const age of ['',15,65,-1,16.5])assert.throws(()=>dailyQuote({...initial,age}));
assert.deepEqual(dailyBenefits(500).map(b=>b.amount),[500,1000,1000,750]);assert.deepEqual(dailyBenefits(1000).map(b=>b.amount),[1000,2000,2000,1500]);
const calc=i=>addHealthRider(calculateLegacy(base,i),data,i);
for(const frequency of freqs)for(const dailyBenefit of [500,1000])for(const age of [35,36,45,46,64]){
 const i={...initial,age,frequency,dailyBenefit},r=calc(i),plain=calc({...i,dailyEnabled:false});
 validateMainRiders(r);assert.equal(r.totalPaid,plain.totalPaid);assert.equal(r.sum,plain.sum);assert.equal(r.maturityAmount,plain.maturityAmount);
 const expected=dailyQuote(i).premium*r.frequency.payments;
 assert.equal(r.daily.annual,expected);
 for(const row of r.schedule){assert.equal(row.dailyPremium,row.age<65?expected:0);assert.equal(row.totalPremium,row.pay+row.dailyPremium);}
 assert.equal(r.combinedFirstYearPremium,r.premium+r.daily.premium);
 const report=healthReportResult(r),parts=reportParts(template,report,'sum'),xml=parts['xl/worksheets/sheet1.xml'];
 assert.ok(xml.includes('ค่าชดเชยรายวัน'));assert.ok(xml.includes('บาท/วัน'));assert.ok(!/undefined|NaN/.test(xml));
 const layouts=reportPageLayouts(report);assert.equal(layouts.at(-1).kind,'daily');assert.deepEqual(layouts.flatMap(p=>p.rows),report.schedule);
 const texts=[],ctx={scale(){},fillRect(){},fillText(t){texts.push(String(t))},measureText(t){return {width:String(t).length*5}},beginPath(){},moveTo(){},lineTo(){},stroke(){}};
 layouts.forEach((p,j)=>drawPDFPage({getContext:()=>ctx},report,'sum',p,j,layouts.length,1));
 assert.ok(texts.some(t=>t.includes('คงที่')));assert.ok(texts.includes(dailyBenefit===500?'750.00 บาท/วัน':'1,500.00 บาท/วัน'));
 assert.ok(dailySummary(r.daily,r.frequency).includes('คงที่'));
}
for(const frequency of freqs)for(const health of [false,true])for(const care of [false,true])for(const ci of [false,true])for(const pa of [false,true]){
 const i={...initial,frequency,healthProduct:health?'dhealth':'',healthBenefit:'5000000',healthType:'none',careEnabled:care,careBenefit:'5000000',careCondition:'both',ciEnabled:ci,ciSum:1000000,paEnabled:pa,paPlan:2};
 const r=calc(i),without=calc({...i,dailyEnabled:false});
 assert.equal(r.combinedFirstYearPremium,Math.round(((without.combinedFirstYearPremium??without.premium)+r.daily.premium)*100)/100);
 assert.equal(r.schedule[0].totalPremium,without.schedule[0].totalPremium+r.daily.annual);
 assert.equal(healthReportResult(r).schedule[0].riderPremium,(healthReportResult(without).schedule[0].riderPremium??0)+r.daily.annual);
}
// HB is not a substitute for the pre-existing mandatory PA/critical-illness rules.
assert.throws(()=>validateMainRiders(calc({...initial,mainPlan:'smart9920'})),/อย่างน้อย 1 แผน/);
assert.throws(()=>validateMainRiders(calc({...initial,mainPlan:'smart9999-small',amount:100000})),/ต้องเลือกแผน PA/);
assert.doesNotThrow(()=>validateMainRiders(calc({...initial,mainPlan:'wholelife50000',amount:50000,ciEnabled:true,ciSum:1000000})));
assert.throws(()=>addHealthRider({...calculateLegacy(base,initial),sum:49999},data,initial),/50,000/);
console.log(`PASS: ${checks} HB PDF rate cases, only500/1000 benefits, ages16–64, fixed premiums until65, 64 rider/payment combinations, totals, reports and existing main-plan rules`);
