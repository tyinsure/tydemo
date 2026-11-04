import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PDFDocument,PDFName,PDFArray,PDFDict,PDFString} from './dist/assets/pdf-lib.min.mjs';
import {createPDFReport as pensionPDF} from './dist/pdf-export.mjs';
import {createPDFReport as healthPDF} from './dist/health-pdf-export.mjs';
import {calculate} from './dist/calculator.mjs';
import {calculateLegacy as legacy} from './dist/legacy-calculator.mjs';
import {calculateLegacy as healthMain} from './dist/health-calculator.mjs';
import {addHealthRider,healthReportResult} from './dist/health-rider.mjs';
import {LINE_CONTACT_URL} from './dist/pdf-contact-link.mjs';
const plans=JSON.parse(await fs.readFile('dist/plans.json')),rates=JSON.parse(await fs.readFile('dist/health-rates.json')),addons=JSON.parse(await fs.readFile('dist/health-premiums.json'));
const input={age:35,gender:'male',mode:'sum',amount:1000000,frequency:'annual'};
const rows=[
 [pensionPDF,calculate(plans,{...input,planId:plans[0].id})],
 [pensionPDF,legacy(rates,input)],
 [pensionPDF,legacy(rates,{...input,paEnabled:true,paPlan:1})],
 [healthPDF,healthReportResult(addHealthRider(healthMain(rates,{...input,mainPlan:'smart9999-large'}),addons,input))],
 [healthPDF,healthReportResult(addHealthRider(healthMain(rates,input),addons,{...input,healthProduct:'dhealth',healthBenefit:'5000000',healthType:'none',healthOption:'ded0'}))]
];
const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=';
let pages=0;
for(const [create,r] of rows){
 const c={scale(){},fillRect(){},fillText(){},measureText:t=>({width:String(t).length*4}),beginPath(){},moveTo(){},lineTo(){},stroke(){}};
 const blob=await create(r,'sum',{loadFont:async()=>{},createCanvas:()=>({getContext:()=>c,toDataURL:()=>pixel})});
 const pdf=await PDFDocument.load(await blob.arrayBuffer());
 for(const page of pdf.getPages()){
  const annotations=page.node.lookup(PDFName.of('Annots'),PDFArray);assert.equal(annotations.size(),1);
  const link=annotations.lookup(0,PDFDict),action=link.lookup(PDFName.of('A'),PDFDict);
  assert.equal(link.get(PDFName.of('Subtype')).toString(),'/Link');assert.equal(action.get(PDFName.of('S')).toString(),'/URI');
  assert.equal(action.lookup(PDFName.of('URI'),PDFString).decodeText(),LINE_CONTACT_URL);
  const rect=link.lookup(PDFName.of('Rect'),PDFArray).asArray().map(n=>n.asNumber()),y=page.getHeight()-(r.type==='legacy'&&r.rider?819:809);
  assert.ok(rect[0]>=0&&rect[2]<=page.getWidth());assert.ok(rect[1]<y&&rect[3]>y);assert.ok(rect[1]>0);
  pages++;
 }
}
console.log(`PASS: native LINE URI annotations on all ${pages} PDF pages across pension, Legacy and Health; correct destinations and both footer positions`);
