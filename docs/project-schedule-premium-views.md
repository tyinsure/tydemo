# Project-wide schedule premium views

Added after Check Point 7 on 2026-10-24. Check Point 7 archives and its Git tag remain unchanged.

The schedule on every page now offers the same two controls: แสดงเบี้ยตามโหมดชำระ and แสดงเบี้ยทั้งปี. Coverage includes both pension entry URLs (all 15 pension plans), Legacy 99/20, all four main policies on the Health page and both senior products (99/10 and 90/90).

The default remains the annual total. The modal view shows the selected instalment premium, using each product's actual modal rate already present in its annual projection. Annual-only and single-payment plans retain their available payment basis. No new payment frequency is introduced.

Only premium cells change. Benefits, pensions, cumulative premiums, maturity values and eligibility remain as calculated. Missing rates remain missing, not zero. Display switches update only the table so edited customer summaries are preserved.

PDF exports use the current schedule view and matching premium units. Health rider premiums are aggregated for the PDF after the annual projection is calculated, then displayed in the chosen basis. Senior PDFs retain one portrait A4 page, the same benefit columns and conditional health note. Excel reports retain their existing annual projections.

Validation: 32 automated suites, including 152 new project-wide view cases; browser checks for 15 pension plans, four Health main policies across four frequencies, both senior plans and both views; actual PDF downloads for Health, pension and senior products, rendered with Poppler for visual review. Existing Legacy view tests and all prior calculation/export tests remain passing.
