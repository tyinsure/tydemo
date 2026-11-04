# Project-wide year 0 (2026-11-04)

User specifies first premium is always year0. Display elapsed year = row.age - entry age. Added elapsed-year.mjs, shared by all page tables (both pension URLs, Legacy, Health, both senior products, Savings) and PDF renderers. Years appear inside the existing age cell; no separate policy-year column added. Senior Excel's pre-existing year column also starts0 and is renamed accordingly.

Contractual one-based policyYear remains unchanged for payments, milestones, eligibility and benefit rules. No calculator, source premium table, sum, life benefit, pension/cashback amount or maturity age changed. Thus age79 at entry=0,age81=2,age84=5; age35 savings maturity50=15. Contractual policy-year references in benefit conditions retain their original meaning.

Validation:41/41 suites, including26 explicit product timelines across15 pension plans,four Health main plans,Legacy,two senior products andtwo Savings plans. First-to-last-year checks include PDF table text and senior Excel. Rendered PDFs for pension,Legacy,Health,senior99/10,senior90/90 andSavings, confirmed A4/native contact links and visually inspected age/year placement. Browser checked first rows on all four pages,senior age79→81/year2 andSavings age50/year15.
