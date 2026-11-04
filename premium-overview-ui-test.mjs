import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const html=await fs.readFile('dist/health.html','utf8');
assert.equal((html.match(/class="rider-cost card"/g)||[]).length,1);
const nodes=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],{value:'',checked:false,disabled:false,hidden:false,textContent:'',innerHTML:'',events:{},classList:{toggle(){},remove(){},add(){}},addEventListener(t,fn){this.events[t]=fn;},replaceChildren(){this.innerHTML='';},remove(){},options:[],setAttribute(){}}]));
Object.assign(nodes.age,{value:'35'});nodes.amount.value='1000000';nodes.frequency.value='annual';nodes['main-plan'].value='smart9999-large';nodes['ci-sum'].value='1000000';nodes['health-type'].value='none';nodes['health-benefit'].value='5000000';nodes['care-benefit'].value='5000000';nodes['care-condition'].value='both';nodes['pa-plan'].value='2';
const radio={value:'male',addEventListener(){}};
globalThis.document={getElementById:id=>nodes[id],querySelector:()=>radio,querySelectorAll:()=>[radio],body:{classList:{toggle(){}}}};
globalThis.fetch=async url=>({ok:true,json:async()=>JSON.parse(await fs.readFile(new URL('./dist/'+String(url).replace('./',''),import.meta.url)))});
await import('./dist/health.mjs');
const numeric=id=>Number(nodes[id].textContent.split(' ')[0].replace(/,/g,''));
for(const [frequency,label,count] of [['annual','รายปี',1],['semiannual','ราย 6 เดือน',2],['quarterly','ราย 3 เดือน',4],['monthly','รายเดือน',12]])for(let flags=0;flags<32;flags++){
 nodes.frequency.value=frequency;nodes['health-product'].value=flags&1?'dhealth':'';
 for(const [key,bit] of [['care',2],['ci',4],['daily',8],['pa',16]])nodes[key+'-enabled'].checked=!!(flags&bit);
 nodes.frequency.events.change();assert.equal(nodes.error.hidden,true);assert.equal(nodes['premium-cost'].hidden,flags===0);
 assert.equal(nodes['pa-cost-title'].textContent,'เบี้ยรวมปีแรก • ชำระ'+label);
 const unit={annual:'ปี',semiannual:'6เดือน',quarterly:'3เดือน',monthly:'เดือน'}[frequency];
 assert.ok(nodes['pa-base-annual'].textContent.endsWith('บาท/'+unit));assert.ok(nodes['pa-combined'].textContent.endsWith('บาท/'+unit));assert.equal(nodes['premium-unit-heading'].textContent,label);
 let per=0,annual=0;
 for(const [key,bit,periodId,yearId] of [['health',1,'health-premium','health-annual'],['care',2,'care-premium','care-annual'],['ci',4,'ci-premium','ci-annual'],['daily',8,'daily-premium','daily-annual'],['pa',16,'pa-annual','pa-yearly']]){
  assert.equal(nodes[key+'-cost'].hidden,!(flags&bit));
  if(flags&bit){assert.ok(nodes[periodId].textContent.endsWith('บาท/'+unit));per+=numeric(periodId);annual+=numeric(yearId);assert.ok(Math.abs(numeric(yearId)-numeric(periodId)*count)<.011);}
 }
 assert.ok(!html.includes('รวมเบี้ยสัญญาเพิ่มเติม'));assert.ok(!nodes['riders-premium']);
 assert.ok(Math.abs(numeric('pa-combined')-numeric('pa-base-annual')-per)<.011);
 assert.ok(Math.abs(numeric('combined-annual')-numeric('main-annual')-annual)<.011);
}
const amountBefore=nodes.amount.value,frequencyBefore=nodes.frequency.value,totalBefore=nodes['pa-combined'].textContent;
nodes['premium-view-all'].events.click();assert.equal(nodes['premium-selected-view'].hidden,true);assert.equal(nodes['premium-all-view'].hidden,false);assert.equal(nodes['pa-cost-title'].textContent,'เบี้ยรวมปีแรก • ทุกงวดชำระ');
assert.ok(nodes['premium-all-view'].innerHTML.includes('ราย 6 เดือน'));assert.ok(nodes['premium-all-view'].innerHTML.includes('ราย 3 เดือน'));
assert.ok(!nodes['premium-all-view'].innerHTML.includes('รวมเบี้ยสัญญาเพิ่มเติม'));
assert.equal(nodes.amount.value,amountBefore);assert.equal(nodes.frequency.value,frequencyBefore);assert.equal(nodes['pa-combined'].textContent,totalBefore);
nodes['ci-enabled'].checked=false;nodes['ci-enabled'].events.change();assert.ok(!nodes['premium-all-view'].innerHTML.includes('ซีไอ เพอร์เฟค แคร์'));
nodes['premium-view-selected'].events.click();assert.equal(nodes['premium-selected-view'].hidden,false);assert.equal(nodes['premium-all-view'].hidden,true);assert.equal(nodes['premium-all-view'].innerHTML,'');
nodes['premium-view-all'].events.click();
nodes.amount.value='0';nodes.amount.events.input();assert.equal(nodes['premium-cost'].hidden,true);assert.equal(nodes.pdf.disabled,true);assert.equal(nodes['premium-all-view'].innerHTML,'');
nodes.amount.value='1000000';nodes.amount.events.input();assert.equal(nodes['premium-cost'].hidden,false);assert.equal(nodes.pdf.disabled,false);
assert.equal(nodes['premium-all-view'].hidden,false);assert.ok(nodes['premium-all-view'].innerHTML.includes('รายเดือน'));
console.log('PASS: one premium card, 128 rider/payment combinations, grand total without duplicate rider subtotal, annual totals, dynamic heading, removal and invalid-input recovery');
