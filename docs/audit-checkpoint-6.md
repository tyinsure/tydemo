# Check Point 6 — system audit (2026-10-23)

## Baseline and recovery

The pre-audit state was saved as Check Point 6 Update 2, tag `checkpoint-6-update-2`, source `7cc510ef6622483f5f97b9816b9e1d5c64114436`. Earlier checkpoints remain intact. The final audited state is tagged `checkpoint-6-audited` and provided separately, so recovery does not depend on undoing the fix.

## Confirmed bug and fix

In the 99/10 senior product, main sum 200,000 incorrectly offered only daily benefits 500 and 1,000. `docs/senior/source-4.png` shows plan 2 also supports 1,500 and 2,000. Corrected `seniorDailyOptions` to limit only plan 1 (sum 100,000). The UI, calculation, comparison, LINE summary, PDF and Excel share this rule. Added explicit regression checks for both newly available benefits and both payment frequencies. Corrected the source mapping documentation as well.

No rate tables, premium rounding, main benefit formulas or existing valid quote results were changed. No system features or dependencies were removed during this audit.

## Verification

- All 30 automated test suites pass, covering pension products, Legacy, Health, senior 99/10 and 90/90, rider eligibility/renewal ages, modal rates, invalid inputs, summaries, charts and PDF/Excel exports.
- An independent comparison against the pre-audit calculator confirms 7,568 previously valid senior quotes are identical. 416 source-plan-2 combinations become valid; other previously invalid combinations remain rejected.
- All 26 JavaScript modules pass `node --check`; JSON files parse successfully. 89 local asset/import references resolve; no duplicate static HTML IDs; `git diff --check` passes.
- Browser checks: all 15 pension plans in sum/premium modes (30 combinations); 3 Health product selections across 4 payment modes with all optional riders (12 combinations); both senior products across 4 sums and 2 payment modes (16 combinations). Verified invalid-input clearing, disabled exports, recovery and senior health note visibility. Switching back to Legacy retains required locked PA.
- No browser warning/error logs appeared in these checks. Real PDF/Excel downloads succeeded. Senior and Health Excel files reopen with numeric values and no error cells. The new senior sum-200,000 monthly/day-2,000 case has first-year main 29,774.40, health 5,448.00 and total 35,222.40 baht.
- Poppler confirms the senior PDF remains one portrait A4 page (595.28 × 841.89 pt). Visually reviewed the actual PDF: complete age-55–99 rows, all 7 columns, conditional note on 3 lines, footer and LINE link. Also reviewed Health PDF and confirmed A4; existing layout tests cover pension PDFs and 1,704 combined senior layouts.

These checks establish the tested behavior; they do not claim that every possible browser/environment failure is impossible. Existing source limitations, including missing surrender values and absent 90/90 tax rates, remain represented as before.

## Bigg handoff

Use `TYINSURE_GitHub_Check_Point_6_For_Bigg.zip` and its SHA256 manifest. Update `tyinsure/tyinsureteam` while preserving unrelated files and GitHub settings. Copy every `dist/` file to its corresponding root website path as well as keeping `dist/`, matching the existing repository layout. Include all new senior modules, JSON, styles and source documentation. Exclude `.openai/`, credentials, runtime folders and `.git`. Validate the extracted package with `node run-tests.mjs` before upload; do not enable or deploy GitHub Pages as part of this source upload.
