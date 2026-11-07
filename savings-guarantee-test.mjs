import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculateSavings} from './dist/savings-calculator.mjs';
import {savingsReportData,savingsExcelParts,drawSavingsPDF} from './dist/savings-report.mjs';
const base={plan:'guaranteed',age:35,mode:'sum',amount:1e6};let cases=0;
for(let age=0;age<=80;age++)for(const gender of ['male','female']){
 const rate=age<=40?968:age<=60?988:age<=70?997:1000,r=calculateSavings({...base,age,gender,simulate:true,returnMode:'annual',annualReturn:5,fxStart:'',fxEnd:''});
 assert.equal(r.rate,rate);assert.equal(r.premium,rate*1000);assert.equal(r.totalPremium,rate*6000);assert.equal(r.cashTotal,840000);assert.equal(r.maturity,6060000);assert.equal(r.guaranteedTotal,6900000);
 assert.equal(r.indexBenefit,null);assert.equal(r.projectedTotal,null);assert.equal(r.assumedAnnualReturn,null);
 assert.equal(r.rows.length,16);assert.equal(r.rows[0].age,age);assert.equal(r.rows[0].year,0);assert.equal(r.rows.at(-1).age,age+15);
 assert.deepEqual(r.rows.filter(x=>x.premium).map(x=>x.year),[0,1,2,3,4,5]);
 assert.deepEqual(r.rows.filter(x=>x.cash).map(x=>x.year),Array.from({length:14},(_,i)=>i+1));
 r.rows.forEach((row,i)=>{assert.equal(row.paid,Math.min(i+1,6)*r.premium);assert.equal(row.life,i===15?null:Math.min(i+1,6)*1e6);assert.equal(row.cash,i>0&&i<15?60000:0);});
 const inverse=calculateSavings({...base,age,mode:'premium',amount:r.premium});assert.equal(inverse.sum,1e6);assert.equal(inverse.premium,r.premium);
 const report=savingsReportData(r,{gender});assert.equal(report.headers.length,5);assert.equal(report.rows.length,16);assert.ok(report.rows.every(x=>x.length===5));assert.equal(report.rows.at(-1)[3],6060000);assert.equal(report.rows.reduce((n,x)=>n+x[3],0),6900000);
 const parts=savingsExcelParts(r,{gender}),sheet=parts['xl/worksheets/sheet1.xml'];assert.ok(sheet.includes('15/6 การันตี'));assert.ok(parts['xl/workbook.xml'].includes('$A$1:$E$'));assert.ok(!sheet.includes('101%'));assert.ok(!sheet.includes('เงินปันผลหากได้ผลตอบแทน'));assert.ok(!sheet.includes('PR undefined'));
 report.rows.forEach((values,i)=>values.forEach((v,j)=>{if(v!==null)assert.ok(sheet.includes(`<c r="${'ABCDE'[j]}${13+i}" s="2" t="n"><v>${v}</v></c>`));}));
 cases++;
}
assert.throws(()=>calculateSavings({...base,frequency:'monthly'}));
for(const age of [-1,81,'',.5])assert.throws(()=>calculateSavings({...base,age}));for(const amount of [0,-1,NaN,Infinity])assert.throws(()=>calculateSavings({...base,amount}));
const r=calculateSavings(base),texts=[],ctx=new Proxy({measureText:s=>({width:String(s).length*4}),fillText:(s,x,y)=>{assert.ok(y<795||y===803||y===815);texts.push(String(s));}},{get:(t,k)=>k in t?t[k]:()=>{}});drawSavingsPDF({getContext:()=>ctx},r,{},1);assert.ok(texts.includes('6,060,000.00'));assert.ok(texts.includes('840,000.00 บาท'));assert.ok(texts.includes('6,900,000.00 บาท'));assert.ok(!texts.some(t=>t.includes('เงินปันผล')));
console.log(`PASS: ${cases} guaranteed15/6 age/sex quotes, four source rate bands, annual inverse, year0–5 premiums, yearly6%/14 refunds, 606% maturity, staircase coverage and all Excel cells/PDF totals`);
// Exercise plan switching and invalid-input recovery through the real Savings controller.
const html=fs.readFileSync('dist/savings.html','utf8'),nodes={};for(const [,id] of html.matchAll(/id="([^"]+)"/g))nodes[id]={value:'',checked:false,disabled:false,hidden:false,textContent:'original '+id,innerHTML:'',events:{},classList:{toggle(){}},setAttribute(){},addEventListener(t,fn){this.events[t]=fn;},replaceChildren(){this.innerHTML='';}};
Object.entries({plan:'standard',gender:'male',age:'35',amount:'1000000','return-mode':'annual','annual-return':'5','fx-start':'34','fx-end':'34'}).forEach(([id,value])=>nodes[id].value=value);nodes.simulate.checked=true;
const oldDoc=globalThis.document,oldWindow=globalThis.window;globalThis.document={getElementById:id=>nodes[id]};globalThis.window={addEventListener(){},print(){}};
try{await import('./dist/savings.mjs?guarantee-ui');const render=nodes['savings-form'].events.change;
 assert.equal(nodes['index-box'].hidden,false);assert.equal((nodes['schedule-body'].innerHTML.match(/<tr>/g)||[]).length,16);
 nodes.plan.value='guaranteed';nodes['fx-start'].value='';render();assert.equal(nodes.error.hidden,true);assert.equal(nodes['index-box'].hidden,true);assert.equal(nodes.simulate.disabled,true);assert.equal(nodes['dividend-column'].hidden,true);assert.ok(nodes.metrics.innerHTML.includes('6,900,000.00'));assert.ok(nodes.summary.value.includes('รวม 14 ครั้ง'));assert.ok(!nodes.summary.value.includes('PR'));assert.ok(!nodes.summary.value.includes('ดัชนี'));assert.equal((nodes['schedule-body'].innerHTML.match(/<td>/g)||[]).length,80);
 nodes.age.value='81';render();assert.equal(nodes.error.hidden,false);assert.equal(nodes.pdf.disabled,true);assert.equal(nodes['schedule-body'].innerHTML,'');nodes.age.value='0';render();assert.equal(nodes.error.hidden,true);assert.equal(nodes['days-field'].hidden,true);
 nodes.age.value='35';nodes.plan.value='pro';nodes['fx-start'].value='34';render();assert.equal(nodes.error.hidden,true);assert.equal(nodes['index-box'].hidden,false);assert.equal(nodes.simulate.disabled,false);assert.equal(nodes['dividend-column'].hidden,false);assert.ok(nodes.summary.value.includes('PR 100%'));assert.ok(nodes.metrics.innerHTML.includes('12,597,869.57'));assert.equal((nodes['schedule-body'].innerHTML.match(/<td>/g)||[]).length,96);
 assert.ok(!html.includes('savings-mobile-schedule'));assert.ok(!fs.readFileSync('dist/savings.css','utf8').includes('savings-desktop-schedule,.saving-scroll-hint{display:none}'));
 console.log('PASS: Savings real controller switches guaranteed/index plans, hides simulation/dividend, restores prior assumptions, age0 and invalid-age recovery; one shared table for all devices');
}finally{globalThis.document=oldDoc;globalThis.window=oldWindow;}
