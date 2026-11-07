import assert from 'node:assert/strict';
import {calculateSavings} from './dist/savings-calculator.mjs';
import {savingsReportData,savingsExcelParts,createSavingsExcel,drawSavingsPDF,SAVINGS_DISCLAIMER} from './dist/savings-report.mjs';
let cases=0;
for(const plan of ['standard','pro'])for(const age of [0,35,71,80])for(const mode of ['sum','premium'])for(const simulate of [false,true]){
 const sum=mode==='sum'?1000000:plan==='pro'?968000:age>70?996000:967000;
 const r=calculateSavings({plan,age,mode,amount:sum,atLeast30Days:true,simulate,returnMode:'annual',annualReturn:3,fxStart:34,fxEnd:34});
 const options={mode,gender:'female',fxStart:34,fxEnd:34},data=savingsReportData(r,options),parts=savingsExcelParts(r,options),sheet=parts['xl/worksheets/sheet1.xml'];
 assert.equal(data.rows.length,16);assert.equal(data.rows[0][0],age);assert.equal(data.rows.at(-1)[0],age+15);
 assert.equal(data.rows.at(-1)[3],r.maturity);assert.equal(data.rows.at(-1)[4],null);assert.equal(data.rows.at(-1)[5],r.indexBenefit);
 assert.equal(data.rows.reduce((sum,row)=>sum+row[3],0),r.guaranteedTotal);
 assert.equal(data.rows.filter(row=>row[1]>0).length,6);
 assert.equal(data.headers.length,6);assert.ok(data.headers.includes('เงินคืนตามสัญญา\n(บาท)'));assert.ok(!data.headers.includes('ปีที่'));
 assert.ok(data.subtitle.includes(mode==='premium'?'คำนวณจากเบี้ยประกัน':'คำนวณจากทุนประกัน'));
 assert.ok(data.notes.includes(SAVINGS_DISCLAIMER));assert.ok(sheet.includes('orientation="portrait"'));assert.ok(sheet.includes('r:id="line"'));
 const texts=[],context={scale(){},fillRect(){},strokeRect(){},measureText(value){return {width:[...String(value)].length*4}},fillText(value,x,y){assert.ok(y<795||y===803||y===815);texts.push(String(value));}};
 drawSavingsPDF({getContext(){return context;}},r,options,1);
 assert.ok(texts.includes(String(age+15)));assert.ok(texts.some(t=>t.includes('เงินคืนตามสัญญา')));
 assert.ok(texts.some(t=>t.includes('ไม่ใช่ใบเสนอขาย')));if(simulate)assert.ok(texts.includes(r.indexBenefit.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2})));
 const blob=createSavingsExcel(r,options),bytes=new Uint8Array(await blob.arrayBuffer());assert.equal(new DataView(bytes.buffer).getUint32(0,true),0x04034b50);
 cases++;
}
console.log(`PASS: ${cases} savings export cases, sum/premium modes, 16 correct ages, merged contractual refunds, index separation, numeric XLSX/A4 and PDF layout/content`);

for(const [returnMode,annualReturn,indexEnd,expected] of [['annual',3,357.45,'3%'],['annual',5,476.21,'5%'],['annual',-1,197.98,'-1%'],['index',null,357.45,'3%'],['index',null,230,'0%'],['index',null,0,'-100%']]){
 const r=calculateSavings({plan:'pro',age:35,mode:'sum',amount:1000000,simulate:true,returnMode,annualReturn,indexStart:230,indexEnd,fxStart:34,fxEnd:34});
 const data=savingsReportData(r),header=data.headers.at(-1).replaceAll('\n','');
 assert.equal(header,'เงินปันผลหากได้ผลตอบแทน '+expected+'(บาท)');
 assert.ok(savingsExcelParts(r)['xl/worksheets/sheet1.xml'].includes(expected));
}
console.log('PASS: dividend headings follow chosen annual percentages and calculated index returns, including negative/zero returns');
