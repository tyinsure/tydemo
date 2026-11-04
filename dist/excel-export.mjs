// Layout and styles are authored with Artifact Tool in excel-template.json.
const encoder=new TextEncoder();
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const cell=(ref,value,style)=>`<x:c r="${ref}" s="${style}" t="${typeof value==='number'?'n':'inlineStr'}">${typeof value==='number'?`<x:v>${Number.isFinite(value)?value:0}</x:v>`:`<x:is><x:t xml:space="preserve">${xml(value)}</x:t></x:is>`}</x:c>`;
function styleFor(sheet,ref){return sheet.match(new RegExp(`<x:c r="${ref}" s="(\\d+)"`))[1];}
export function reportParts(template,r,mode){
 const legacy=r.type==='legacy',withRider=legacy&&!!r.rider,lastCol=withRider?'G':'F',parts={...template};let sheet=parts['xl/worksheets/sheet1.xml'];
 const rows=[...sheet.matchAll(/<x:row\b[^>]*>[\s\S]*?<\/x:row>/g)].slice(0,10).map(m=>m[0]);
 function put(row,col,value,sourceRef=col+row){
  const ref=col+row,pattern=new RegExp(`<x:c r="${ref}"[^>]*(?:\\/>|>[\\s\\S]*?<\\/x:c>)`),valueXml=cell(ref,value,styleFor(sheet,sourceRef));
  rows[row-1]=pattern.test(rows[row-1])?rows[row-1].replace(pattern,valueXml):rows[row-1].replace('</x:row>',valueXml+'</x:row>');
 }
 put(3,'A',`${r.plan.label} · ${mode==='premium'?'คำนวณจากเบี้ยประกัน':'คำนวณจากทุนประกัน'}`);
 if(legacy){
  put(2,'A','TYINSURE | สรุปแผนสร้างมรดก');put(6,'D',`เบี้ย${r.frequency.label} (บาท/งวด)`);put(7,'D','ครบสัญญา (อายุ)');put(8,'D','เงินครบสัญญา (บาท)');
  ['อายุ (ปี)','เบี้ยในช่วง\n(บาท)','เบี้ยสะสม\n(บาท)','ประกันชีวิต*\n(บาท)','เงินครบสัญญา\n(บาท)'].forEach((v,i)=>put(10,'ABCDEF'[i],v));
 }
 if(r.plan.family==='mt8560'){put(6,'D',`เบี้ย${r.frequency.label} (บาท/งวด)`);}
 if(r.plan.kind==='single_premium'){put(6,'D','เบี้ยชำระครั้งเดียว (บาท)');put(7,'A','ระยะชำระเบี้ย (ครั้ง)');put(10,'B','เบี้ยที่ชำระ\n(บาท)');}
 if(withRider){
  put(8,'A','เบี้ยหลักที่ชำระรวม (บาท)');
  put(9,'A',`PA Easy Plan ${r.rider.name} · อาชีพ ${r.rider.occupation} · เบี้ย PA ${r.frequency.label} ${r.rider.premium.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2})} บาท/งวด · รวมปีแรก ${r.combinedFirstYearAnnual.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2})} บาท/ปี`);
  ['อายุ\n(ปี)','เบี้ยประกันชีวิต\n(บาท/ปี)','เบี้ยPA\n(บาท/ปี)','เบี้ยหลักสะสม\n(บาท)','ประกันชีวิต*\n(บาท)','เงินครบสัญญา\n(บาท)'].forEach((v,i)=>put(10,'ABCDEFG'[i],v,'F10'));
 }
 for(const [row,c,f] of [[5,r.gender==='male'?'ชาย':'หญิง',r.age],[6,r.sum,r.premium],[7,r.payYears,legacy?99:r.plan.pensionAge],[8,r.totalPaid,legacy?r.maturityAmount:r.totalReceived]]){put(row,'C',c);put(row,'F',f);}
 if(r.plan.family==='mt8560'){put(7,'D','ช่วงรับบำนาญ (อายุ)');put(7,'F','60–85 ปี');}
 if(legacy){const unused=withRider?'G':'F';rows[9]=rows[9].replace(new RegExp(`<x:c r="${unused}10"[^>]*(?:\\/>|>[\\s\\S]*?<\\/x:c>)`),'');}
 r.schedule.forEach((item,i)=>{
  const row=11+i,source=(legacy?[r.age,r.age+19,99]:[r.plan.pensionAge,71,76,81,86]).includes(item.age)?12:11;
  const values=withRider?[item.age,item.pay,item.riderPremium??'ไม่มีอัตรา',item.paid,item.coverage,item.maturity]:legacy?[item.age,item.pay,item.paid,item.coverage,item.maturity]:[item.age,item.pay,item.pct,item.pension,item.received,item.coverage??'-'];
  rows.push(`<x:row r="${row}" ht="25" customHeight="1">${values.map((v,j)=>{const col='ABCDEFG'[j];return cell(col+row,v,styleFor(sheet,(legacy?'AABBBBB'[j]:col)+source));}).join('')}</x:row>`);
 });
 const end=10+r.schedule.length,notes=legacy?[
  '* ความคุ้มครองขั้นต่ำ = ค่าสูงกว่าระหว่างทุนและเบี้ยสะสม ยังไม่รวมมูลค่าเวนคืน',
  'อายุ ณ ต้นปี เบี้ยสะสมคิดหลังชำระครบทุกงวดของปีนั้น แถวสุดท้ายครบอายุ 99 ปี',
  'ทัก LINE @TYINSURE   https://line.me/R/ti/p/@tyinsure'
 ]:[
  '* ก่อนรับบำนาญ: ความคุ้มครองขั้นต่ำ 105% ของเบี้ยประกันที่ชำระสะสม',
  'หลังเริ่มรับบำนาญ: เบี้ยสะสมหักเงินบำนาญสะสมที่ได้รับแล้ว (ไม่ต่ำกว่า 0 บาท)',
  'ทัก LINE @TYINSURE   https://line.me/R/ti/p/@tyinsure'
 ];
 if(r.plan.family==='mt8560')notes.splice(0,2,'* ก่อนบำนาญ: 100% ของทุนถึงอายุ 44 ปี อายุ 45–59 ปีเพิ่มปีละ 10% เป็น 110–250%', 'หลังรับบำนาญ อายุ 60–73 ปี: มูลค่าปัจจุบันของบำนาญที่ยังไม่ได้รับตามตารางรับรอง 15 ปี × ทุนประกัน ÷ 1,000 · อายุ 74–85 ปี: -', `เบี้ยต่องวด ${r.frequency.label} ตารางรวมทุกงวดในปีนั้น บำนาญ 12% อายุ 60–85 ปี`);
 if(withRider)notes.splice(2,0,
  `PA Easy Plan ${r.rider.name} · กลุ่มอาชีพ ${r.rider.occupation}${r.rider.holiday?' · รวมเบี้ยเพิ่มวันหยุดนักขัตฤกษ์แล้ว':''}`,
  'ตาราง PA รวมเบี้ยทุกงวดต่อปีถึงอายุ 85 ปี หลังจากนั้นไม่นำ PA มารวมยอด การต่ออายุขึ้นกับเงื่อนไขสัญญา ไม่มีอัตราไม่ใช่เบี้ยฟรี',
  'เบี้ยและวงเงิน PA แยกจากเบี้ยสะสมและความคุ้มครองของสัญญาหลัก');
 notes.forEach((text,i)=>{const row=end+2+i;rows.push(`<x:row r="${row}" ht="25" customHeight="1">${cell('A'+row,text,2)}</x:row>`);});
 sheet=sheet.replace(/<x:sheetData>[\s\S]*?<\/x:sheetData>/,`<x:sheetData>${rows.join('')}</x:sheetData>`);
 if(legacy){const last=withRider?'F':'E';sheet=sheet.replace('</x:mergeCells>',Array.from({length:r.schedule.length+1},(_,i)=>`<x:mergeCell ref="${last}${10+i}:${lastCol}${10+i}" />`).join('')+'</x:mergeCells>');}
 sheet=sheet.replace('</x:mergeCells>',notes.map((_,i)=>`<x:mergeCell ref="A${end+2+i}:${lastCol}${end+2+i}" />`).join('')+'</x:mergeCells>');
 if(withRider)sheet=sheet.replace('ref="A2:F2"','ref="A2:G2"').replace('ref="A3:F3"','ref="A3:G3"').replace('</x:mergeCells>','<x:mergeCell ref="A9:G9" /></x:mergeCells>').replace('</x:cols>','<x:col min="7" max="7" width="27" customWidth="1" /></x:cols>');
 sheet=sheet.replace('<x:sheetViews>','<x:sheetPr><x:pageSetUpPr fitToPage="1" /></x:sheetPr><x:sheetViews>');
 sheet=sheet.replace(/<x:pageMargins[^>]*\/>/,'<x:printOptions horizontalCentered="1" /><x:pageMargins left="0.25" right="0.25" top="0.4" bottom="0.4" header="0.2" footer="0.2" /><x:pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0" /><x:headerFooter><x:oddFooter>&amp;LTYINSURE&amp;Rหน้า &amp;P / &amp;N</x:oddFooter></x:headerFooter>');
 parts['xl/worksheets/sheet1.xml']=sheet;
 parts['xl/workbook.xml']=parts['xl/workbook.xml'].replace('</x:workbook>',`<x:definedNames><x:definedName name="_xlnm.Print_Area" localSheetId="0">'สรุปแผนบำนาญ'!$A$1:$${lastCol}$${end+notes.length+1}</x:definedName><x:definedName name="_xlnm.Print_Titles" localSheetId="0">'สรุปแผนบำนาญ'!$10:$10</x:definedName></x:definedNames></x:workbook>`);
 if(legacy){
  let column=0;parts['xl/worksheets/sheet1.xml']=parts['xl/worksheets/sheet1.xml'].replace(/(<x:col\b[^>]*width=")[^"]+(")/g,(_,a,b)=>a+(withRider?[11,24,24,24,27,13,14]:[11,24,24,27,13,14])[column++]+b);
 }
 if(legacy)for(const key of Object.keys(parts))parts[key]=parts[key].replaceAll('สรุปแผนบำนาญ','สรุปแผนมรดก');
 const worksheet=parts['xl/worksheets/sheet1.xml'];parts['xl/worksheets/sheet1.xml']=worksheet.replace(/<x:mergeCells(?: count="\d+")?>/,`<x:mergeCells count="${(worksheet.match(/<x:mergeCell /g)||[]).length}">`);
 return parts;
}
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function crc32(bytes){let n=0xffffffff;for(const b of bytes)n=crcTable[(n^b)&255]^(n>>>8);return (n^0xffffffff)>>>0;}
export function zipParts(parts){
 const chunks=[],central=[];let offset=0;
 const header=size=>{const b=new Uint8Array(size);return [b,new DataView(b.buffer)];};
 for(const [path,text] of Object.entries(parts)){
  const name=encoder.encode(path),data=encoder.encode(text),crc=crc32(data);
  const [local,v]=header(30);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,name.length,true);
  chunks.push(local,name,data);
  const [dir,d]=header(46);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint32(16,crc,true);d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);central.push(dir,name);offset+=30+name.length+data.length;
 }
 const length=central.reduce((n,b)=>n+b.length,0),[end,e]=header(22);e.setUint32(0,0x06054b50,true);e.setUint16(8,central.length/2,true);e.setUint16(10,central.length/2,true);e.setUint32(12,length,true);e.setUint32(16,offset,true);
 return new Blob([...chunks,...central,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
let templatePromise;
export async function createExcelReport(result,mode){
 templatePromise??=fetch('./excel-template.json').then(r=>{if(!r.ok)throw Error('โหลดรูปแบบ Excel ไม่สำเร็จ');return r.json();}).catch(e=>{templatePromise=null;throw e;});
 return zipParts(reportParts(await templatePromise,result,mode));
}
