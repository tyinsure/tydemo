import {calculateLegacy} from './health-calculator.mjs';
import {addHealthRider} from './health-rider.mjs';
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export function premiumPaymentViews(data,healthData,input,result,calculateMain=calculateLegacy){
 return data.frequencies.map(frequency=>{
  try{
   // Compare the same sum and riders; premium-mode input must not change the coverage.
   const i={...input,mode:'sum',amount:result.sum,frequency:frequency.id};
   const r=addHealthRider(calculateMain(data,i),healthData,i);
   const riders=[r.health,r.opd,r.care,r.ci,r.daily].filter(Boolean).reduce((sum,x)=>sum+x.premium,0)+(r.rider?.premium??0);
   return {id:frequency.id,label:frequency.label,main:r.premium,health:r.health?.premium,opd:r.opd?.premium,care:r.care?.premium,ci:r.ci?.premium,daily:r.daily?.premium,pa:r.rider?.premium,riders:round(riders),total:r.combinedFirstYearPremium??r.premium,sum:r.sum};
  }catch{return {id:frequency.id,label:frequency.label,unavailable:true};}
 });
}
export function premiumPaymentTable(views,result,selectedFrequency){
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=n=>n==null?'ไม่มีอัตรา':n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
 const rows=[['main','เบี้ยสัญญาหลัก'],...(result.health?[['health',result.health.label]]:[]),...(result.opd?[['opd',result.opd.label]]:[]),...(result.care?[['care','Care Plus']]:[]),...(result.ci?[['ci',result.ci.label]]:[]),...(result.daily?[['daily',result.daily.label]]:[]),...(result.rider?[['pa','PA Easy Plan Rider']]:[]),['total','เบี้ยหลักและสัญญาเพิ่มเติมรวมปีแรก']];
 const cards='<div class="premium-payment-mobile"><p class="payment-mobile-hint">แตะโหมดชำระเพื่อดูรายการเบี้ยปีแรก</p>'+views.map(v=>{
  const selected=v.id===selectedFrequency,unit={annual:'ปี',semiannual:'6เดือน',quarterly:'3เดือน',monthly:'เดือน'}[v.id]??'งวด';
  return '<details class="payment-mode-card'+(selected?' payment-mode-selected':'')+'"'+(selected?' open':'')+'><summary><span>'+esc(v.label)+(selected?'<small>โหมดที่เลือก</small>':'')+'</span><strong>'+money(v.total)+'<small>บาท/'+unit+'</small></strong></summary><dl>'+rows.map(([key,label])=>'<div class="payment-card-row'+(key==='total'?' payment-card-total':'')+'"><dt>'+esc(label)+'</dt><dd>'+money(v[key])+'<small>บาท/'+unit+'</small></dd></div>').join('')+'</dl></details>';
 }).join('')+'</div>';
 return '<table class="premium-payment-desktop"><caption>เบี้ยปีแรกแต่ละงวดชำระ สำหรับทุนและสัญญาเพิ่มเติมเดียวกัน (บาท/งวด)</caption><thead><tr><th scope="col">รายการ</th>'+views.map(v=>'<th scope="col"'+(v.id===selectedFrequency?' class="selected-payment"':'')+'>'+esc(v.label)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(([key,label])=>'<tr'+(key==='total'?' class="premium-grand-total"' :'')+'><th scope="row">'+esc(label)+'</th>'+views.map(v=>'<td'+(v.id===selectedFrequency?' class="selected-payment"':'')+'>'+money(v[key])+'</td>').join('')+'</tr>').join('')+'</tbody></table>'+cards;
}
