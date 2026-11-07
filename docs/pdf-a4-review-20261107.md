# PDF A4 layout review — 2026-11-07
Scope: pension, Legacy (including new Premier/Wealth plans), Health/rider summaries, both Senior products, all six Savings plans.

Findings: existing documents already used portrait A4 dimensions. The disclaimer was drawn at y830, leaving insufficient print margin; LINE/page numbering also used inconsistent y805/809/819 positions. Some annotations used a different baseline from the actual Savings footer.

Change: shared drawPDFFooter in pdf-contact-link.mjs places LINE/page number at y803 and exact user disclaimer at y815. 8pt Sarabun text stays inside the print-safe bottom band. Native LINE URI annotations use the same baseline. Schedule footer notes and short summary labels move slightly upward for separation; Savings removes the redundant variable-position disclaimer and draws it once in the shared footer. Senior PDF column heading is อายุ while row elapsed-year data is retained. Calculators, source rates, benefit amounts, row order and conditional notes are unchanged.

Validation: real Sarabun canvas bounds for143 scenarios /415 pages across age/amount extremes and all summary types; no text beyond the page-safe margins, same-line overlaps, severe text compression or render errors. Generated18 actual PDF files (58pages), confirmed every page595.28x841.89pt, one working native LINE URI annotation/page; rendered all58 pages with Poppler and checked ink stays inside page margins. Visually reviewed overview sheets plus dense DHealth/Elite/Extra/Senior pages. Existing tests updated to check shared footer positions instead of old per-export constants.

Internal review artifacts: outputs/A4_PDF_Review_2026-11-07 and work/a4-audit-20261107 (not deployed).
