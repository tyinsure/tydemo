import assert from 'node:assert/strict';
import {calculateSavings as calc} from './dist/savings-calculator.mjs';
const base={plan:'standard',age:35,mode:'sum',amount:1000000};
let r=calc(base);assert.equal(r.premium,967000);assert.equal(r.totalPremium,5802000);assert.equal(r.cashTotal,350000);assert.equal(r.guaranteedTotal,6350000);assert.deepEqual(r.rows.filter(x=>x.cash).map(x=>x.year),[2,4,6,8,10,12,14]);assert.equal(r.rows.filter(x=>x.premium).length,6);assert.equal(r.rows.at(-1).maturity,6000000);assert.equal(r.indexBenefit,null);
r=calc({...base,plan:'pro'});assert.equal(r.premium,968000);assert.equal(r.guaranteedTotal,6175000);
for(const age of [0,1,70,71,80])for(const plan of ['standard','pro']){r=calc({...base,age,plan,atLeast30Days:true});assert.equal(r.rate,plan==='pro'?968:age<=70?967:996);const inverse=calc({...base,age,plan,atLeast30Days:true,mode:'premium',amount:r.premium});assert.equal(inverse.sum,1000000);}
for(const age of [71,80]){r=calc({...base,age});assert.equal(r.rows[0].life,1005960);assert.equal(r.maturity,6035760);assert.equal(r.guaranteedTotal,6385760);}
const sim={...base,simulate:true,indexStart:230,indexEnd:357.45,fxStart:34,fxEnd:34};assert.equal(calc(sim).indexBenefit,1662391.3);assert.equal(calc({...sim,plan:'pro'}).indexBenefit,3324782.61);assert.equal(calc({...sim,indexEnd:197.98}).indexBenefit,0);assert.equal(calc({...sim,fxEnd:17}).indexBenefit,831195.65);
for(const change of [{age:81},{age:-1},{age:.5},{age:0},{age:''},{amount:19999},{amount:0},{amount:NaN},{plan:'invalid'},{...sim,indexStart:0},{...sim,fxStart:0},{...sim,indexEnd:''}])assert.throws(()=>calc({...base,...change}));
assert.equal(calc({...base,amount:20000}).premium,19340);
console.log('Savings: brochure examples, rate boundaries, inverse quotes, 101% protection, index/FX and invalid inputs passed');

const annual={...base,simulate:true,returnMode:'annual',annualReturn:3,fxStart:34,fxEnd:34};
const expected=1662391.3;
assert.equal(calc(annual).indexBenefit,expected);
assert.equal(calc({...annual,plan:'pro'}).indexBenefit,3324782.61);
assert.equal(calc(annual).projectedTotal,8012391.3);
assert.equal(calc(annual).projectedGain,2210391.3);
assert.equal(calc(annual).rows.at(-1).indexBenefit,expected);
for(const annualReturn of [-100,-1,0])assert.equal(calc({...annual,annualReturn}).indexBenefit,0);
for(const annualReturn of ['',null,undefined,-101,Infinity,1e50])assert.throws(()=>calc({...annual,annualReturn}));
assert.equal(calc({...annual,simulate:false,annualReturn:''}).indexBenefit,null);
assert.equal(calc({...annual,fxEnd:17}).indexBenefit,831195.65);
for(const [annualReturn,index,standardBenefit,proBenefit,standardTotal,proTotal] of [
 [-1,197.98,0,0,6350000,6175000],
 [3,357.45,1662391.3,3324782.61,8012391.3,9499782.61],
 [5,476.21,3211434.78,6422869.57,9561434.78,12597869.57]
]){
 const standard=calc({...annual,annualReturn}),pro=calc({...annual,annualReturn,plan:'pro'});
 assert.equal(standard.projectedIndexEnd,index);assert.equal(pro.projectedIndexEnd,index);
 assert.equal(standard.indexBenefit,standardBenefit);assert.equal(pro.indexBenefit,proBenefit);
 assert.equal(standard.projectedTotal,standardTotal);assert.equal(pro.projectedTotal,proTotal);
 assert.equal(standard.guaranteedTotal,6350000);assert.equal(pro.guaranteedTotal,6175000);
 const manual=calc({...sim,indexEnd:index});assert.equal(manual.indexBenefit,standard.indexBenefit);
}
// Off-anchor rates still calculate continuously; selected amount and FX apply before final rounding.
const custom=calc({...annual,annualReturn:4.25,amount:200000,fxStart:34,fxEnd:36});
assert.ok(custom.indexBenefit>0);assert.equal(custom.projectedTotal,Math.round((custom.guaranteedTotal+custom.indexBenefit)*100)/100);
console.log('Brochure -1/3/5 percent: both plans, exact index levels/benefits/totals, FX, custom rates, manual mode and invalid/disabled assumptions passed');

for(const age of [0,35,71,80])for(const plan of ['standard','pro']){
 const timeline=calc({...annual,age,plan,atLeast30Days:true});
 assert.equal(timeline.rows.length,16);assert.deepEqual(timeline.rows.map(x=>x.year),Array.from({length:16},(_,i)=>i));
 assert.equal(timeline.rows[0].age,age);assert.equal(timeline.rows.at(-1).age,age+15);
 assert.deepEqual(timeline.rows.filter(x=>x.premium).map(x=>x.age),[0,1,2,3,4,5].map(y=>age+y));
 assert.deepEqual(timeline.rows.filter(x=>x.cash).map(x=>x.age),[2,4,6,8,10,12,14].map(y=>age+y));
 assert.equal(timeline.rows[0].cash,0);assert.equal(timeline.rows[1].cash,0);
 assert.equal(timeline.rows.at(-1).premium,0);assert.equal(timeline.rows.at(-1).cash,0);assert.equal(timeline.rows.at(-1).life,null);
 assert.equal(timeline.rows.at(-1).maturity,timeline.maturity);assert.equal(timeline.rows.at(-1).indexBenefit,timeline.indexBenefit);
 assert.equal(Math.round(timeline.rows.reduce((n,x)=>n+x.premium,0)*100)/100,timeline.totalPremium);
 assert.equal(Math.round(timeline.rows.reduce((n,x)=>n+x.cash,0)*100)/100,timeline.cashTotal);
 assert.equal(timeline.rows[5].paid,timeline.totalPremium);
}
const inception=calc(base);assert.equal(inception.rows[0].life,1000000);assert.equal(inception.rows[1].life,2000000);assert.equal(inception.rows[5].life,6000000);assert.equal(inception.rows[14].life,6000000);
console.log('Anniversary timeline: age35/year0, premiums35–40, cashback37–49, maturity50/year15, both plans and all totals unchanged passed');
