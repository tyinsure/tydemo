import assert from 'node:assert/strict';
import {mountCustomerSummary} from './dist/summary-controller.mjs';
const nodes={};
for(const id of ['customer-summary-text','copy-summary','regenerate-summary','summary-copy-status'])nodes[id]={value:'',textContent:'',disabled:false,events:{},addEventListener(type,fn){this.events[type]=fn;},focus(){},select(){},setSelectionRange(){}};
const oldDocument=globalThis.document,oldNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
let copied='';globalThis.document={getElementById:id=>nodes[id]};Object.defineProperty(globalThis,'navigator',{configurable:true,value:{clipboard:{writeText:async text=>{copied=text;}}}});
try{
 let input={amount:100},result={amount:100},summary;
 const refresh=()=>{result=input.amount>0?{amount:input.amount}:null;summary.update();};
 summary=mountCustomerSummary({getResult:()=>result,getInput:()=>input,refresh,createSummary:r=>`Coverage ${r.amount}`});summary.update();
 assert.equal(nodes['customer-summary-text'].value,'Coverage 100');
 nodes['customer-summary-text'].value='Manual customer message';await nodes['copy-summary'].events.click();assert.equal(copied,'Manual customer message');
 input={amount:200};await nodes['copy-summary'].events.click();assert.equal(copied,'Coverage 200');
 nodes['customer-summary-text'].value='Draft';nodes['regenerate-summary'].events.click();assert.equal(nodes['customer-summary-text'].value,'Coverage 200');
 input={amount:0};refresh();assert.equal(nodes['customer-summary-text'].value,'');assert.equal(nodes['copy-summary'].disabled,true);assert.equal(nodes['regenerate-summary'].disabled,true);
 console.log('PASS: editable summary, stale-input refresh before copy, regeneration, invalid-input clearing');
}finally{globalThis.document=oldDocument;if(oldNavigator)Object.defineProperty(globalThis,'navigator',oldNavigator);else delete globalThis.navigator;}
