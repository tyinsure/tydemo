import {scheduleUnit,scheduleViewRow} from './schedule-premium-view.mjs';
import {elapsedYearLabel} from './elapsed-year.mjs';
const money=n=>n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function healthMobileSchedule(r,display='annual',openAges=new Set()){
 const unit=scheduleUnit(r,display);
 const rows=r.schedule.map(original=>{
  const row=scheduleViewRow(r,original,display),phase=row.policyYear===1?'เริ่มคุ้มครอง':row.age===99?'ครบสัญญา':row.policyYear===r.payYears?'ปีสุดท้ายที่ชำระเบี้ย':'คุ้มครอง';
  const shown=n=>n===null||n===undefined?'—':money(n),pay=n=>n?money(n):'—';
  const items=[['เบี้ยประกันชีวิต',pay(row.pay),true]];
  if(r.health)items.push(['เบี้ยประกันสุขภาพ',pay(row.healthPremium),true]);
  if(r.opd)items.push(['เบี้ย OPD',pay(row.opdPremium),true]);
  if(r.daily)items.push(['เบี้ยค่าชดเชยรายวัน',pay(row.dailyPremium),true]);
  if(r.care)items.push(['เบี้ย Care Plus',pay(row.carePremium),true]);
  if(r.ci)items.push(['เบี้ยซีไอ',shown(row.ciPremium),true]);
  if(r.rider)items.push(['เบี้ย PA',shown(row.riderPremium),true]);
  items.push(['เบี้ยประกันรวม',shown(row.totalPremium),true,'mobile-age-detail-total'],['ประกันชีวิต*',pay(row.coverage),false],['เงินครบสัญญา',pay(row.maturity),false]);
  const milestone=[1,r.payYears].includes(row.policyYear)||row.age===99;
  return `<details class="mobile-age-row${milestone?' mobile-age-milestone':''}" data-schedule-age="${row.age}"${openAges.has(row.age)?' open':''}><summary><span class="mobile-age-label"><strong>${row.age} ปี</strong><small>${escape(elapsedYearLabel(r,row))} · ${escape(phase)}</small></span><span class="mobile-age-total"><strong>${shown(row.totalPremium)}</strong><small>บาท/${unit}</small></span><span class="mobile-age-toggle" aria-hidden="true"></span><span class="mobile-age-action">ดูรายละเอียด</span></summary><dl>${items.map(([label,value,premium,css=''])=>`<div class="${css}"><dt>${escape(label)}<small>${premium?'บาท/'+unit:'บาท'}</small></dt><dd>${value}</dd></div>`).join('')}</dl></details>`;
 }).join('');
 return `<div class="mobile-age-heading"><span>อายุ</span><span>เบี้ยรวม (บาท/${unit})</span></div><p class="mobile-age-help">แตะแต่ละอายุเพื่อดูรายละเอียดเบี้ยและความคุ้มครอง</p><div class="mobile-age-list">${rows}</div>`;
}
