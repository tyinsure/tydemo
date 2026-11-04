const moneyRound=n=>Math.round((n+Number.EPSILON)*100)/100;
export function schedulePremiumUnit(r,display='annual'){
 return display==='modal'?({annual:'ปี',semiannual:'6เดือน',quarterly:'3เดือน',monthly:'เดือน'}[r.frequency.id]):'ปี';
}
// Presentation only: benefits and cumulative premiums always retain the original calculation.
export function schedulePremiumValues(r,row,display='annual'){
 const modal=display==='modal';
 const main=modal?(row.pay?r.premium:0):row.pay;
 const rider=r.rider?(modal?row.riderModalPremium:row.riderPremium):0;
 return {main,rider,total:rider===null?null:moneyRound(main+(rider??0))};
}
