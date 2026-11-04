import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculateSenior,seniorPaymentViews,seniorDailyOptions,seniorSummary,seniorNotes,SENIOR_HEALTH_NOTE} from './dist/senior-calculator.mjs';
import {seniorBenefitRows,seniorReportSections,seniorPDFLayouts,createSeniorExcel} from './dist/senior-report.mjs';
const data=JSON.parse(fs.readFileSync('dist/senior90-rates.json')),old=JSON.parse(fs.readFileSync('dist/senior-rates.json'));
const base={age:50,gender:'male',sum:100000,frequency:'annual',paEnabled:true,paPlan:1,dailyEnabled:true,daily:500};
const r=calculateSenior(data,base),m=calculateSenior(data,{...base,frequency:'monthly'});
assert.equal(r.productName,'วัยเก๋าคุ้มสุขใจ');assert.equal(r.payYears,40);assert.equal(r.maturityAge,90);assert.equal(r.taxLife,null);
assert.equal(r.premium,5300);assert.equal(r.totalPaid,212000);assert.equal(r.maturity,100000);assert.equal(r.combinedPremium,7770);
assert.equal(m.premium,477);assert.equal(m.health.premium,113);assert.equal(m.pa.premium,109.8);assert.equal(m.combinedPremium,699.8);assert.equal(m.combinedAnnual,8397.6);assert.equal(m.totalPaid,228960);
assert.equal(r.schedule[0].illness,5406);assert.equal(r.schedule[1].illness,10812);assert.equal(r.schedule[0].combinedAccident,205406);assert.equal(r.schedule[0].combinedPublic,405406);
assert.equal(r.schedule[2].illness,100000);assert.equal(r.schedule[2].accident,100000);assert.equal(r.schedule[2].publicAccident,200000);
assert.equal(r.schedule.find(x=>x.age===75).paPay,2435);assert.equal(r.schedule.find(x=>x.age===76).paPay,0);
assert.equal(m.schedule.find(x=>x.age===89).dailyPay,4176);assert.equal(r.schedule.at(-1).age,90);assert.equal(r.schedule.at(-1).total,0);assert.equal(r.schedule.at(-1).maturity,100000);
assert.equal(r.pa.icuMaxDays,7);assert.deepEqual(seniorDailyOptions(100000,'senior90'),[500,1000,1500,2000]);assert.deepEqual(seniorDailyOptions(100000),[500,1000]);
const last=calculateSenior(data,{...base,age:75,gender:'female',sum:500000,paPlan:5,daily:2000,frequency:'monthly'});
assert.equal(last.premium,5580);assert.equal(last.totalPaid,1004400);assert.equal(last.maturity,500000);assert.equal(last.health.premium,805);assert.equal(last.combinedPremium,7095.1);
assert.throws(()=>calculateSenior(data,{...base,age:76}),/50–75/);assert.throws(()=>calculateSenior(data,{...base,age:49}));
assert.throws(()=>calculateSenior(data,{...base,frequency:'quarterly'}));
assert.equal(data.rates.length,26);
for(const row of data.rates)for(const gender of ['male','female'])for(const sum of [100000,200000,300000,500000])for(const frequency of ['annual','monthly']){
 const quote=calculateSenior(data,{...base,age:row.age,gender,sum,frequency,paEnabled:false,dailyEnabled:false});
 assert.equal(quote.premium,Math.round(sum*(frequency==='annual'?row[gender][0]:row.monthly[gender])/10)/100);
 assert.equal(quote.schedule.length,91-row.age);assert.equal(quote.schedule.filter(x=>x.pay>0).length,90-row.age);assert.equal(quote.schedule.at(-1).maturity,sum);
 assert.equal(quote.schedule[2].illness,sum);assert.equal(quote.schedule.at(-2).illness,sum);
}
assert.deepEqual(seniorPaymentViews(data,base).map(x=>x.total),[7770,699.8]);
assert.match(seniorSummary(r),/วัยเก๋าคุ้มสุขใจ/);assert.match(seniorSummary(r),/คุ้มครองถึงอายุ 90 ปี/);assert.ok(!seniorSummary(r).includes('99 ปี'));
assert.ok(seniorNotes(r).some(x=>x.includes('7 วัน')));assert.ok(seniorNotes(r).includes(SENIOR_HEALTH_NOTE));
const rows=seniorBenefitRows(r);assert.ok(rows.some(x=>String(x).includes('100% ของทุน')));assert.ok(!rows.some(x=>String(x).includes('150%')));assert.ok(rows.some(x=>String(x).includes('ICU สูงสุด 7 วัน')));
for(const quote of [r,m,last]){
 const sections=seniorReportSections(quote),pages=seniorPDFLayouts(quote,s=>s.length*5);
 assert.equal(pages.reduce((n,p)=>n+p.rows.length,0),quote.schedule.length);
 assert.ok(pages.every(p=>105+p.headerHeight+p.rows.reduce((n,r)=>n+r.height,0)+p.noteHeight<=745));
 assert.equal(pages.length,1);assert.equal(sections[1].rows.at(-1)[0],90);assert.ok((await createSeniorExcel(quote)).size>10000);
}
assert.equal(calculateSenior(old,{...base,age:80,paEnabled:false,dailyEnabled:false}).maturityAge,99);
console.log('PASS: 90/90 exact modal rates, all ages/sexes/sums, pay-through-90, early death/100% maturity, shared riders/ICU cap, notes and exports; 99/10 preserved.');
