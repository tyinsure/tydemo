# D Health Lite Convertible Option

Implemented 2026-10-25 from the user's attached `convertible-source.png` and explicit instructions.

- Exercise once in ages 11–15 and once in ages 55–65, after at least five continuous years holding D Health Lite. The projection assumes continuous coverage from the entered starting age.
- The user chooses an exercise age in each window, or skips that window. Ineligible ages are excluded. Default selections are the earliest eligible ages; choosing "ไม่ใช้สิทธิ์ช่วงนี้" is preserved.
- Only Deductible changes: 100,000 → 50,000; 50,000 → 20,000 for the 1M benefit or 30,000 for the 5M benefit; 20,000/30,000 → no deductible. Each exercise reduces one step and persists thereafter. No change to Copay.
- No additional Convertible fee was provided or assumed. Future premiums use existing exact rate columns for the new deductible, attained age, gender, and payment frequency, starting at the chosen exercise age.
- Main policy benefits, payments, and other riders remain unchanged. First-year premiums remain unchanged because five years must elapse before exercise.
- The schedule, modal view, PDF and Excel use the adjusted premiums. LINE, schedule notes and the conditional Convertible PDF page describe the chosen transitions. No extra PDF page when disabled or no transition occurs.
- Eligibility and approval remain subject to the insurer's stated conditions; this is a projection, not an approval decision.

Validation: 400 complete schedules, 22,680 source-rate rows, tenure/window boundaries, skipped windows, user-selected ages, returning to unchanged premiums when disabled, and PDF/Excel notes. Full suite: 36/36. Actual PDF export inspected as portrait A4; actual Excel reopened and transition rows checked.
