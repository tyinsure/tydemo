import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {dhealthBenefits,DHEALTH_WAITING} from './dist/dhealth-pdf-summary.mjs';
import {healthQuote} from './dist/health-rider.mjs';
import {reportPageLayouts,drawPDFPage} from './dist/health-pdf-export.mjs';
const data=JSON.parse(await readFile('dist/health-premiums.json'));
for(const benefit of [1000000,5000000]){
 const rows=dhealthBenefits(benefit);
 assert.deepEqual(rows.filter(([s])=>/^\d+\. /.test(s)).map(([s])=>Number(s.split('.')[0])),Array.from({length:13},(_,i)=>i+1));
 assert.deepEqual(rows.filter(([,a])=>a.startsWith('ไม่คุ้มครอง')).map(([s])=>Number(s.split('.')[0])),[9,10,11]);
 const row=id=>rows.find(([s])=>s.startsWith(id+' '));
 assert.match(row('1.')[1],benefit===1000000?/2,000/:/4,000/);assert.match(row('3.')[1],benefit===1000000?/2,000/:/4,000/);
 assert.equal(row('2.4')[1],'20,000 บาท\nสำหรับกิน 14 วัน');assert.ok(!row('2.')[2].includes('2.4'));
 assert.equal(row('6.1')[1],'จ่ายตามจริง');assert.equal(row('6.2')[1],'จ่ายตามจริง\n(ไม่จำกัดครั้งใน 30 วัน)');
 assert.match(row('8.')[0],/เวชศาสตร์ฟื้นฟู \(กายภาพบำบัด\)/);assert.equal(row('8.')[1],'จ่ายตามจริง\n(ไม่จำกัดครั้ง)');
 for(const id of ['9.','10.','11.'])assert.equal(row(id)[1],'ไม่คุ้มครอง\n(สามารถใช้ Care Plus ช่วยได้)');
 for(const healthType of ['none','deductible','copay']){
  const input={healthProduct:'dhealth',healthBenefit:String(benefit),healthType,healthOption:healthType==='deductible'?(benefit===1000000?'ded20000':'ded30000'):'copay10',frequency:'annual',age:35,gender:'male'};
  const health=healthQuote(data,input,35),r={health,rider:{},schedule:[{age:35}]};
  const pages=reportPageLayouts(r);assert.equal(pages.filter(p=>p.kind==='dhealth').length,1);assert.deepEqual(pages.flatMap(p=>p.rows),r.schedule);
  const painted=[],c={scale(){},fillRect(){},measureText(s){return {width:String(s).length*5};},fillText(s,x,y){painted.push({s,x,y});}};
  drawPDFPage({getContext:()=>c},r,'sum',pages.at(-1),1,2,1);
  assert.equal(painted.filter(t=>t.s.startsWith('13.')).length,1);assert.ok(painted.some(t=>t.s===health.detail));
  assert.ok(painted.every(t=>t.y<=819));assert.equal(painted.filter(t=>t.s==='ไม่คุ้มครอง').length,3);
  assert.ok(!painted.some(t=>t.s==='180 วัน'||/อาณาเขตคุ้มครอง|ไทรอยด์/.test(t.s)));
  for(const id of ['2.4','6.1','6.2'])assert.equal(painted.filter(t=>t.s.startsWith(id+' ')).length,1);
 }
}
assert.deepEqual(DHEALTH_WAITING.map(([s])=>s),['30 วัน','120 วัน']);
for(const product of ['elite',undefined])assert.ok(!reportPageLayouts({health:{product},schedule:[{}]}).some(p=>p.kind==='dhealth'));
console.log('PASS: D Health Lite one-page PDF summary, ordered categories 1–13, excluded 9–11, both plan limits, selected responsibility, waiting periods and conditional page');
