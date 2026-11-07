import {calculateLegacy} from './health-calculator.mjs';
import {addHealthRider,validateMainRiders,healthOptions} from './health-rider.mjs';
import {eliteBenefits} from './extra-health-pdf-summary.mjs';
import {dhealthBenefits} from './dhealth-pdf-summary.mjs';
import {extraBenefits,extraICULimit} from './maochai-extra.mjs';
export const COMPARISON_PLANS=[
 {id:'elite',name:'แผน 1',label:'Elite Health Plus 20ล้าน',healthProduct:'elite',care:false},
 {id:'dhealth-care',name:'แผน 2+',label:'D Health Lite 5ล้าน + Care Plus 5ล้าน',healthProduct:'dhealth',care:true},
 {id:'dhealth',name:'แผน 2',label:'D Health Lite 5ล้าน',healthProduct:'dhealth',care:false},
 {id:'extra-care',name:'แผน 3+',label:'เหมาจ่าย Extra 500,000 + Care Plus 5ล้าน',healthProduct:'maochai-extra',care:true},
 {id:'extra',name:'แผน 3',label:'เหมาจ่าย Extra 500,000',healthProduct:'maochai-extra',care:false}
];
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
const money=n=>n.toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
export function healthComparison(data,healthData,input,{respectDeduct=true,includeOtherRiders=true}={}){
 const main=calculateLegacy(data,input);
 const columns=COMPARISON_PLANS.map(original=>{
  const benefit=respectDeduct?Number(input.healthBenefit):5000000;
  const responsibility=healthOptions(benefit,respectDeduct?input.healthType:'none').find(o=>o.id===(respectDeduct&&input.healthType!=='none'?input.healthOption:'ded0'))?.label??'ตามตัวเลือกในฟอร์ม';
  const plan={...original,...(original.healthProduct==='dhealth'?{label:'D Health Lite '+benefit/1000000+'ล้าน'+(original.care?' + Care Plus 5ล้าน':''),benefit,responsibility}:{})};
  const quoteInput={...input,mode:'sum',amount:main.sum,healthProduct:plan.healthProduct,healthPlan:1,healthArea:0,extraPlan:3,healthBenefit:benefit,healthType:respectDeduct?input.healthType:'none',healthOption:respectDeduct?input.healthOption:'ded0',healthConvertible:respectDeduct&&input.healthConvertible,careEnabled:plan.care,careBenefit:5000000,careCondition:'both',...(!includeOtherRiders?{opdType:'',dailyEnabled:false,ciEnabled:false}:{})};
  try{
   const result=addHealthRider(main,healthData,quoteInput);validateMainRiders(result);
   const other=round((result.opd?.premium??0)+(result.daily?.premium??0)+(result.ci?.premium??0));
   return {...plan,result,prices:{main:result.premium,health:result.health.premium,care:result.care?.premium??0,opd:result.opd?.premium??0,daily:result.daily?.premium??0,ci:result.ci?.premium??0,pa:result.rider?.premium??0,other,total:result.combinedFirstYearPremium,annual:result.combinedFirstYearAnnual}};
  }catch(error){return {...plan,error:error.message};}
 });
 const selectedRiderRows=includeOtherRiders?[...(input.opdType?[['opd',input.opdType==='per-visit'?'เบี้ย OPD ต่อครั้ง':'เบี้ย OPD เหมาจ่าย']]:[]),...(input.dailyEnabled?[['daily','เบี้ยค่าชดเชยรายวัน']]:[]),...(input.ciEnabled?[['ci','เบี้ยซีไอ เพอร์เฟค แคร์']]:[])]:[];
 return {main,columns,includeOtherRiders,respectDeduct,selectedRiderRows};
}
function coverage(plan){
 return plan.healthProduct==='elite'?eliteBenefits(1):plan.healthProduct==='dhealth'?dhealthBenefits(plan.benefit):extraBenefits(3);
}
export function comparisonCoverageRows(comparison){
 const get=(p,prefix)=>coverage(p).find(([label])=>label.startsWith(prefix))?.[1]??'ดูเงื่อนไขสัญญา';
 const elite=p=>p.healthProduct==='elite',extra=p=>p.healthProduct==='maochai-extra';
 const cancerKidney=p=>elite(p)?'20,000,000 บาท/ปี\n(ภายใต้วงเงินรวมของแผน)':p.care?'5,000,000 บาท/ปี\n(วงเงินร่วมมะเร็งและไตวายเรื้อรัง)':'ไม่คุ้มครอง';
 const rows=[
 ['ทุนประกันชีวิต',()=>money(comparison.main.sum)+' บาท','sum'],
 ['1. ค่าห้อง',p=>extra(p)?'4,000 บาท/วัน':elite(p)?'10,000 บาท/คืน หรือห้องเดี่ยวมาตรฐาน\n(ขึ้นกับจำนวนใดสูงกว่า)':(p.benefit===1000000?'2,000':'4,000')+' บาท/วัน'],
 ['ห้อง ICU',p=>extra(p)?extraICULimit(3).toLocaleString('th-TH')+' บาท/วัน (ICU)\nสูงสุด 15 วัน':'เหมาจ่ายตามจริง (ICU)'],
 ['จำนวนวันค่าห้องและ ICU รวมต่อครั้ง',p=>elite(p)?'รวมสูงสุด 365 วัน/ครั้ง':extra(p)?'รวมสูงสุด 120 วัน/ครั้ง':'รวมสูงสุด 180 วัน/ครั้ง\n(ICU สูงสุด 60 วัน)'],
 ['2. ค่ารักษาพยาบาลผู้ป่วยใน',p=>elite(p)?'20,000,000 บาท/ปี':extra(p)?'500,000 บาท/ครั้ง':p.benefit.toLocaleString('th-TH')+' บาท/ครั้ง','limit'],
 ['Deduct / Copay',p=>p.healthProduct==='dhealth'?p.responsibility:'ไม่มีความรับผิดส่วนแรกและส่วนร่วมจ่าย'],
 ['2.1. ค่ายากลับบ้าน',p=>extra(p)?'1,000 บาท (สำหรับกิน 7 วัน)':elite(p)?'100,000 บาท (สำหรับกิน 30 วัน)':'20,000 บาท (สำหรับกิน 14 วัน)'],
 ['3. ค่าหมอเยี่ยมไข้',p=>get(p,'3. ')],
 ['4. ค่าผ่าตัด (กรณีนอน รพ.)',p=>get(p,'4. ')],
 ['5. ค่าผ่าตัดใหญ่ (กรณีไม่นอน รพ.)',p=>get(p,'5. ')],
 ['6.1. ค่าตรวจวินิจฉัย เช่น X-Ray / RT-PCR ที่เกี่ยวกับการแอดมิท',p=>extra(p)?'ไม่คุ้มครอง':'จ่ายตามจริง\n(ภายใน 30 วันก่อน/หลังแอดมิท)'],
 ['6.2. ค่านัดติดตามอาการภายใน 30 วันหลังแอดมิท',p=>extra(p)?'ไม่คุ้มครอง':'จ่ายตามจริง (ไม่จำกัดจำนวนครั้ง)'],
 ['7. ค่ารักษาอุบัติเหตุครั้งแรก (ผู้ป่วยนอก)',p=>extra(p)?'ไม่คุ้มครอง':elite(p)?'20,000,000 บาท/ปี\n(ภายใน 24 ชั่วโมง ภายใต้วงเงินรวม)':p.benefit.toLocaleString('th-TH')+' บาท/ครั้ง\n(ภายใน 24 ชั่วโมง ภายใต้วงเงินแผน)'],
 ['7.1. ค่ารักษาจากอุบัติเหตุ (PA ที่เลือก)',()=>comparison.main.rider?money(comparison.main.rider.medical)+' บาท/ครั้ง':'ไม่ได้เลือก PA'],
 ['8. ค่าเวชศาสตร์ฟื้นฟูหลังออกจาก รพ.',p=>extra(p)?'ไม่คุ้มครอง':elite(p)?'จ่ายตามจริง\n(ไม่จำกัดจำนวนครั้งใน 30 วัน)':'จ่ายตามจริง (ไม่จำกัดจำนวนครั้ง)'],
 ['9. ค่ารักษาไตวายเรื้อรังแบบผู้ป่วยนอก (ต่อปี)',cancerKidney,'limit'],
 ['10–11. ค่ารักษาโรคมะเร็งแบบผู้ป่วยนอก (ต่อปี)',cancerKidney,'limit'],
 ['12. ค่ารถพยาบาลฉุกเฉิน',p=>extra(p)?'จ่ายตามจริง\n(ไม่เกินผลประโยชน์หมวดที่ 1)':'จ่ายตามจริง'],
 ['13. ค่าผ่าตัดเล็ก (กรณีไม่ได้นอน รพ.)',p=>get(p,'13. ')],
 ['14. การตรวจ MRI / CT Scan / PET Scan',p=>elite(p)?'เหมาจ่ายตามจริง\nตามเงื่อนไขการวินิจฉัยขั้นสูง':extra(p)?'ผู้ป่วยนอก: ไม่คุ้มครอง\nผู้ป่วยใน: ตามหมวดตรวจวินิจฉัย':'จ่ายตามจริง เมื่อเกี่ยวข้องกับการแอดมิท\n(ภายใน 30 วันก่อน/หลังแอดมิท)'],
 ['การปรับเบี้ยประกัน',()=> 'ปรับตามช่วงอายุในตาราง\nการต่ออายุเป็นไปตามเงื่อนไขสัญญา','renewal']
 ];
 return rows.map(([label,value,kind])=>({label,kind,values:comparison.columns.map(value)}));
}
export function healthComparisonTable(comparison){
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cols=comparison.columns,unit={annual:'ปี',semiannual:'6เดือน',quarterly:'3เดือน',monthly:'เดือน'}[comparison.main.frequency.id];
 const priceRows=[['main','เบี้ยสัญญาหลัก'],['health','เบี้ยประกันสุขภาพ'],['care','เบี้ย Care Plus'],['pa','เบี้ย PA ที่เลือก'],...comparison.selectedRiderRows,['total','เบี้ยรวม'+comparison.main.frequency.label+' (บาท/'+unit+')']];
 return '<table class="health-comparison-table"><caption>เปรียบเทียบความคุ้มครองและเบี้ย'+esc(comparison.main.frequency.label)+'</caption><thead><tr><th scope="col">ความคุ้มครอง</th>'+cols.map(p=>'<th scope="col"><span>'+p.name+'</span><strong>'+esc(p.label)+'</strong></th>').join('')+'</tr></thead><tbody>'+comparisonCoverageRows(comparison).map(row=>'<tr'+(row.kind?' class="comparison-'+row.kind+'"':'')+'><th scope="row">'+esc(row.label)+'</th>'+row.values.map(v=>'<td>'+esc(v).replaceAll('\n','<br>')+'</td>').join('')+'</tr>').join('')+'</tbody><tfoot>'+priceRows.map(([key,label])=>'<tr class="'+(key==='total'?'comparison-total':'comparison-price')+'"><th scope="row">'+esc(label)+'</th>'+cols.map(p=>'<td>'+(!p.prices?'—':money(p.prices[key]))+'</td>').join('')+'</tr>').join('')+'<tr class="comparison-status"><th scope="row">เงื่อนไขการคำนวณ</th>'+cols.map(p=>'<td>'+esc(p.error??'คำนวณตามข้อมูลที่เลือก')+'</td>').join('')+'</tr></tfoot></table>';
}
