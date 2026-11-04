# เหมาจ่าย Extra

Added 2026-10-25 from three user-supplied screenshots preserved alongside this file.

- `source-rates.png`: 17 age bands × 3 plans × 2 genders × 4 payment frequencies = 408 cells. Production uses exact printed modal amounts, not derived factors. The annual female age 11–17 plan-1 cell is blank in the image; the user explicitly confirmed **7,943 baht** through the clarification answer on 2026-10-25.
- `source-eligibility.png`: entry ages 11–90; renewal through age 98; coverage through age 99 or termination of the main policy; health examination according to insurer criteria. No health-examination waiver, new waiting periods, or occupation class is inferred.
- `source-benefits.png`: room 2,000 / 4,000 / 4,000 per day; medical limit 200,000 / 200,000 / 500,000 per hospitalization for categories 2–5 and 12. Deductible 0, 100:0 sharing. ICU: the user explicitly corrected the limit on 2026-10-28 to **2× the selected room rate** (4,000 / 8,000 / 8,000 baht/day), overriding the earlier screenshot interpretation. The limit is calculated by extraICULimit(); ≤15 ICU days, included in 120 room/ICU days. Home medicine 1,000 for ≤7 days. No annual benefit maximum is specified (source says “ไม่มี”). Categories 6–11 and 13 excluded; ambulance paid as incurred subject to category 1 limit.

Product id `maochai-extra` shares the health selection dropdown and existing premium, forecast, all-payment comparison, LINE, PDF and Excel flows. Default plan is 1; changing payment frequency or gender preserves the chosen plan. Convertible controls remain hidden. Other riders and main-policy rules are unchanged. The age-99 maturity row has no extra premium; attained ages 91–98 use renewal rates only.

Validation: 408 rate cells, 2,112 age/frequency/sex/plan lookups; independent source anchors and modal factor cross-checks; 48 combinations with other riders; UI switching/removal/invalid-age recovery. Full suite 37/37. Browser QA checked all 24 plan/sex/payment combinations; actual portrait-A4 PDF benefits page rendered and visually inspected, actual Excel reopened and numeric cells verified.
