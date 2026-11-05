import {drawPDFDisclaimer} from './pdf-contact-link.mjs';
import {elapsedYear} from './elapsed-year.mjs';
import {scheduleUnit,scheduleViewRow} from './schedule-premium-view.mjs';
import {seniorMoney as money,seniorNotes,SENIOR_HEALTH_NOTE} from './senior-calculator.mjs';
import {zipParts} from './excel-export.mjs';
import {LINE_CONTACT_TEXT,addLineContactLink} from './pdf-contact-link.mjs';
export function seniorBenefitRows(r){
 return [
  ['กรมธรรม์หลัก',r.label],
  ['ทุนประกัน',money(r.sum)+' บาท'],['ชำระเบี้ย / คุ้มครอง',`ชำระ ${r.payYears} ปี / คุ้มครองถึงอายุ ${r.maturityAge} ปี`],
  ['เบี้ยหลัก'+r.frequencyLabel,money(r.premium)+' บาท/'+r.unit],
  ['เบี้ยหลักรวมทุกงวดต่อปี',money(r.annual)+' บาท/ปี'],
  ...(r.taxLife===null?[]:[['ส่วนเบี้ยความคุ้มครองชีวิตสำหรับภาษี',money(r.taxLife)+' บาท/ปี (ตามเงื่อนไขภาษี)']]),
  ['เจ็บป่วย ปีกรมธรรม์ที่ 1–2','102% ของเบี้ยหลักที่ชำระแล้ว'],
  ['อุบัติเหตุ ปีกรมธรรม์ที่ 1–2','ทั่วไป: 100% ของทุน + 102% ของเบี้ยหลักที่ชำระแล้ว / สาธารณะ: 200% ของทุน + 102% ของเบี้ยหลักที่ชำระแล้ว'],
  ...(r.product==='senior90'?[['ตั้งแต่ปีกรมธรรม์ที่ 3','เจ็บป่วยหรืออุบัติเหตุทั่วไป 100% ของทุน / อุบัติเหตุสาธารณะ 200% ของทุน']]:[['ปีกรมธรรม์ 3–6 / 7–10 / 11–15 / 16–20 / 21–ครบสัญญา','ทั่วไปและเจ็บป่วย: 100% / 110% / 120% / 130% / 150% ของทุน; สาธารณะ: 200% / 220% / 240% / 260% / 300% ของทุน (มีเงื่อนไขขั้นต่ำตามหมายเหตุ)']]),
  ['เงินครบสัญญา อายุ '+r.maturityAge+' ปี',money(r.maturity)+(r.product==='senior90'?' บาท (100% ของทุน)':' บาท (สูงกว่าระหว่าง 150% ของทุนและ 101% ของเบี้ยหลักที่ชำระแล้ว)')],
  ...(r.pa?[
   ['อุบัติเหตุสบายใจ แผน '+r.pa.id,'เบี้ยปีแรก '+money(r.pa.premium)+' บาท/'+r.unit],
   ['เสียชีวิต / สูญเสียอวัยวะ สายตา / ทุพพลภาพถาวรสิ้นเชิง','อุบัติเหตุทั่วไป '+money(r.pa.accident)+' บาท; รถจักรยานยนต์ '+money(r.pa.motorcycle)+' บาท; ฆาตกรรม/ทำร้ายร่างกาย '+money(r.pa.assault)+' บาท; อุบัติเหตุสาธารณะ '+money(r.pa.publicAccident)+' บาท (วงเงินสูงสุดตามเหตุการณ์)'],
   ['ค่ารักษาพยาบาลจากอุบัติเหตุ',money(r.pa.medical)+' บาท/ครั้ง'],
   ['ชดเชยจากอุบัติเหตุ ผู้ป่วยใน / ICU',money(r.pa.daily)+' / '+money(r.pa.icu)+' บาท/วัน รวมกันสูงสุด 365 วันต่ออุบัติเหตุแต่ละครั้ง'+(r.pa.icuMaxDays?' โดย ICU สูงสุด '+r.pa.icuMaxDays+' วันต่ออุบัติเหตุ':'')]
  ]:[]),
  ...(r.health?[
   ['สุขภาพวงเงินแน่นอน','เบี้ยปีแรก '+money(r.health.premium)+' บาท/'+r.unit],
   ['ชดเชยการบาดเจ็บหรือเจ็บป่วย ผู้ป่วยใน / ICU',money(r.health.daily)+' / '+money(r.health.icu)+' บาท/วัน รวมกันสูงสุด 10 วันต่อปีกรมธรรม์ (ปีที่ 1–2 คุ้มครองอุบัติเหตุเท่านั้น)']
  ]:[]),
  ['เบี้ยหลักและสัญญาเพิ่มเติมรวมปีแรก',money(r.combinedPremium)+' บาท/'+r.unit],
  ['รวมชำระปีแรกทุกงวด',money(r.combinedAnnual)+' บาท/ปี']
 ];
}
export function seniorReportSections(r){
 return [
  {title:'สรุปผลประโยชน์และความคุ้มครอง',headers:['รายละเอียด','ผลประโยชน์'],widths:[190,349.28],rows:seniorBenefitRows(r)},
  {title:r.legacyCumulativeMain?'เบี้ยรายปีและเบี้ยประกันหลักสะสม':'เบี้ยประกันรวมทุกงวดต่อปี',headers:['อายุ','ปีที่ (เริ่ม 0)','เบี้ยหลัก','เบี้ยสัญญาเพิ่มเติม',r.legacyCumulativeMain?'เบี้ยประกันหลักสะสม (บาท)':'เบี้ยรวม'],widths:[40,60,140,150,149.28],rows:r.schedule.map(x=>[x.age,elapsedYear(r,x),x.pay,Math.round((x.paPay+x.dailyPay)*100)/100,r.legacyCumulativeMain?x.paid:x.total])},
  {title:r.product==='senior90'?'ผลประโยชน์เสียชีวิตและเงินครบสัญญา (บาท)':'ผลประโยชน์เสียชีวิตขั้นต่ำและเงินครบสัญญา (บาท)',headers:['อายุ','กรณีเสียชีวิต','กรณีเสียชีวิตจากอุบัติเหตุ','เงินครบสัญญา'],widths:[37,160,180,162.28],rows:r.schedule.map(x=>[x.age,x.illness,x.combinedAccident,x.maturity])},
  {title:'เงื่อนไขและหมายเหตุ',headers:['หมายเหตุ'],widths:[539.28],rows:seniorNotes(r).map(n=>[n])}
 ];
}
// A4 portrait: premiums and benefits share one row per age. Excel keeps its separate sheets.
export function seniorPDFLayouts(r,measure){
 const widths=[40,77,78,78,88,92,86.28],fontSize=8.5,lineHeight=10;
 const wrap=(value,width)=>{
  const valueText=typeof value==='number'?money(value):String(value),lines=[];let line='';
  for(const ch of valueText){if(ch==='\n'||measure(line+ch)>width){if(line)lines.push(line);line=ch==='\n'?'':ch;}else line+=ch;}
  if(line||!lines.length)lines.push(line);return lines;
 };
 const unit=scheduleUnit(r,r.schedulePremiumDisplay);
 const headers=['อายุ/ปีที่\nเริ่ม 0',`เบี้ยหลัก\n(บาท/${unit})`,`เบี้ยสัญญา\nเพิ่มเติม\n(บาท/${unit})`,r.legacyCumulativeMain?'เบี้ยประกัน\nหลักสะสม\n(บาท)':`เบี้ยรวม\n(บาท/${unit})`,'กรณีเสียชีวิต\n(บาท)','กรณีเสียชีวิต\nจากอุบัติเหตุ\n(บาท)','เงินครบสัญญา\n(บาท)'];
 const header=headers.map((text,i)=>wrap(text,widths[i]-8)),headerHeight=Math.max(...header.map(x=>x.length))*lineHeight+8;
 const noteLines=r.health?SENIOR_HEALTH_NOTE.split('\n').flatMap(line=>wrap(line,539.28)):[],noteHeight=noteLines.length?28+noteLines.length*13:0;
 const available=744-105-headerHeight-noteHeight,rowHeight=Math.floor(Math.min(18,available/r.schedule.length)*100)/100;
 const rows=r.schedule.map(original=>{const x=scheduleViewRow(r,original,r.schedulePremiumDisplay);return {height:rowHeight,lines:[String(x.age),money(x.pay),money(Math.round((x.paPay+x.dailyPay)*100)/100),money(r.legacyCumulativeMain?original.paid:x.total),money(x.illness),money(x.combinedAccident),money(x.maturity)].map(value=>[value])};});
 return [{title:r.schedulePremiumDisplay==='modal'?'ตารางเบี้ยตามโหมดชำระและผลประโยชน์ (บาท)':'ตารางเบี้ยประกันและผลประโยชน์รายปี (บาท)',widths,header,headerHeight,noteLines,noteHeight,rows,fontSize:Math.min(fontSize,rowHeight-2),lineHeight}];
}
export function drawSeniorPDFPage(canvas,r,page,index,total,scale=3){
 const W=595.28,H=841.89;canvas.width=Math.ceil(W*scale);canvas.height=Math.ceil(H*scale);
 const c=canvas.getContext('2d');c.scale(scale,scale);c.fillStyle='#fff';c.fillRect(0,0,W,H);
 const text=(s,x,y,size=9,color='#36283b',bold=false,align='left')=>{c.font=`${bold?'bold ':''}${size}px Sarabun`;c.fillStyle=color;c.textBaseline='top';c.textAlign=align;c.fillText(s,x,y);};
 text('TYINSURE · '+r.productName,28,28,16,'#a13362',true);
 text(`${r.label} · ${r.gender==='male'?'ชาย':'หญิง'} อายุ ${r.age} ปี · ทุน ${money(r.sum)} บาท · ${r.frequencyLabel}`,28,55,9);
 text(page.title,28,80,11,'#a13362',true);text('ปีที่นับจากเริ่มสัญญา: ชำระเบี้ยครั้งแรก = ปีที่ 0',28,95,7,'#877b87');
 let y=105;
 const row=(lines,height,head=false,odd=false,source)=>{let x=28;c.fillStyle=head?'#a13362':odd?'#f9f3f6':'#fff';c.fillRect(28,y,539.28,height);
  lines.forEach((list,i)=>{
   list.forEach((s,k)=>{if(head)text(s,x+page.widths[i]/2,y+4+k*page.lineHeight,8.5,'#fff',true,'center');else if(i===0){text(s,x+3,y+(height-page.fontSize)/2,8,'#36283b');text('/'+elapsedYear(r,source),x+page.widths[i]-3,y+(height-page.fontSize)/2,7,'#877b87',false,'right');}else text(s,x+page.widths[i]-4,y+(height-page.fontSize)/2,page.fontSize,'#36283b',false,'right');});
   c.strokeStyle='#d9cbd3';c.lineWidth=.4;c.strokeRect(x,y,page.widths[i],height);x+=page.widths[i];
  });y+=height;
 };
 row(page.header,page.headerHeight,true);page.rows.forEach((item,i)=>row(item.lines,item.height,false,i%2===0,r.schedule[i]));
 if(page.noteLines.length)text('หมายเหตุ',28,y+12,9,'#a13362',true);
 page.noteLines.forEach((s,i)=>text(s,28,y+28+i*13,9));
 text(r.product==='senior90'?'ผลประโยชน์ตามสัญญาหลักและสัญญาเพิ่มเติมที่เลือก · รายละเอียดตามกรมธรรม์':'* แสดงขั้นต่ำที่คำนวณได้ ยังไม่รวมมูลค่าเวนคืน · รายละเอียดตามหมายเหตุและกรมธรรม์',28,767,8);
 if(r.legacyCumulativeMain)text('เบี้ยประกันหลักสะสมรวมทุกงวดตั้งแต่ปีแรกถึงปีนั้น เฉพาะสัญญาหลัก ไม่รวมสัญญาเพิ่มเติม (บาท)',28,783,8);
 text(LINE_CONTACT_TEXT,28,809,8,'#338169');text(`หน้า ${index+1} / ${total}`,510,809,8);
 drawPDFDisclaimer(canvas.getContext('2d'));return canvas;
}
export async function createSeniorPDF(r,{createCanvas=()=>document.createElement('canvas'),loadFont=()=>document.fonts.load('9px Sarabun','วัยเก๋าคุ้มได้ใจ')}={}){
 const [{PDFDocument,PDFString}]=await Promise.all([import('./assets/pdf-lib.min.mjs'),loadFont()]);
 const measureCanvas=createCanvas(),c=measureCanvas.getContext('2d');c.font='8.5px Sarabun';
 const layouts=seniorPDFLayouts(r,s=>c.measureText(s).width),pdf=await PDFDocument.create();pdf.setTitle('TYINSURE - '+r.productName+' '+(r.product==='senior90'?'90/90':'99/10'));pdf.setAuthor('TYINSURE');
 for(let i=0;i<layouts.length;i++){
  const canvas=drawSeniorPDFPage(createCanvas(),r,layouts[i],i,layouts.length),png=await pdf.embedPng(canvas.toDataURL('image/png')),page=pdf.addPage([595.28,841.89]);page.drawImage(png,{x:0,y:0,width:595.28,height:841.89});
  canvas.getContext('2d').font='8px Sarabun';addLineContactLink(pdf,page,PDFString,{withRider:false,textWidth:canvas.getContext('2d').measureText(LINE_CONTACT_TEXT).width});canvas.width=0;canvas.height=0;
 }
 return new Blob([await pdf.save()],{type:'application/pdf'});
}
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function seniorExcelParts(r){
 const sections=seniorReportSections(r),names=['สรุปความคุ้มครอง','เบี้ยรายปี','ผลประโยชน์รายปี','เงื่อนไข'],parts={};
 parts['[Content_Types].xml']='<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sections.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')+'</Types>';
 parts['_rels/.rels']='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
 parts['xl/workbook.xml']='<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+names.map((n,i)=>`<sheet name="${n}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')+'</sheets></workbook>';
 parts['xl/_rels/workbook.xml.rels']='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sections.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')+'<Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
 parts['xl/styles.xml']='<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Sarabun"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Sarabun"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFA13362"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="3"><xf fontId="0" fillId="0" borderId="0" xfId="0"><alignment wrapText="1" vertical="top"/></xf><xf fontId="1" fillId="2" borderId="0" xfId="0"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
 sections.forEach((s,i)=>{
  const rows=[[r.label],[(r.gender==='male'?'ชาย':'หญิง')+' อายุ '+r.age+' ปี · ทุน '+money(r.sum)+' บาท'],s.headers,...s.rows];
  parts[`xl/worksheets/sheet${i+1}.xml`]='<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+s.widths.map((w,j)=>`<col min="${j+1}" max="${j+1}" width="${Math.max(12,w/5)}" customWidth="1"/>`).join('')+'</cols><sheetData>'+rows.map((row,k)=>`<row r="${k+1}" ht="${k<3?30:i===0?80:i===3?80:25}" customHeight="1">`+row.map((v,j)=>`<c r="${String.fromCharCode(65+j)}${k+1}" s="${k===2?1:typeof v==='number'?2:0}" t="${typeof v==='number'?'n':'inlineStr'}">${typeof v==='number'?`<v>${v}</v>`:`<is><t xml:space="preserve">${xml(v)}</t></is>`}</c>`).join('')+'</row>').join('')+'</sheetData><pageMargins left="0.25" right="0.25" top="0.4" bottom="0.4" header="0.2" footer="0.2"/><pageSetup paperSize="9" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>';
  if(s.headers.length>1){const last=String.fromCharCode(64+s.headers.length),key=`xl/worksheets/sheet${i+1}.xml`;parts[key]=parts[key].replace('</sheetData>',`</sheetData><mergeCells count="2"><mergeCell ref="A1:${last}1"/><mergeCell ref="A2:${last}2"/></mergeCells>`);}
 });return parts;
}
export const createSeniorExcel=r=>zipParts(seniorExcelParts(r));
