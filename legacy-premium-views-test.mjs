import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {calculateLegacy} from './dist/legacy-calculator.mjs';
import {premiumPaymentViews} from './dist/premium-payment-views.mjs';
const data=JSON.parse(await fs.readFile('dist/legacy-rates.json'));
for(const amount of [10000,1000000])for(const mode of ['sum','premium'])for(const gender of ['male','female'])for(const frequency of data.frequencies){
 const i={age:35,amount,mode,gender,frequency:frequency.id,paEnabled:true,paPlan:2},r=calculateLegacy(data,i),before=JSON.stringify(r);
 for(const v of premiumPaymentViews(data,{},i,r,calculateLegacy)){
  assert.equal(v.unavailable,undefined);assert.equal(v.sum,r.sum);
  const expected=calculateLegacy(data,{...i,mode:'sum',amount:r.sum,frequency:v.id});
  assert.equal(v.main,expected.premium);assert.equal(v.pa,expected.rider.premium);assert.equal(v.total,expected.combinedFirstYearPremium);
 }
 assert.equal(JSON.stringify(r),before);
}
const html=await fs.readFile('dist/legacy.html','utf8');assert.equal((html.match(/class="rider-cost card"/g)||[]).length,1);assert.ok(!html.includes('รวมเบี้ยสัญญาเพิ่มเติม'));
const nodes=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],{value:'',checked:false,disabled:false,hidden:false,textContent:'',innerHTML:'',events:{},attrs:{},classList:{toggle(){},remove(){},add(){}},addEventListener(t,fn){this.events[t]=fn;},replaceChildren(){this.innerHTML='';},remove(){},options:[],setAttribute(k,v){this.attrs[k]=v;}}]));
nodes.age.value='35';nodes.amount.value='10000';nodes.frequency.value='annual';nodes['pa-plan'].value='2';
const radio={value:'male',addEventListener(){}};
globalThis.document={getElementById:id=>nodes[id],querySelector:()=>radio,querySelectorAll:()=>[radio],body:{classList:{toggle(){}}}};
globalThis.fetch=async()=>({ok:true,json:async()=>data});await import('./dist/legacy.mjs');
assert.equal(nodes['pa-enabled'].checked,true);assert.equal(nodes['pa-enabled'].disabled,true);assert.equal(nodes['premium-cost'].hidden,false);
for(const [id,label,unit] of [['annual','รายปี','ปี'],['semiannual','ราย 6 เดือน','6เดือน'],['quarterly','ราย 3 เดือน','3เดือน'],['monthly','รายเดือน','เดือน']]){
 nodes.frequency.value=id;nodes.frequency.events.change();assert.equal(nodes.error.hidden,true);assert.equal(nodes['pa-cost-title'].textContent,'เบี้ยรวมปีแรก • ชำระ'+label);assert.ok(nodes['pa-combined'].textContent.endsWith('บาท/'+unit));
}
const before=nodes.amount.value,total=nodes['pa-combined'].textContent;
nodes['premium-view-all'].events.click();assert.equal(nodes['premium-selected-view'].hidden,true);assert.equal(nodes['premium-all-view'].hidden,false);assert.ok(nodes['premium-all-view'].innerHTML.includes('ราย 6 เดือน'));assert.equal(nodes.amount.value,before);assert.equal(nodes['pa-combined'].textContent,total);
nodes['pa-plan'].value='1';nodes['pa-plan'].events.change();assert.ok(nodes['premium-all-view'].innerHTML.includes('114.40'));
nodes.amount.value='0';nodes.amount.events.input();assert.equal(nodes['premium-cost'].hidden,true);assert.equal(nodes['premium-all-view'].innerHTML,'');
nodes.amount.value='10000';nodes.amount.events.input();assert.equal(nodes['premium-cost'].hidden,false);assert.equal(nodes['premium-all-view'].hidden,false);
nodes['premium-view-selected'].events.click();assert.equal(nodes['premium-all-view'].hidden,true);assert.equal(nodes['premium-selected-view'].hidden,false);
nodes['pa-enabled'].checked=false;nodes['pa-enabled'].events.change();assert.equal(nodes['premium-cost'].hidden,false);assert.equal(nodes['pa-enabled'].checked,true);assert.equal(nodes['pa-enabled'].disabled,true);
console.log('PASS: Legacy premium card, all payment units, toggle/PA updates, low sums and premium-mode fixed coverage, invalid-input recovery; health calculator minimum not imposed');
