import assert from 'node:assert/strict';
import fs from 'node:fs';
import {healthComparison,healthComparisonTable,comparisonCoverageRows} from './dist/health-comparison.mjs';
import {calculateLegacy} from './dist/health-calculator.mjs';
import {addHealthRider} from './dist/health-rider.mjs';
const read=n=>JSON.parse(fs.readFileSync('dist/'+n)),data=read('health-rates.json'),rates=read('health-premiums.json');rates.ci=read('ci-perfect-care-rates.json');
const base={mainPlan:'smart9920',age:32,gender:'male',amount:500000,mode:'sum',frequency:'monthly',paEnabled:true,paPlan:2,healthProduct:'dhealth',healthBenefit:5000000,healthType:'none',healthOption:'ded0',healthPlan:1,healthArea:0,extraPlan:3,careEnabled:false};
assert.deepEqual(healthComparison(data,rates,base).columns.map(p=>p.prices.total),[4142,2984,2745,2694,2455]);
let cases=0;
for(const age of [11,32,55,65])for(const gender of ['male','female'])for(const frequency of ['annual','semiannual','quarterly','monthly'])for(const mode of ['sum','premium'])for(const all of [false,true]){
 const i={...base,age,gender,frequency,mode,amount:mode==='sum'?500000:3000,ciEnabled:all,ciSum:500000,opdType:all?'per-visit':'',opdBenefit:500,dailyEnabled:all&&age>=16&&age<65,dailyBenefit:500};
 if(mode==='premium')i.amount=calculateLegacy(data,{...i,mode:'sum',amount:500000}).premium;
 const before=JSON.stringify(i),main=calculateLegacy(data,i),c=healthComparison(data,rates,i);assert.equal(JSON.stringify(i),before);assert.equal(c.columns.length,5);
 for(const col of c.columns){
  assert.equal(col.error,undefined);const direct={...i,healthProduct:col.healthProduct,healthPlan:1,healthArea:0,extraPlan:3,careEnabled:col.care,careCondition:'both',careBenefit:5000000};
  const expected=addHealthRider(main,rates,direct);assert.equal(col.prices.total,expected.combinedFirstYearPremium);assert.equal(col.prices.health,expected.health.premium);assert.equal(col.prices.care,expected.care?.premium??0);assert.equal(col.result.sum,main.sum);assert.equal(col.prices.pa,main.rider.premium);assert.equal(col.prices.main,main.premium);
  const sum=col.prices.main+col.prices.health+col.prices.care+col.prices.pa+col.prices.other;assert.equal(col.prices.total,Math.round(sum*100)/100);
 }
 const html=healthComparisonTable(c);assert.ok(!html.includes('NaN'));assert.ok(html.includes('บาท/'+{annual:'ปี',semiannual:'6เดือน',quarterly:'3เดือน',monthly:'เดือน'}[frequency]));assert.ok(html.includes('8,000 บาท/วัน'));cases++;
}
// Each optional rider gets its own selected-only row, with mode-specific premiums.
for(const frequency of ['annual','semiannual','quarterly','monthly'])for(let mask=0;mask<8;mask++){
 const c=healthComparison(data,rates,{...base,frequency,opdType:mask&1?'lump':'',opdBenefit:15000,dailyEnabled:!!(mask&2),dailyBenefit:500,ciEnabled:!!(mask&4),ciSum:500000});
 const html=healthComparisonTable(c);
 assert.equal(c.selectedRiderRows.length,Number(!!(mask&1))+Number(!!(mask&2))+Number(!!(mask&4)));
 for(const [key,bit,label] of [['opd',1,'เบี้ย OPD เหมาจ่าย'],['daily',2,'เบี้ยค่าชดเชยรายวัน'],['ci',4,'เบี้ยซีไอ เพอร์เฟค แคร์']]){
  assert.equal(html.includes('<th scope="row">'+label+'</th>'),!!(mask&bit));
  for(const p of c.columns)assert.equal(p.prices[key],p.result[key]?.premium??0);
 }
 assert.ok(!html.includes('เบี้ย OPD / ชดเชย / CI ที่เลือก'));
}
const excluded=healthComparison(data,rates,{...base,opdType:'lump',opdBenefit:15000,dailyEnabled:true,dailyBenefit:500,ciEnabled:true,ciSum:500000},{includeOtherRiders:false});
assert.deepEqual(excluded.selectedRiderRows,[]);
assert.ok(excluded.columns.every(p=>p.prices.other===0));
for(const [benefit,types] of [[1000000,[['none','ded0'],['deductible','ded20000'],['deductible','ded50000'],['copay','copay10'],['copay','copay20']]],[5000000,[['none','ded0'],['deductible','ded30000'],['deductible','ded50000'],['deductible','ded100000'],['copay','copay10'],['copay','copay20']]]])for(const [type,option] of types){
 const i={...base,healthBenefit:benefit,healthType:type,healthOption:option},c=healthComparison(data,rates,i);
 for(const col of c.columns.filter(p=>p.healthProduct==='dhealth')){assert.equal(col.error,undefined);assert.equal(col.result.health.benefit,benefit);assert.ok(col.label.includes(benefit/1000000+'ล้าน'));assert.equal(col.result.health.deductibleOption,option);}
 const room=comparisonCoverageRows(c).find(r=>r.label.startsWith('1.'));assert.ok(room.values[2].includes(benefit===1000000?'2,000':'4,000'));
}
const young=healthComparison(data,rates,{...base,age:10});assert.ok(young.columns[0].error.includes('ไม่มีอัตรา'));assert.ok(young.columns[3].error.includes('11–90'));assert.ok(young.columns[4].error.includes('11–90'));assert.ok(healthComparisonTable(young).includes('—'));
for(const age of [80,81]){
 const older=healthComparison(data,rates,{...base,mainPlan:'smart9999-large',age,paEnabled:false});
 for(const col of older.columns.filter(p=>p.care))if(age===80)assert.ok(col.prices);else {assert.ok(col.error.includes('ไม่เกิน 80 ปี'));assert.equal(col.prices,undefined);}
 for(const col of older.columns.filter(p=>!p.care))assert.ok(col.prices);
}
const noPA=healthComparison(data,rates,{...base,paEnabled:false});assert.ok(noPA.columns[0].error);assert.ok(!noPA.columns[1].error);assert.ok(noPA.columns[2].error);assert.ok(!noPA.columns[3].error);assert.ok(noPA.columns[4].error);
const withoutCare=healthComparison(data,rates,{...base,careEnabled:true,careBenefit:1000000,careCondition:'kidney'});assert.equal(withoutCare.columns[0].result.care,undefined);assert.equal(withoutCare.columns[2].result.care,undefined);assert.equal(withoutCare.columns[1].result.care.benefit,5000000);assert.equal(withoutCare.columns[1].result.care.condition,'both');
assert.throws(()=>healthComparison(data,rates,{...base,age:''}),/อายุ/);
// UI: location, live metadata/total changes, deductible selection, invalid input clearing and recovery.
const html=fs.readFileSync('dist/health.html','utf8');assert.ok(html.indexOf('class="legacy-journey card"')<html.indexOf('id="health-comparison"'));assert.ok(html.indexOf('id="health-comparison"')<html.indexOf('class="schedule-section card"'));
const nodes={};for(const [,id] of html.matchAll(/id="([^"]+)"/g))nodes[id]={value:'',checked:false,disabled:false,hidden:false,textContent:'',innerHTML:'',events:{},classList:{toggle(){},remove(){},add(){}},addEventListener(t,fn){this.events[t]=fn;},replaceChildren(){this.innerHTML='';},remove(){},options:[],setAttribute(){}};
nodes.age.value='32';nodes.amount.value='500000';nodes.frequency.value='monthly';nodes['main-plan'].value='smart9920';nodes['pa-plan'].value='2';nodes['pa-plan'].options=Array.from({length:7},(_,i)=>({value:String(i+1)}));nodes['health-benefit'].value='5000000';nodes['health-type'].value='none';nodes['health-option'].value='ded0';nodes['health-plan'].value='1';nodes['health-area'].value='0';
const radio={value:'male',addEventListener(){}},oldDocument=globalThis.document,oldFetch=globalThis.fetch;globalThis.document={getElementById:id=>nodes[id],querySelector:()=>radio,querySelectorAll:()=>[radio],body:{classList:{toggle(){}}}};globalThis.fetch=async url=>({ok:true,json:async()=>String(url).includes('health-premiums')?rates:data});
try{
 await import('./dist/health.mjs?comparison-test');nodes['pa-enabled'].checked=true;nodes['pa-enabled'].events.change();
 assert.ok(nodes['health-comparison-context'].textContent.includes('อายุ 32 ปี'));assert.ok(nodes['health-comparison-context'].textContent.includes('500,000'));const male=nodes['health-comparison-content'].innerHTML;
 radio.value='female';nodes.frequency.events.change();assert.ok(nodes['health-comparison-context'].textContent.startsWith('หญิง'));assert.notEqual(nodes['health-comparison-content'].innerHTML,male);
 nodes.frequency.value='annual';nodes.frequency.events.change();assert.ok(nodes['health-comparison-content'].innerHTML.includes('บาท/ปี'));
 nodes['health-product'].value='dhealth';nodes['health-product'].events.change();nodes['health-option'].value='copay20';nodes['health-option'].events.change();assert.ok(nodes['health-comparison-content'].innerHTML.includes('ส่วนร่วมจ่าย 20%'));
 nodes['health-benefit'].value='1000000';nodes['health-benefit'].events.change();nodes['health-option'].value='ded20000';nodes['health-option'].events.change();assert.ok(nodes['health-comparison-content'].innerHTML.includes('D Health Lite 1ล้าน'));assert.ok(nodes['health-comparison-content'].innerHTML.includes('ความรับผิดส่วนแรก 20,000'));
 nodes.age.value='';nodes.age.events.input();assert.equal(nodes['health-comparison-content'].innerHTML,'');nodes.age.value='32';nodes.age.events.input();assert.ok(nodes['health-comparison-content'].innerHTML.includes('<table'));
 nodes.amount.value='0';nodes.amount.events.input();assert.equal(nodes['health-comparison-content'].innerHTML,'');nodes.amount.value='500000';nodes.amount.events.input();assert.ok(nodes['health-comparison-content'].innerHTML.includes('<table'));
}finally{globalThis.document=oldDocument;globalThis.fetch=oldFetch;}
console.log(`PASS: ${cases} live five-plan comparisons, exact quote totals, all frequencies/sexes/modes, selected extra riders, 11 Deduct/Copay options, age eligibility, coverage source limits and UI clearing/recovery`);
