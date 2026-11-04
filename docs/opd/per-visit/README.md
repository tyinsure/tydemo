# OPD ต่อครั้ง — source mapping (2026-10-24)

Enabled in the existing OPD selector. Choose one OPD product at a time. Benefit selections are remembered separately when switching between lump-sum and per-visit products.

- `source-1.png`: plans 500 / 800 / 1,000 / 1,500 / 2,000 / 2,500 / 3,000 baht per visit; maximum one visit per day, 30 visits per year. Overall limits are 15,000 / 24,000 / 30,000 / 45,000 / 60,000 / 75,000 / 90,000 baht. Treatment of the same disease or its complications is limited to seven consecutive visits. If the gap since the last treatment exceeds 14 days, continued treatment of the same disease is treated as a new illness episode under the supplied wording.
- `source-2.png`: annual rates.
- `source-3.png`: six-month rates.
- `source-4.png`: quarterly rates.
- `source-5.png`: monthly rates and renewal-only footnote.

All four modal tables are transcribed separately in `dist/opd-per-visit-rates.mjs`: 19 age bands, seven plans, two sexes, four frequencies, 1,064 supplied premium cells. Production quotes look up these exact cells. They do not use the OPD lump-sum factors. As a transcription check only, all 798 nonannual cells also match annual × 0.52 / 0.27 / 0.09 rounded half up.

Rates cover ages 6–98. Ages 81 and above are marked renewal-only in the supplied tables. New per-visit quotes therefore use ages 6–80, subject to the main policy's existing rules. Age-99 premiums are not extrapolated: the main policy's age-99 row is maturity only. Lump-sum OPD retains its separate age limits and rates.

Per-visit summaries, UI benefit text and PDF/Excel terms use only the supplied per-visit information. Lump-sum OPD's 30/120/180-day waiting periods and medicine terms are not reused as per-visit terms, because these five images do not supply those conditions.

The selected OPD product is included in all existing totals, modal/annual schedules, payment comparisons, LINE summary and PDF/Excel exports. Main-policy benefit formulas, accumulated main premiums and existing eligibility rules remain unchanged.

Validation: 5,208 age/sex/plan/frequency lookups, direct anchors from every supplied table, 56 combinations with all existing riders, distinct entry/renewal boundaries, remembered selections and removal/recovery. Browser checks cover all seven plans, both sexes and four frequencies. Actual PDF/Excel downloads reopened and rendered for review; no error cells or console errors. All 35 project test suites pass.
