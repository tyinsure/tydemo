import {elapsedYearLabel} from './elapsed-year.mjs';
import {zipParts} from './excel-export.mjs';
import {LINE_CONTACT_TEXT,addLineContactLink} from './pdf-contact-link.mjs';
const money=n=>n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
export const SAVINGS_DISCLAIMER='เอกสารนี้จัดทำเพื่อเป็นข้อมูลเพื่อใช้ประกอบการตัดสินใจเท่านั้น ไม่ใช่ใบเสนอขาย';
export function savingsReportData(r,{gender='male',mode='sum',fxStart=34,fxEnd=34}={}){
 const summary=[['ทุนประกัน',r.sum],['เบี้ยประกันรายปี',r.premium],['เบี้ยรวม 6 ปี',r.totalPremium],['เงินคืนระหว่างสัญญารวม',r.cashTotal],['เงินครบสัญญา',r.maturity],['ผลประโยชน์การันตีรวม',r.guaranteedTotal]];
 if(r.indexBenefit!==null)summary.push(['ผลตอบแทนดัชนีคาดการณ์ (ไม่การันตี)',r.indexBenefit],['ยอดรับรวมคาดการณ์ (รวมเงินคืน)',r.projectedTotal],['ส่วนต่างยอดรับคาดการณ์กับเบี้ยรวม',r.projectedGain]);
 const assumptions=r.indexBenefit===null?'ไม่ได้เลือกจำลองผลตอบแทนดัชนี':`${r.assumedAnnualReturn===null?'คำนวณจากระดับดัชนีที่ระบุ':`สมมติผลตอบแทนดัชนี ${r.assumedAnnualReturn}% ต่อปี · ดัชนี 230 → ${money(r.projectedIndexEnd)}`} · PR ${r.plan.pr*100}% · อัตราแลกเปลี่ยน ${fxStart} → ${fxEnd} บาท/USD`;
 const notes=[
  'เริ่มสัญญาอายุ '+r.age+' ปี (ปีที่ 0) · ชำระเบี้ยอายุ '+r.age+'–'+(r.age+5)+' ปี · ครบสัญญาอายุ '+(r.age+15)+' ปี',
  'เงินคืนตามสัญญารวมเงินคืนเมื่อครบปี 2, 4, 6, 8, 10, 12, 14 และเงินครบสัญญาปีที่ 15 ผลตอบแทนดัชนีแสดงแยก',
  '* ประกันชีวิตแสดงค่าสูงกว่าระหว่างทุนตามขั้นบันไดและ 101% ของเบี้ยสะสม ยังไม่ได้เทียบมูลค่าเวนคืน ผลจริงต้องเทียบตามกรมธรรม์',
  'เงินครบสัญญาเท่ากับค่าสูงกว่าระหว่าง 600% ของทุนและ 101% ของเบี้ยรวม แถวครบสัญญาไม่แสดงความคุ้มครองต่อหลังครบสัญญา',
  ...(r.assumedAnnualReturn===null?[]:['การกรอก % ใช้สมมติฐานเทียบตัวอย่าง: ดัชนีเริ่ม 230 เติบโต 14 ปี 11 เดือน ปัดดัชนี 2 ตำแหน่ง ระยะนี้อนุมานจากตัวอย่าง ไม่ใช่วันลงทุนจริง']),
  'ผลตอบแทนดัชนีไม่การันตี จ่ายเฉพาะเมื่อมีชีวิตอยู่ครบสัญญา ขึ้นกับดัชนี PR และอัตราแลกเปลี่ยน ไม่ใช่ผลตอบแทนสุทธิของกรมธรรม์',
  SAVINGS_DISCLAIMER
 ];
 return {title:r.plan.name,subtitle:`${gender==='male'?'ชาย':'หญิง'} อายุ ${r.age} ปี · ${mode==='premium'?'คำนวณจากเบี้ยประกัน':'คำนวณจากทุนประกัน'} · ชำระรายปี 6 ปี คุ้มครอง 15 ปี`,summary,assumptions,notes,
  headers:['อายุ\n(ปี)','เบี้ยประกัน\n(บาท/ปี)','เบี้ยสะสม\n(บาท)','เงินคืนตามสัญญา\n(บาท)','ประกันชีวิต*\n(บาท)','ดัชนีจำลอง\nไม่การันตี (บาท)'],
  rows:r.rows.map(row=>[row.age,row.premium,row.paid,Math.round((row.cash+row.maturity)*100)/100,row.life,row.indexBenefit])};
}
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function savingsExcelParts(r,options){
 const data=savingsReportData(r,options),parts={};
 parts['[Content_Types].xml']='<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>';
 parts['_rels/.rels']='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
 const headerRow=6+data.summary.length,lastRow=headerRow+data.rows.length+data.notes.length+2;
 parts['xl/workbook.xml']='<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="สรุปแผนออมทรัพย์" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm.Print_Area" localSheetId="0">\'สรุปแผนออมทรัพย์\'!$A$1:$F$'+lastRow+'</definedName><definedName name="_xlnm.Print_Titles" localSheetId="0">\'สรุปแผนออมทรัพย์\'!$'+headerRow+':$'+headerRow+'</definedName></definedNames></workbook>';
 parts['xl/_rels/workbook.xml.rels']='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
 parts['xl/styles.xml']='<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Sarabun"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Sarabun"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFA13362"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="3"><xf fontId="0" fillId="0" borderId="0" xfId="0"><alignment wrapText="1" vertical="center"/></xf><xf fontId="1" fillId="2" borderId="0" xfId="0"><alignment wrapText="1" vertical="center"/></xf><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
 const rows=[['TYINSURE | สรุปแผนออมทรัพย์'],[data.title],[data.subtitle],...data.summary.map(([label,value])=>[label,null,null,value]),[data.assumptions],[],data.headers,...data.rows,...data.notes.map(n=>[n]),[LINE_CONTACT_TEXT]];
 const merges=['A1:F1','A2:F2','A3:F3',...data.summary.map((_,i)=>`A${i+4}:C${i+4}`),`A${data.summary.length+4}:F${data.summary.length+4}`,...Array.from({length:data.notes.length+1},(_,i)=>`A${headerRow+data.rows.length+1+i}:F${headerRow+data.rows.length+1+i}`)];
 const cell=(value,row,col)=>value===null?'':`<c r="${'ABCDEF'[col]}${row}" s="${row===headerRow||row===1?1:typeof value==='number'?2:0}" t="${typeof value==='number'?'n':'inlineStr'}">${typeof value==='number'?`<v>${value}</v>`:`<is><t xml:space="preserve">${xml(value)}</t></is>`}</c>`;
 const contactRow=rows.length;
 parts['xl/worksheets/sheet1.xml']='<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><sheetViews><sheetView workbookViewId="0"><pane ySplit="'+headerRow+'" topLeftCell="A'+(headerRow+1)+'" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+[10,23,23,29,26,29].map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')+'</cols><sheetData>'+rows.map((row,i)=>`<row r="${i+1}" ht="${i+1===headerRow?40:i===1?36:i===data.summary.length+3?48:i>=headerRow+data.rows.length?40:26}" customHeight="1">${row.map((value,j)=>cell(value,i+1,j)).join('')}</row>`).join('')+'</sheetData><mergeCells count="'+merges.length+'">'+merges.map(ref=>`<mergeCell ref="${ref}"/>`).join('')+'</mergeCells><hyperlinks><hyperlink ref="A'+contactRow+'" r:id="line"/></hyperlinks><printOptions horizontalCentered="1"/><pageMargins left="0.25" right="0.25" top="0.4" bottom="0.4" header="0.2" footer="0.3"/><pageSetup paperSize="9" orientation="portrait" fitToWidth="1" fitToHeight="0"/><headerFooter><oddFooter>&amp;LTYINSURE&amp;Rหน้า &amp;P / &amp;N</oddFooter></headerFooter></worksheet>';
 parts['xl/worksheets/_rels/sheet1.xml.rels']='<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="line" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="https://line.me/R/ti/p/@tyinsure" TargetMode="External"/></Relationships>';
 return parts;
}
export const createSavingsExcel=(r,options)=>zipParts(savingsExcelParts(r,options));
const W=595.28,H=841.89,M=28;
export function drawSavingsPDF(canvas,r,options,scale=3){
 const data=savingsReportData(r,options);canvas.width=Math.ceil(W*scale);canvas.height=Math.ceil(H*scale);
 const c=canvas.getContext('2d');c.scale(scale,scale);c.fillStyle='#fff';c.fillRect(0,0,W,H);
 const text=(value,x,y,size=9,bold=false,color='#36283b',align='left',maxWidth)=>{c.font=`${bold?'bold ':''}${size}px Sarabun`;c.fillStyle=color;c.textAlign=align;c.textBaseline='top';c.fillText(String(value),x,y,maxWidth);};
 const wrapped=(value,x,y,width,size=8,lineHeight=11)=>{let line='',lines=[];c.font=`${size}px Sarabun`;for(const ch of value){if(c.measureText(line+ch).width>width&&line){lines.push(line);line=ch;}else line+=ch;}if(line)lines.push(line);for(const s of lines){text(s,x,y,size);y+=lineHeight;}return y;};
 text('TYINSURE',M,27,18,true,'#a13362');text('สรุปแผนออมทรัพย์',W-M,30,14,true,'#a13362','right');
 text(data.title,M,59,11,true,'#36283b','left',W-2*M);text(data.subtitle,M,79,8.5);
 let y=100;
 data.summary.forEach(([label,value],i)=>{c.fillStyle=i%2?'#fff':'#f9f3f6';c.fillRect(M,y,W-2*M,17);text(label,M+6,y+3,8.5);text(money(value)+' บาท',W-M-6,y+3,9,true,'#a13362','right',200);y+=17;});
 y=wrapped(data.assumptions,M,y+8,W-2*M,8,11)+8;
 const widths=[35,98,102,108,98,98.28],top=y;
 c.fillStyle='#a13362';c.fillRect(M,y,W-2*M,33);let x=M;
 data.headers.forEach((h,i)=>{(i===0?'อายุ / ปีที่\nเริ่ม 0':h).split('\n').forEach((s,j)=>text(s,x+widths[i]/2,y+5+j*12,7.8,true,'#fff','center',widths[i]-6));x+=widths[i];});y+=33;
 data.rows.forEach((row,i)=>{c.fillStyle=i===15?'#f9eaf1':i%2?'#fff':'#fcfafb';c.fillRect(M,y,W-2*M,17);let x=M;row.forEach((value,j)=>{text(value===null?'—':j===0?value:money(value),j===0?x+widths[j]/2:x+widths[j]-4,y+(j===0?1:4),j===0?7:8,i===15,'#36283b',j===0?'center':'right',widths[j]-8);if(j===0)text(elapsedYearLabel(r,r.rows[i]),x+widths[j]/2,y+9,6,false,'#877b87','center',widths[j]-4);c.strokeStyle='#d9cbd3';c.lineWidth=.4;c.strokeRect(x,y,widths[j],17);x+=widths[j];});y+=17;});
 x=M;for(const w of widths){c.strokeRect(x,top,w,33);x+=w;}
 y+=10;for(const note of data.notes)y=wrapped(note,M,y,W-2*M,7.5,10)+4;
 if(y>795)throw Error('ข้อมูลยาวเกินพื้นที่ PDF กรุณาลดความยาวค่าที่ระบุ');
 text(LINE_CONTACT_TEXT,M,805,8,false,'#338169');text('หน้า 1 / 1',W-M,805,8,false,'#877b87','right');
 return canvas;
}
export async function createSavingsPDF(r,options,{createCanvas=()=>document.createElement('canvas'),loadFont=()=>Promise.all([document.fonts.load('9px Sarabun','แผนออมทรัพย์'),document.fonts.load('bold 9px Sarabun','แผนออมทรัพย์')])}={}){
 const [{PDFDocument,PDFString}]=await Promise.all([import('./assets/pdf-lib.min.mjs'),loadFont()]);
 const canvas=drawSavingsPDF(createCanvas(),r,options),pdf=await PDFDocument.create();pdf.setTitle('TYINSURE - '+r.plan.name);pdf.setAuthor('TYINSURE');
 const png=await pdf.embedPng(canvas.toDataURL('image/png')),page=pdf.addPage([W,H]);page.drawImage(png,{x:0,y:0,width:W,height:H});
 const c=canvas.getContext('2d');c.font='8px Sarabun';addLineContactLink(pdf,page,PDFString,{withRider:false,textWidth:c.measureText(LINE_CONTACT_TEXT).width});canvas.width=0;canvas.height=0;
 return new Blob([await pdf.save()],{type:'application/pdf'});
}
