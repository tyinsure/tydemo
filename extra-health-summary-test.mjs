import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {eliteBenefits,ELITE_EXTRA,ELITE_LIMITS,careBenefits,CARE_TREATMENTS} from './dist/extra-health-pdf-summary.mjs';
import {healthQuote} from './dist/health-rider.mjs';
import {drawPDFPage,reportPageLayouts} from './dist/health-pdf-export.mjs';
const data=JSON.parse(await readFile('dist/health-premiums.json'));
const base={age:35,gender:'male',frequency:'annual'};
function paint(r,kind){
 const texts=[],c={scale(){},fillRect(){},measureText(s){return {width:String(s).length*4};},fillText(s,x,y){assert.ok(y<=819);texts.push(String(s));}};
 drawPDFPage({getContext:()=>c},r,'sum',{kind},0,1,1);assert.ok(!texts.some(s=>/NaN|undefined/.test(s)));return texts.join('\n');
}
assert.deepEqual(ELITE_LIMITS,[20000000,40000000,75000000,100000000]);
for(const plan of [1,2,3,4])for(const area of [0,1,2,3]){
 const health=healthQuote(data,{...base,healthProduct:'elite',healthPlan:plan,healthArea:area});assert.equal(health.plan,plan);assert.equal(health.area,area);
 const r={health,rider:{},schedule:[{age:35}]};assert.deepEqual(reportPageLayouts(r).map(p=>p.kind).filter(Boolean),['elite','elite-extra']);
 const rows=eliteBenefits(plan);assert.equal(rows.filter(([s])=>/^\d+\. /.test(s)).length,13);
 assert.match(rows[0][1],new RegExp([10000,12000,15000,25000][plan-1].toLocaleString('th-TH')));
 assert.ok(rows[0][2].includes('365'));assert.equal(rows.find(([s])=>s.startsWith('2.4'))[1],'100,000 บาท\nสำหรับกิน 30 วัน');
 for(const id of ['6.2','8.'])assert.equal(rows.find(([s])=>s.startsWith(id))[1],'จ่ายตามจริง\n(ไม่จำกัดครั้งใน 30 วัน)');
 for(const id of ['9.','10.','11.'])assert.equal(rows.find(([s])=>s.startsWith(id))[1],'จ่ายตามจริง');
 assert.ok(!rows.some(([,s])=>s.includes('Care Plus')));
 assert.match(paint(r,'elite'),/120 วัน/);
 const extensionText=paint(r,'elite-extra');
 for(const [i,limit] of ELITE_LIMITS.entries())assert.equal(extensionText.includes(`วงเงิน ${limit/1000000} ล้านบาท`),i===plan-1);
 assert.match(extensionText,/MRI \/ CT SCAN \/ PET SCAN/);
 assert.equal(extensionText.includes('คอลัมน์สีชมพู'),false);
}
const extension=s=>ELITE_EXTRA.find(([title])=>title.startsWith(s))[1];
assert.deepEqual(extension('ค่าห้องพัก'),['ไม่คุ้มครอง','5,000 บาท/วัน','5,000 บาท/วัน','5,000 บาท/วัน']);
assert.match(extension('ค่าเครื่องมือ')[2],/150,000/);assert.match(extension('ค่ารักษาทางจิตเวช')[3],/400,000/);
assert.match(extension('ค่าธรรมเนียม')[3],/360/);assert.equal(extension('การฝังเข็ม')[2],'10,000 บาท');
assert.equal(CARE_TREATMENTS.cancer.length,10);assert.equal(CARE_TREATMENTS.kidney.length,5);
for(const condition of ['cancer','kidney','both'])for(const benefit of [1000000,5000000]){
 const care=healthQuote(data,{...base,healthProduct:'care',careBenefit:benefit,careCondition:condition});assert.equal(care.condition,condition);assert.equal(care.benefit,benefit);
 const r={care,rider:{},schedule:[{age:35}]},layouts=reportPageLayouts(r);assert.equal(layouts.filter(p=>p.kind==='care').length,1);
 const rows=careBenefits(care);assert.equal(rows[1][1],'100,000 บาท');assert.equal(rows[2][1],benefit===1000000?'10,000 บาท/ปี':'50,000 บาท/ปี');assert.equal(rows[3][1],benefit.toLocaleString('th-TH')+' บาท');
 const text=paint(r,'care');assert.equal(text.includes('Radiosurgery'),condition!=='kidney');assert.equal(text.includes('Vascular Access'),condition!=='cancer');
 assert.deepEqual(layouts.flatMap(p=>p.rows),r.schedule);
}
assert.ok(!reportPageLayouts({schedule:[{}]}).some(p=>['care','elite','elite-extra'].includes(p.kind)));
console.log('PASS: Elite four plans/areas, two conditional pages, source limits and extension anchors; Care three conditions/two limits, correct treatments and shared annual cap');
