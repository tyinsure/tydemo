import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {calculate} from './dist/calculator.mjs';
import {reportPageLayouts,drawPDFPage} from './dist/pdf-export.mjs';
const plans=JSON.parse(await fs.readFile('dist/plans.json'));let count=0;
for(const plan of plans)for(const mode of ['sum','premium'])for(const gender of ['male','female'])for(const age of [plan.minAge,plan.maxAge]){
 const base=calculate(plans,{planId:plan.id,gender,age,mode:'sum',amount:1000000});
 const r=calculate(plans,{planId:plan.id,gender,age,mode,amount:mode==='sum'?1000000:base.premium}),layouts=reportPageLayouts(r);
 assert.deepEqual(layouts.flatMap(p=>p.rows),r.schedule);
 layouts.forEach((layout,index)=>{
  assert.ok(layout.rows.length>0&&layout.top+36+layout.rows.length*20<=738);
  const text=[],ctx={scale(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},measureText(t){return {width:t.length*5};},fillText(t){text.push(String(t));}};
  const canvas={getContext:()=>ctx};drawPDFPage(canvas,r,mode,layout,index,layouts.length,1);
  assert.equal(canvas.width,596);assert.equal(canvas.height,842);
  assert.ok(text.includes('TYINSURE'));assert.ok(text.includes(`หน้า ${index+1} / ${layouts.length}`));
  for(const row of layout.rows)assert.ok(text.includes(String(row.age)));
 });count++;
}
console.log(`PASS: ${count} PDF layouts, complete schedules, portrait A4, repeating headers and page numbers`);
