import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculateSenior,seniorPAPremium,seniorDailyAnnual,seniorDailyPremium,seniorDailyOptions,seniorSummary,seniorPaymentViews,SENIOR_HEALTH_NOTE,SENIOR_PA_PLANS} from './dist/senior-calculator.mjs';
import {seniorPDFLayouts,seniorReportSections,createSeniorExcel} from './dist/senior-report.mjs';
const data=JSON.parse(fs.readFileSync(new URL('./dist/senior-rates.json',import.meta.url))),base={age:55,gender:'female',sum:500000,frequency:'annual',paEnabled:true,paPlan:5,dailyEnabled:false,daily:500};
const r=calculateSenior(data,base);
// Reproduce the supplied female age-55 / PA plan-5 example exactly.
assert.equal(r.annual,68920);assert.equal(r.pa.premium,3585);assert.equal(r.combinedPremium,72505);
assert.equal(r.schedule[1].illness,140596.8);assert.equal(r.schedule[1].combinedAccident,1640596.8);assert.equal(r.schedule[1].combinedPublic,3140596.8);
assert.equal(r.schedule[20].illness,750000);assert.equal(r.schedule[20].combinedAccident,1750000);assert.equal(r.schedule[20].combinedPublic,3500000);assert.equal(r.maturity,750000);
assert.equal(r.schedule[25].age,80);assert.equal(r.schedule[25].paPay,0);assert.equal(r.schedule.at(-1).age,99);assert.equal(r.schedule.at(-1).maturity,750000);
assert.equal(r.schedule.filter(x=>x.pay>0).length,10);assert.equal(r.taxLife,68205);
assert.equal(data.rates.length,31);assert.deepEqual(data.rates.map(r=>r.age),Array.from({length:31},(_,i)=>50+i));
for(const row of data.rates)for(const gender of ['male','female'])assert.ok(row[gender][0]>=row[gender][1]);
assert.equal(seniorPAPremium(60,4,'annual'),2995);assert.equal(seniorPAPremium(61,4,'annual'),3450);assert.equal(seniorPAPremium(66,5,'monthly'),488.7);assert.equal(seniorPAPremium(75,5,'annual'),7890);assert.equal(seniorPAPremium(76,5,'annual'),null);
assert.equal(seniorDailyAnnual(65,'male',500),1250);assert.equal(seniorDailyAnnual(66,'male',500),1845);assert.equal(seniorDailyAnnual(76,'female',1000),5380);assert.equal(seniorDailyAnnual(89,'female',2000),15660);assert.equal(seniorDailyAnnual(90,'female',500),null);
assert.deepEqual(seniorDailyOptions(100000),[500,1000]);assert.deepEqual(seniorDailyOptions(300000),[500,1000,1500,2000]);
// Source-4 plan 2 includes the 1,500 and 2,000 options, unlike plan 1.
assert.deepEqual(seniorDailyOptions(200000),[500,1000,1500,2000]);
for(const daily of [1500,2000])for(const frequency of ['annual','monthly']){
 const quote=calculateSenior(data,{...base,sum:200000,paPlan:2,dailyEnabled:true,daily,frequency});
 const healthPremium=daily===1500?(frequency==='annual'?3780:340):(frequency==='annual'?5040:454);
 assert.equal(quote.health.premium,healthPremium);
 assert.equal(quote.schedule[0].dailyPay,healthPremium*(frequency==='annual'?1:12));
 assert.equal(seniorReportSections(quote)[1].rows[0][4],quote.combinedAnnual);
 assert.equal(seniorPDFLayouts(quote,s=>s.length*4)[0].rows.length,quote.schedule.length);
 assert.ok(seniorSummary(quote).includes(`ชดเชยรายวัน ${daily.toLocaleString('th-TH',{minimumFractionDigits:2})} บาท`));
}
const health=calculateSenior(data,{...base,dailyEnabled:true,daily:2000});assert.equal(health.health.premium,5040);assert.equal(health.combinedAnnual,77545);
assert.equal(health.schedule.find(x=>x.age===89).dailyPay,15660);assert.equal(health.schedule.find(x=>x.age===90).dailyPay,0);
for(const gender of ['male','female'])for(let age=50;age<=80;age++)for(const sum of [100000,200000,300000,500000]){
 const result=calculateSenior(data,{...base,gender,age,sum,paEnabled:false});assert.ok(result.premium>0);assert.equal(result.schedule.length,100-age);assert.equal(result.schedule.at(-1).paid,result.totalPaid);
}
const oldest=calculateSenior(data,{...base,age:80,gender:'male',sum:100000,paEnabled:false});assert.equal(oldest.maturity,211372.8);assert.equal(oldest.schedule[9].illness,211372.8);
for(const input of [{age:49},{age:81},{age:''},{sum:400000},{sum:1000000},{frequency:'quarterly'},{age:76},{sum:100000},{dailyEnabled:true,daily:3000}])assert.throws(()=>calculateSenior(data,{...base,...input}));
const monthly=calculateSenior(data,{...base,frequency:'monthly'});
assert.equal(monthly.premium,6203);assert.equal(monthly.annual,74436);assert.equal(monthly.totalPaid,744360);assert.equal(monthly.maturity,751803.6);
assert.equal(monthly.pa.premium,322.65);assert.equal(monthly.combinedPremium,6525.65);assert.equal(monthly.combinedAnnual,78307.8);assert.equal(monthly.schedule[0].paPay,3871.8);assert.equal(monthly.schedule[0].total,78307.8);assert.equal(monthly.taxLife,73661.4);
assert.equal(monthly.schedule[1].illness,151849.44);assert.equal(monthly.schedule[10].pay,0);assert.equal(monthly.schedule.find(x=>x.age===76).paPay,0);
assert.match(seniorSummary(monthly),/6,525.65 บาท\/เดือน/);assert.match(seniorSummary(monthly),/78,307.80 บาท\/ปี/);
for(const row of data.rates)for(const gender of ['male','female'])for(const sum of [100000,200000,300000,500000]){
 const result=calculateSenior(data,{...base,age:row.age,gender,sum,paEnabled:false,frequency:'monthly'});
 assert.equal(result.premium,Math.round(row.monthly[gender]*sum/1000*100)/100);assert.equal(result.taxLife,Math.round(row[gender][1]*sum/1000*0.09*12*100)/100);assert.equal(result.annual,Math.round(result.premium*1200)/100);assert.equal(result.schedule.at(-1).paid,result.totalPaid);
}
assert.equal(calculateSenior(data,{...base,age:50,gender:'male',sum:100000,paEnabled:false,frequency:'monthly'}).premium,1230.8);
assert.equal(calculateSenior(data,{...base,age:80,gender:'female',sum:100000,paEnabled:false,frequency:'monthly'}).premium,1770);
assert.equal(seniorDailyPremium(50,'male',500,'monthly'),113); // 112.50 rounds up
assert.equal(seniorDailyPremium(50,'female',500,'monthly'),113); // 113.40 rounds down
assert.equal(seniorDailyAnnual(50,'male',101),253); // annual 252.50 rounds up
const monthlyHealth=calculateSenior(data,{...base,frequency:'monthly',dailyEnabled:true,daily:2000});
assert.equal(monthlyHealth.health.premium,454);assert.equal(monthlyHealth.combinedPremium,6979.65);assert.equal(monthlyHealth.combinedAnnual,83755.8);
assert.equal(monthlyHealth.schedule[0].dailyPay,5448);assert.equal(monthlyHealth.schedule[0].total,83755.8);
assert.equal(monthlyHealth.schedule.find(x=>x.age===89).dailyPay,16908);assert.equal(monthlyHealth.schedule.find(x=>x.age===90).dailyPay,0);
assert.equal(seniorDailyPremium(66,'female',500,'monthly'),168);assert.equal(seniorDailyPremium(90,'female',500,'monthly'),null);
assert.equal(monthlyHealth.totalPaid,monthly.totalPaid);assert.equal(monthlyHealth.maturity,monthly.maturity);
assert.match(seniorSummary(monthlyHealth),/6,979.65 บาท\/เดือน/);
assert.deepEqual(seniorPaymentViews(data,base).map(x=>x.total),[72505,6525.65]);
assert.equal(seniorPaymentViews(data,{...base,dailyEnabled:true,daily:2000})[1].total,6979.65);
for(const gender of ['male','female'])for(let age=50;age<=75;age++)for(const daily of [500,1000,1500,2000]){
 const annual=calculateSenior(data,{...base,age,gender,paEnabled:false,dailyEnabled:true,daily});
 const modal=calculateSenior(data,{...base,age,gender,paEnabled:false,dailyEnabled:true,daily,frequency:'monthly'});
 assert.equal(modal.health.premium,Math.round(annual.health.premium*0.09));
 assert.equal(modal.schedule[0].dailyPay,Math.round(modal.health.premium*1200)/100);
}
assert.match(seniorSummary(health),/77,545.00/);assert.equal(SENIOR_PA_PLANS.filter(p=>p.baseSum===500000).length,2);
const sections=seniorReportSections(health),layouts=seniorPDFLayouts(health,s=>s.length*6);
assert.deepEqual(sections[1].rows[0],[55,0,68920,8625,77545]);
assert.equal(sections[2].headers[1],'กรณีเสียชีวิต');assert.equal(sections[2].headers.length,4);
for(const quote of [r,health,monthlyHealth])for(let i=0;i<quote.schedule.length;i++){const row=quote.schedule[i],combined=seniorReportSections(quote)[1].rows[i];assert.equal(combined[3],Math.round((row.paPay+row.dailyPay)*100)/100);assert.equal(combined[4],row.total);}
assert.equal(layouts.reduce((n,p)=>n+p.rows.length,0),health.schedule.length);
for(const p of layouts)assert.ok(105+p.headerHeight+p.rows.reduce((n,r)=>n+r.height,0)+p.noteHeight<=745);
assert.equal(layouts.length,1);assert.equal(layouts[0].header.length,7);
assert.ok(layouts.every(p=>p.noteLines.join('').includes('ปีกรมธรรม์ที่ 1–2')&&p.noteLines.join('').includes('10 วันต่อปีกรมธรรม์')));
assert.equal(sections.length,4); // Excel still retains its original summary and notes.
const noHealthLayouts=seniorPDFLayouts(r,s=>s.length*5);assert.ok(noHealthLayouts.every(p=>p.noteLines.length===0&&p.noteHeight===0));
assert.ok(!seniorReportSections(r)[3].rows.some(row=>row[0]===SENIOR_HEALTH_NOTE));assert.ok(!seniorSummary(r).includes(SENIOR_HEALTH_NOTE));
assert.ok(seniorSummary(health).includes(SENIOR_HEALTH_NOTE));assert.equal(SENIOR_HEALTH_NOTE.split('\n').length,3);
assert.ok(layouts.every(p=>p.noteLines[0]==='สุขภาพวงเงินแน่นอน'));
const excel=await createSeniorExcel(health);assert.ok(excel.size>10000);assert.equal(excel.type,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
console.log('Senior: source example, all ages/sums/genders, rider bands/renewal limits, benefit floors, layouts and Excel passed.');
