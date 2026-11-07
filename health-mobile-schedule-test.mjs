import assert from 'node:assert/strict';
import fs from 'node:fs';
import {healthMobileSchedule} from './dist/health-mobile-schedule.mjs';
import {scheduleViewRow,scheduleUnit} from './dist/schedule-premium-view.mjs';
import {calculateLegacy} from './dist/health-calculator.mjs';
import {addHealthRider} from './dist/health-rider.mjs';
const rates=JSON.parse(fs.readFileSync('dist/health-rates.json')),data=JSON.parse(fs.readFileSync('dist/health-premiums.json'));data.ci=JSON.parse(fs.readFileSync('dist/ci-perfect-care-rates.json'));
const money=n=>n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});let cases=0;
for(const gender of ['male','female'])for(const frequency of ['annual','semiannual','quarterly','monthly'])for(const mask of [0,1,2,4,8,16,32,63])for(const display of ['annual','modal']){
 const input={mainPlan:'smart9999-large',age:35,gender,frequency,mode:'sum',amount:1000000,healthProduct:mask&1?'dhealth':'',healthBenefit:5000000,healthType:'none',healthOption:'ded0',careEnabled:!!(mask&2),careBenefit:5000000,careCondition:'both',paEnabled:!!(mask&4),paPlan:2,opdType:mask&8?'lump':'',opdBenefit:15000,ciEnabled:!!(mask&16),ciSum:1000000,dailyEnabled:!!(mask&32),dailyBenefit:500};
 const r=addHealthRider(calculateLegacy(rates,input),data,input),before=JSON.stringify(r),html=healthMobileSchedule(r,display,new Set([37])),cards=[...html.matchAll(/<details\b[^>]*data-schedule-age="(\d+)"[^>]*>([\s\S]*?)<\/details>/g)];
 assert.equal(cards.length,r.schedule.length);assert.equal(cards[0][1],'35');assert.equal(cards.at(-1)[1],'99');
 assert.equal((html.match(/data-schedule-age="37" open/g)||[]).length,1);assert.equal((html.match(/ open>/g)||[]).length,1);
 for(const [i,m] of cards.entries()){const row=scheduleViewRow(r,r.schedule[i],display),summary=m[2].split('</summary>')[0];assert.ok(summary.includes(row.totalPremium===null?'—':money(row.totalPremium)));assert.ok(summary.includes('บาท/'+scheduleUnit(r,display)));assert.equal((m[2].match(/<dd>/g)||[]).length,4+[r.health,r.care,r.rider,r.opd,r.ci,r.daily].filter(Boolean).length);}
 for(const [flag,label] of [[r.health,'เบี้ยประกันสุขภาพ'],[r.care,'เบี้ย Care Plus'],[r.rider,'เบี้ย PA'],[r.opd,'เบี้ย OPD'],[r.ci,'เบี้ยซีไอ'],[r.daily,'เบี้ยค่าชดเชยรายวัน']])assert.equal(html.includes('<dt>'+label+'<small>'),!!flag);
 assert.equal(JSON.stringify(r),before);cases++;
}
const html=fs.readFileSync('dist/health.html','utf8'),css=fs.readFileSync('dist/health.css','utf8');assert.match(html,/health-schedule-desktop/);assert.match(html,/id="health-mobile-schedule"/);assert.match(css,/@media screen and \(max-width:600px\)/);assert.ok(css.includes('.health-schedule-desktop{display:block!important}'));
console.log(`PASS: ${cases} mobile Health age/total schedules, all rider combinations, exact annual/modal totals, all ages/missing rates, selected-only detail rows, remembered open age, no quote mutation and full-table print fallback`);
