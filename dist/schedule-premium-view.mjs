const units={annual:'ปี',semiannual:'6เดือน',quarterly:'3เดือน',monthly:'เดือน'};
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export function scheduleUnit(r,display='annual'){
 return display==='modal'?(units[r.frequency?.id??r.frequency]??'ปี'):'ปี';
}
// Annual projections already use the selected modal rate times its payment count.
// Convert premium cells only; benefits, cumulative payments and pensions stay intact.
export function scheduleViewRow(r,row,display='annual'){
 if(display!=='modal')return row;
 const count=r.frequency?.payments??r.payments??1,view={...row};
 for(const key of ['pay','riderPremium','healthPremium','opdPremium','dailyPremium','carePremium','ciPremium','totalPremium','paPay','dailyPay','total']){
  if(typeof row[key]==='number')view[key]=round(row[key]/count);
 }
 return view;
}
export function scheduleViewResult(r,display='annual'){
 return {...r,schedulePremiumDisplay:display,schedule:r.schedule.map(row=>scheduleViewRow(r,row,display))};
}
