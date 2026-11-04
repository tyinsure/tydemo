import assert from 'node:assert/strict';
import fs from 'node:fs';
import {elapsedYear,elapsedYearLabel} from './dist/elapsed-year.mjs';
import {calculate} from './dist/calculator.mjs';
import {calculateLegacy} from './dist/health-calculator.mjs';
import {calculateLegacy as legacy} from './dist/legacy-calculator.mjs';
import {calculateSenior} from './dist/senior-calculator.mjs';
import {calculateSavings} from './dist/savings-calculator.mjs';
import {drawPDFPage,reportPageLayouts} from './dist/pdf-export.mjs';
import {drawPDFPage as healthDraw,reportPageLayouts as healthPages} from './dist/health-pdf-export.mjs';
import {drawSeniorPDFPage,seniorPDFLayouts,seniorReportSections} from './dist/senior-report.mjs';
import {drawSavingsPDF} from './dist/savings-report.mjs';
const read=name=>JSON.parse(fs.readFileSync('dist/'+name));
const plans=read('plans.json');let count=0;
const check=(r,rows)=>{const snapshot=JSON.stringify(rows);assert.equal(elapsedYear(r,rows[0]),0);for(const row of rows){assert.equal(elapsedYear(r,row),row.age-r.age);assert.equal(elapsedYearLabel(r,row),'ปีที่ '+(row.age-r.age));}assert.equal(JSON.stringify(rows),snapshot);count++;};
const recordings=()=>{const texts=[];return {texts,canvas:{getContext:()=>({scale(){},fillRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},measureText:s=>({width:String(s).length*3.5}),fillText:s=>texts.push(String(s))})}};};
for(const p of plans){const r=calculate(plans,{planId:p.id,gender:'male',age:35,mode:'sum',amount:1000000,frequency:'annual'});check(r,r.schedule);const {texts,canvas}=recordings();for(const [i,l] of reportPageLayouts(r).entries())drawPDFPage(canvas,r,'sum',l,i,1,1);for(const row of r.schedule)assert.ok(texts.includes(elapsedYearLabel(r,row)));}
for(const mainPlan of ['smart9920','smart9999-small','smart9999-large','wholelife50000']){const r=calculateLegacy(read('health-rates.json'),{mainPlan,age:35,gender:'male',mode:'sum',amount:mainPlan==='wholelife50000'?50000:mainPlan==='smart9999-small'?100000:1000000,frequency:'annual'});check(r,r.schedule);assert.equal(r.schedule[0].policyYear,1);const {texts,canvas}=recordings();for(const [i,l] of healthPages(r).entries())healthDraw(canvas,r,'sum',l,i,1,1);for(const row of r.schedule)assert.ok(texts.includes(elapsedYearLabel(r,row)));}
for(const file of ['senior-rates.json','senior90-rates.json'])for(const age of (file==='senior90-rates.json'?[50,75]:[50,79])){const r=calculateSenior(read(file),{age,gender:'male',sum:200000,frequency:'annual',paEnabled:false,dailyEnabled:false});check(r,r.schedule);assert.equal(r.schedule[0].policyYear,1);const {texts,canvas}=recordings(),layout=seniorPDFLayouts(r,s=>s.length*3.5)[0];drawSeniorPDFPage(canvas,r,layout,0,1,1);for(const row of r.schedule)assert.ok(texts.includes('/'+elapsedYear(r,row)));const excel=seniorReportSections(r)[1].rows;assert.equal(excel[0][1],0);assert.equal(excel.at(-1)[1],r.maturityAge-age);if(age===79){assert.equal(elapsedYear(r,r.schedule.find(x=>x.age===81)),2);assert.equal(elapsedYear(r,r.schedule.find(x=>x.age===84)),5);}}
const lr=legacy(read('legacy-rates.json'),{age:35,gender:'male',amount:1000000,mode:'sum',frequency:'annual'});check(lr,lr.schedule);
for(const plan of ['standard','pro']){const r=calculateSavings({plan,age:35,mode:'sum',amount:1000000});check(r,r.rows);const {texts,canvas}=recordings();drawSavingsPDF(canvas,r,{},1);for(const row of r.rows)assert.ok(texts.includes(elapsedYearLabel(r,row)));assert.equal(r.rows.at(-1).age,50);}
for(const name of ['app.mjs','legacy.mjs','health.mjs','senior-planner.mjs','savings.mjs'])assert.ok(fs.readFileSync('dist/'+name,'utf8').includes('elapsedYearLabel('));
console.log(`PASS: ${count} product timelines and all PDF table labels start at0; age79→81 is year2; contract years/benefits preserved; senior Excel consistent`);
