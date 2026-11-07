export const LINE_CONTACT_URL='https://line.me/R/ti/p/@tyinsure';
export const LINE_CONTACT_TEXT=`ทัก LINE @TYINSURE   ${LINE_CONTACT_URL}`;

// Canvas text is an image in the PDF; add a native URI annotation above it.
export function addLineContactLink(pdf,page,PDFString,{withRider,textWidth}){
 const x=28,canvasY=PDF_CONTACT_Y,height=page.getHeight();
 const annotation=pdf.context.obj({
  Type:'Annot',Subtype:'Link',
  Rect:[x,height-canvasY-8,Math.min(x+textWidth,page.getWidth()-28),height-canvasY+8],
  Border:[0,0,0],
  A:{Type:'Action',S:'URI',URI:PDFString.of(LINE_CONTACT_URL)}
 });
 page.node.addAnnot(pdf.context.register(annotation));
}

export const PDF_DISCLAIMER='เอกสารนี้จัดทำเพื่อเป็นข้อมูลสำหรับใช้ประกอบการตัดสินใจ โดยอ้างอิงข้อมูลทั้งหมดจากบริษัทเท่านั้น ไม่ใช่ใบเสนอขาย';
export function drawPDFDisclaimer(context){
 context.font='8px Sarabun';context.fillStyle='#766775';context.textAlign='left';context.textBaseline='top';
 context.fillText(PDF_DISCLAIMER,28,PDF_DISCLAIMER_Y,539.28);
}

// Shared A4 footer: all text ends above the 16pt print-safe bottom margin.
export const PDF_CONTACT_Y=803;
export const PDF_DISCLAIMER_Y=815;
export function drawPDFFooter(context,index,total){
 context.font='8px Sarabun';context.textBaseline='top';context.textAlign='left';context.fillStyle='#338169';
 context.fillText(LINE_CONTACT_TEXT,28,PDF_CONTACT_Y,430);
 context.textAlign='right';context.fillStyle='#877b87';context.fillText(`หน้า ${index+1} / ${total}`,567.28,PDF_CONTACT_Y,90);
 drawPDFDisclaimer(context);
}
