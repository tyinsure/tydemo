// Display only: contractual policyYear remains one-based for eligibility/benefit rules.
export const elapsedYear=(result,row)=>Number(row.age)-Number(result.age);
export const elapsedYearLabel=(result,row)=>'ปีที่ '+elapsedYear(result,row);
