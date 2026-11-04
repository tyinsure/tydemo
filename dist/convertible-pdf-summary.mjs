import {LINE_CONTACT_TEXT} from './pdf-contact-link.mjs';
export function drawConvertibleSummary(canvas,r,index,total,scale){
 const W=595.28,H=841.89,M=28;
 canvas.width=Math.ceil(W*scale);canvas.height=Math.ceil(H*scale);
 const c=canvas.getContext('2d');c.scale(scale,scale);c.fillStyle='#FFFFFF';c.fillRect(0,0,W,H);
 const text=(s,y,size=10,color='#36283b')=>{c.font=`${size}px Sarabun`;c.fillStyle=color;c.textAlign='left';c.fillText(s,M,y);};
 text('TYINSURE',37,18,'#A13362');text('D Health Lite · Convertible Option',75,16,'#A13362');
 let y=108;
 const paragraph=s=>{let line='';c.font='10px Sarabun';for(const ch of s){if(c.measureText(line+ch).width>W-2*M){text(line,y);y+=18;line=ch;}else line+=ch;}if(line){text(line,y);y+=18;}y+=12;};
 paragraph(r.health.detail);
 for(const note of r.health.convertibleNotes)paragraph(note);
 paragraph('ตารางปรับเบี้ยตั้งแต่อายุใช้สิทธิ์ตามอัตราแผน Deductible ใหม่และอายุในปีนั้น ไม่เปลี่ยนเบี้ยก่อนใช้สิทธิ์');
 paragraph('แบบจำลองนี้สมมติถือ D Health Lite ต่อเนื่องจากอายุเริ่มประกันที่ระบุ การอนุมัติใช้สิทธิ์เป็นไปตามเงื่อนไขบริษัท');
 if(y>790)throw Error('สรุป Convertible Option เกินพื้นที่ A4');
 text(LINE_CONTACT_TEXT,819,8,'#338169');c.textAlign='right';c.fillStyle='#877b87';c.fillText(`หน้า ${index+1} / ${total}`,W-M,819);
 return canvas;
}
