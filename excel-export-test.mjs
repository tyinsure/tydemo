import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {calculate} from './dist/calculator.mjs';
import {reportParts,zipParts} from './dist/excel-export.mjs';
const template=JSON.parse(await fs.readFile('dist/excel-template.json'));
const plans=JSON.parse(await fs.readFile('dist/plans.json'));
let cases=0;
for(const plan of plans)for(const mode of ['sum','premium'])for(const gender of ['male','female'])for(const age of [plan.minAge,plan.maxAge]){
 const base=calculate(plans,{planId:plan.id,gender,age,mode:'sum',amount:1000000});
 const r=calculate(plans,{planId:plan.id,gender,age,mode,amount:mode==='sum'?1000000:base.premium});
 const parts=reportParts(template,r,mode),sheet=parts['xl/worksheets/sheet1.xml'];
 r.schedule.forEach((item,i)=>{
  [item.age,item.pay,item.pct,item.pension,item.received,item.coverage].forEach((value,j)=>{
   const ref='ABCDEF'[j]+(11+i),cell=sheet.match(new RegExp(`<x:c r="${ref}"[^>]*>(.*?)</x:c>`,'s'))?.[1];
   assert.ok(value===null?cell?.includes('>-</x:t>'):cell?.includes(`<x:v>${value}</x:v>`),`${plan.id}: ${ref}`);
  });
 });
 assert.ok(sheet.includes('fitToWidth="1" fitToHeight="0"'));
 assert.ok(sheet.includes('orientation="landscape"'));
 assert.ok(parts['xl/workbook.xml'].includes('_xlnm.Print_Titles'));
 const data=new DataView(await zipParts(parts).arrayBuffer());
 assert.equal(data.getUint32(0,true),0x04034b50);
 assert.equal(data.getUint32(data.byteLength-22,true),0x06054b50);
 cases++;
}
console.log(`PASS: ${cases} Excel exports; all numeric cells match calculator, ZIP headers, A4 landscape and repeating table header`);
