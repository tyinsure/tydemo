# วัยเก๋าคุ้มได้ใจ — supplied source mapping

- `main-premiums.pdf`: 99/10 annual main premium and life-cover portion for tax, per 1,000 baht, both sexes, ages 50–80. Extracted numeric data and visually checked all 31 rows against the rendered PDF.
- `source-1.png`: annual fixed-benefit health rates per daily benefit 100 baht, ages 50–89; 76+ are renewal only.
- `source-2.png`: senior PA annual and monthly rates, ages 50–75, plans 1–5. These modal rates are separate from PA Easy on the 99/20 plan.
- `source-3.png`: main death/maturity benefit schedule and footnotes. Year 1–2 accident/public-accident benefits include 102% of main premiums paid. Later death benefits are the greatest of the specified sum percentage, surrender value and 101% of main premiums paid. Surrender values were not provided, so the UI/report explicitly labels projected death benefits as a computable minimum. Maturity is the greater of 150% of sum and 101% of main premiums paid.
- `source-4.png`: permitted main/PA combinations, daily benefits and renewal limits. Main sum 500,000 supports PA plan 4 or 5. Daily limits are 500/1,000 for sum 100,000 and 500/1,000/1,500/2,000 for sum 200,000/300,000/500,000. PA inpatient and ICU days are combined, maximum 365 days per accident. Health inpatient and ICU days are combined, maximum 10 days per policy year; during policy years 1–2 health covers accident-related hospitalisation only. ICU pays twice the normal daily benefit.
- `source-5.png`: regression anchor, female age 55, main sum 500,000 and PA plan 5: main annual 68,920, PA annual 3,585, total 72,505; year-2 illness 140,597 (rounded to baht), accident total 1,640,597, public accident 3,140,597; year-21 illness 750,000, accident total 1,750,000, public accident 3,500,000; maturity 750,000.
- `source-6.png`: entry/renewal ages and eligibility/occupation/payment conditions.

User confirmed 2026-10-23: this product supports annual/monthly only. Implement annual main premiums first; monthly main rates will be supplied later. No other product's modal factors are reused. Monthly PA source rates are retained but no incomplete monthly package quote is offered.

Projection convention: attained age at start of each policy year; whole year's main payments included in that row's premium-paid figure. Main premiums stop after 10 years; PA premiums and benefit additions end at attained age 76, daily health premiums end at age 90. The final age-99 row is maturity only. Renewal is subject to contract conditions.

## Monthly main rates update (2026-10-23)

`source-7-monthly.png` supplies the exact annual/monthly main rates per 1,000 baht for ages 50–80, both sexes. Monthly main rates are stored separately and used directly, with each instalment rounded to satang, 12 instalments per year and 120 instalments over 10 years. Premium-paid death/maturity floors use the actual payments for the selected frequency. User subsequently confirmed the annualised life-cover tax portion for monthly payment is the annual life-cover portion × 0.09 × 12. Apply the factor before final two-decimal rounding; it is not the total premium including riders.

PA monthly premiums use the existing source-2 modal table. User confirmed the daily-health monthly factor on 2026-10-23: annual premium × 0.09. Updated whole-baht rounding rule: annual and monthly daily-health premiums round half up to 0 decimal places. The monthly premium is annual × 0.09, rounded before summing 12 instalments for the annual schedule. This applies to attained-age renewal rates through 89, with premiums ending at age 90. Both annual/monthly package quotes and comparisons include the selected health rider.

`source-8-rounding.png`: supplied whole-baht rounding rule for annual/monthly fixed-benefit health premiums; first decimal digit >=5 rounds up. Applies only to this senior health rider, including renewal-age rates. Main and PA premium precision is unchanged.
