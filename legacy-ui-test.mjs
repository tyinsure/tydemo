import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const html=await fs.readFile('dist/legacy.html','utf8'),data=JSON.parse(await fs.readFile('dist/legacy-rates.json'));
const nodes={};for(const [,id] of html.matchAll(/id="([^"]+)"/g))nodes[id]={value:'',checked:false,disabled:false,hidden:false,textContent:'',innerHTML:'',events:{},classList:{toggle(){},remove(){},add(){}},addEventListener(t,fn){this.events[t]=fn;},replaceChildren(){this.innerHTML='';},remove(){},options:[],setAttribute(){}};
nodes.age.value='35';nodes.amount.value='1000000';nodes.frequency.value='annual';nodes['pa-plan'].value='1';nodes['pa-plan'].options=Array.from({length:7},(_,i)=>({value:String(i+1)}));
const radio={value:'male',addEventListener(){}};
const oldDocument=globalThis.document,oldFetch=globalThis.fetch;
globalThis.document={getElementById:id=>nodes[id],querySelector:()=>radio,querySelectorAll:()=>[radio],body:{classList:{toggle(){}}}};
globalThis.fetch=async()=>({ok:true,json:async()=>data});
try{
 await import('./dist/legacy.mjs?ui-test');
 assert.equal(nodes['pa-enabled'].checked,true);assert.equal(nodes['pa-enabled'].disabled,true);assert.equal(nodes['pa-premium-heading'].hidden,false);assert.ok(nodes['customer-summary-text'].value.includes('PA Easy'));
 nodes['pa-enabled'].checked=true;nodes['pa-enabled'].events.change();assert.equal(nodes['pa-plan'].value,'1');assert.ok(nodes['pa-annual'].textContent.includes('1,300'));nodes['pa-plan'].value='2';nodes['pa-plan'].events.change();assert.ok(nodes['pa-annual'].textContent.includes('2,000'));nodes['pa-plan'].value='1';nodes['pa-plan'].events.change();assert.equal(nodes.pdf.disabled,false);assert.ok(nodes['customer-summary-text'].value.includes('กลุ่มอาชีพ 1'));
 assert.equal(nodes.pdf.disabled,false);assert.equal(nodes['pa-premium-heading'].hidden,false);assert.ok(nodes['schedule-body'].innerHTML.includes('rider-premium-value'));assert.ok(nodes['pa-annual'].textContent.includes('1,300'));assert.ok(nodes['customer-summary-text'].value.includes('PA Easy Plan Rider แผน 1'));
 assert.equal((nodes['schedule-body'].innerHTML.match(/class="total-premium-value">27,280\.00<\/td>/g)||[]).length,20); // annual main + PA, never cumulative
 nodes.frequency.value='monthly';nodes.frequency.events.change();assert.ok(nodes['pa-annual'].textContent.includes('114.40'));assert.ok(nodes['pa-annual'].textContent.includes('บาท/เดือน'));assert.ok(nodes['customer-summary-text'].value.includes('114.40 บาท/งวด'));assert.ok(nodes['schedule-body'].innerHTML.includes('1,372.80'));
 nodes['pa-plan'].value='7';nodes.age.value='61';nodes.age.events.input();assert.equal(nodes.pdf.disabled,true);assert.ok(nodes.error.textContent.includes('ไม่มีอัตรา'));
 nodes['pa-enabled'].checked=false;nodes['pa-enabled'].events.change();assert.equal(nodes['pa-enabled'].checked,true);assert.equal(nodes['pa-enabled'].disabled,true);assert.equal(nodes.pdf.disabled,true);assert.equal(nodes['pa-premium-heading'].hidden,false);
 nodes['pa-plan'].value='1';nodes['pa-plan'].events.change();assert.equal(nodes.pdf.disabled,false);assert.equal(nodes['pa-controls'].hidden,false);assert.equal(nodes['pa-cost'].hidden,false);assert.ok(nodes['customer-summary-text'].value.includes('PA Easy'));
 console.log('PASS: Legacy 99/20 always has PA checked and locked, editable PA plan, valid quote/summary/column, invalid-age handling and recovery');
}finally{globalThis.document=oldDocument;globalThis.fetch=oldFetch;}
