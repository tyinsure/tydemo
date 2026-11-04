# วัยเก๋าคุ้มสุขใจ 90/90 — source mapping

Sources provided by the user on 2026-10-23:

- `source-1.png`: main annual/monthly rates, both sexes, ages 50–75. Stored explicitly in `dist/senior90-rates.json` using the same per-1,000-sum convention as the existing life-rate tables. Monthly values use the supplied table directly.
- `source-2.png`: fixed-benefit health annual rates per daily benefit 100 baht. Monthly = annual × 0.09. Annual and monthly premiums round to whole baht, half up, before summing instalments. Renewal rates cover ages 76–89 only for continuing contracts.
- `source-3.png`: senior PA plans 1–5 with annual/monthly attained-age bands. These rates match the existing senior PA source, separate from PA Easy of the 99/20 plan.
- `source-4.png`: main sums 100k/200k/300k/500k (500k can use PA 4 or 5). Main pays and covers through age 90; maturity is 100% of sum. Policy years 1–2 illness refunds premiums paid plus 2%; general/public accident adds 100%/200% of sum respectively. From year 3, illness/general accident is 100% of sum, public accident 200%. No 99/10 percentage ladder, surrender-value floor or 101%-of-premium floor is copied to 90/90.

PA inpatient and ICU days combine to 365 days per accident, with ICU limited to 7 days per accident. PA premiums stop at attained age 76. The health table offers daily benefit choices 500/1,000/1,500/2,000 independently of the main plan; unlike the earlier 99/10 package, no lower-main-sum restriction is shown. Health inpatient and ICU days combine to 10 days per policy year; ICU pays twice the selected normal daily benefit. In policy years 1–2, health hospitalisation benefits cover accident-related injury only. Its premiums stop at attained age 90.

The main premium stays based on entry age and selected payment mode until age 90. Each annual schedule row sums that year's instalments; premiums paid used for the first-two-year death refunds follow this end-of-year convention. An additional maturity-only row is age 90. Entry ages are limited to the supplied rate range 50–75.

The new plan reuses the established four sum buttons, senior layout, combined rider column, conditional three-line health note, and PDF consisting only of premium/benefit tables. The old 99/10 and 99/20 calculations remain covered by their existing tests. No tax-eligible life-cover portion for 90/90 was provided; the corresponding card is omitted and no value is inferred from the 99/10 tax table.

Validation: `senior90-test.mjs` checks both modalities, every entry age/sex/sum, attained-age rider bands, age-90 maturity and payment end, exact first-two-year refunds, absence of the 99/10 floors, ICU 7-day cap, notes and export layouts. Existing 99/10 tests continue to run separately.
