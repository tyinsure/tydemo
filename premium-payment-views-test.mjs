import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {premiumPaymentViews,premiumPaymentTable} from './dist/premium-payment-views.mjs';
import {calculateLegacy} from './dist/health-calculator.mjs';
import {addHealthRider} from './dist/health-rider.mjs';
const data=JSON.parse(await readFile('dist/health-rates.json')),health=JSON.parse(await readFile('dist/health-premiums.json'));health.ci=JSON.parse(await readFile('dist/ci-perfect-care-rates.json'));
for(const mode of ['sum','premium'])for(const frequency of ['annual','semiannual','quarterly','monthly'])for(const product of ['dhealth','elite'])for(const gender of ['male','female']){
 const i={mode,frequency,mainPlan:'smart9920',amount:mode==='sum'?1000000:30000,age:35,gender,healthProduct:product,healthBenefit:'5000000',healthType:'none',healthPlan:4,healthArea:0,careEnabled:true,careBenefit:'5000000',careCondition:'both',ciEnabled:true,ciSum:1000000,dailyEnabled:true,dailyBenefit:500,paEnabled:true,paPlan:2};
 const result=addHealthRider(calculateLegacy(data,i),health,i),before=JSON.stringify(result),views=premiumPaymentViews(data,health,i,result);
 assert.deepEqual(views.map(v=>v.id),data.frequencies.map(f=>f.id));assert.equal(views.length,4);
 for(const v of views){const q=addHealthRider(calculateLegacy(data,{...i,mode:'sum',amount:result.sum,frequency:v.id}),health,{...i,mode:'sum',amount:result.sum,frequency:v.id});assert.equal(v.sum,result.sum);assert.equal(v.total,q.combinedFirstYearPremium);assert.ok(Math.abs(v.total-v.main-v.riders)<.011);}
 assert.equal(JSON.stringify(result),before);
 const markup=premiumPaymentTable(views,result,frequency);assert.equal((markup.match(/scope="col"/g)||[]).length,5);assert.equal((markup.match(/selected-payment/g)||[]).length,8);assert.match(markup,/บาท\/งวด/);
 const cards=[...markup.matchAll(/<details class="payment-mode-card[^>]*>[\s\S]*?<\/details>/g)].map(m=>m[0]);assert.equal(cards.length,4);assert.equal(cards.filter(c=>c.includes(' open>')).length,1);
 for(const [index,card] of cards.entries()){
  const view=views[index],formatted=view.total.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
  assert.ok(card.includes(formatted));assert.ok(card.includes(view.label));assert.equal(card.includes('payment-mode-selected'),view.id===frequency);assert.ok(card.includes('เบี้ยหลักและสัญญาเพิ่มเติมรวมปีแรก'));
  for(const key of ['main','health','care','ci','daily','pa'])assert.ok(card.includes(view[key].toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2})));
 }
}
const bad={...health,elite:{}};const i={mainPlan:'smart9920',mode:'sum',amount:1000000,age:35,gender:'male',frequency:'annual',healthProduct:'elite',healthPlan:1,healthArea:0};
assert.ok(premiumPaymentViews(data,bad,i,{sum:1000000}).every(v=>v.unavailable));
assert.match(premiumPaymentTable(premiumPaymentViews(data,bad,i,{sum:1000000}),{health:{label:'Elite'}},'annual'),/ไม่มีอัตรา/);
console.log('PASS: payment comparison uses exact modal rates; desktop/mobile cards match all four modes, selected mode opens once, all riders/sexes/products, fixed sum, no mutation and unavailable rates');
