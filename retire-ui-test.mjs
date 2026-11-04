import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const html=await fs.readFile('dist/index.html','utf8'),plans=JSON.parse(await fs.readFile('dist/plans.json'));
function node(){return {value:'',hidden:false,disabled:false,textContent:'',innerHTML:'',events:{},children:[],classList:{toggle(){},add(){},remove(){}},setAttribute(){},append(...xs){this.children.push(...xs);},replaceChildren(){this.innerHTML='';},remove(){},querySelector(){return null;},addEventListener(type,fn){this.events[type]=fn;}};}
const nodes=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],node()]));nodes.frequency.value='annual';nodes.age.value='35';nodes.amount.value='1000000';const radio={value:'male',addEventListener(){}};
globalThis.document={getElementById:id=>nodes[id],querySelector:()=>radio,querySelectorAll:()=>[radio],createElement:()=>node()};globalThis.window={matchMedia:()=>({matches:false}),addEventListener(){}};globalThis.fetch=async()=>({ok:true,json:async()=>plans});
await import('./dist/app.mjs');
assert.equal(nodes.error.hidden,true);assert.equal(nodes.plan.children.flatMap(g=>g.children).length,15);
for(const age of [55,60,65,70]){
 nodes.plan.value=`pro901_${age}`;nodes.plan.events.change();assert.equal(nodes.error.hidden,true);assert.equal(nodes.pdf.disabled,false);assert.equal(nodes['headline-label'].textContent,'เบี้ยประกันชำระครั้งเดียว');assert.equal(nodes['headline-unit'].textContent,'บาท');assert.ok(nodes['pay-note'].textContent.includes('ครั้งเดียว'));assert.ok(nodes['schedule-body'].innerHTML.includes('30%'));assert.ok(nodes['customer-summary-text'].value.includes(`อายุ ${age} ปี: ปีละ 300,000.00 บาท`));assert.ok(!nodes['customer-summary-text'].value.includes('undefined'));
}
for(const age of [55,60,65,70]){
 nodes.plan.value=`next901_${age}`;nodes.plan.events.change();assert.equal(nodes.error.hidden,true);assert.equal(nodes.pdf.disabled,false);assert.ok(nodes['plan-hint'].textContent.includes('12%'));assert.ok(nodes['customer-summary-text'].value.includes(`อายุ ${age===70?'70':`${age}–70`} ปี: ปีละ 120,000.00 บาท`));assert.ok(!nodes['schedule-body'].innerHTML.includes('30%'));
}
nodes.plan.value='mt8560_g15';nodes.plan.events.change();assert.equal(nodes['frequency-field'].hidden,false);assert.equal(nodes.error.hidden,true);assert.ok(nodes['customer-summary-text'].value.includes('อายุ 60–85 ปี'));assert.ok(nodes['row-count'].textContent.includes('–85 ปี'));assert.ok(nodes.chart.innerHTML.includes('ถึงอายุ 85 ปี'));assert.ok(!nodes.chart.innerHTML.includes('>90 ปี'));
for(const [frequency,expected] of [['annual','65,810.00'],['semiannual','34,840.00'],['quarterly','17,760.00'],['monthly','6,011.00']]){nodes.frequency.value=frequency;nodes.frequency.events.change();assert.equal(nodes['headline-value'].textContent,expected);assert.equal(nodes['headline-unit'].textContent,'บาท/งวด');assert.equal(nodes.error.hidden,true);}
nodes['mode-premium'].events.click();assert.equal(nodes.error.hidden,true);assert.ok(nodes['amount-label'].innerHTML.includes('ต่องวด'));assert.ok(nodes['complement-label'].textContent.includes('รายเดือน'));
nodes.plan.value='p2';nodes.plan.events.change();assert.ok(nodes['amount-label'].innerHTML.includes('รายปี'));assert.equal(nodes['frequency-field'].hidden,true);
console.log('PASS: fifteen dropdown options, Pro 30% and Next 12% first pensions, single premium labels, table/summary and mode/plan switching');

// Invalid edits must clear the previous quote and recover without reloading.
for(const [field,value] of [['age',''],['age','19'],['age','35.5'],['amount','0'],['amount','-1'],['amount','1.001']]){
 nodes.age.value='35';nodes.amount.value='1000000';nodes[field].value=value;
 assert.doesNotThrow(()=>nodes.form.events.submit({preventDefault(){}}));
 assert.equal(nodes.error.hidden,false);
 assert.equal(nodes['schedule-body'].innerHTML,'');assert.equal(nodes.chart.innerHTML,'');
 assert.equal(nodes['customer-summary-text'].value,'');
 for(const id of ['csv','pdf','print'])assert.equal(nodes[id].disabled,true);
 nodes.age.value='35';nodes.amount.value='1000000';nodes.form.events.submit({preventDefault(){}});
 assert.equal(nodes.error.hidden,true);assert.equal(nodes.pdf.disabled,false);
}
console.log('PASS: invalid age/amount clears tables, chart, summary and exports; valid inputs recover');

// A resize must not cancel a pending recalculation.
const resize={};let printed=0;
window.addEventListener=(name,fn)=>{resize[name]=fn;};window.print=()=>{printed++;};
await import('./dist/app.mjs?timers-and-print');
nodes.amount.value='2000000';nodes.amount.events.input();resize.resize();
await new Promise(resolve=>setTimeout(resolve,300));
assert.equal(nodes['complement-value'].textContent,'2,000,000.00 บาท');
nodes.amount.value='3000000';nodes.print.events.click();
assert.equal(printed,1);assert.equal(nodes['complement-value'].textContent,'3,000,000.00 บาท');
nodes.amount.value='0';nodes.print.events.click();assert.equal(printed,1);assert.equal(nodes.pdf.disabled,true);
globalThis.fetch=async()=>({ok:false});
await import('./dist/app.mjs?failed-load');
assert.equal(nodes.error.hidden,false);
for(const id of ['csv','pdf','print'])assert.equal(nodes[id].disabled,true);
console.log('PASS: resize preserves pending edits, print refreshes latest values, invalid/load failures block exports');
