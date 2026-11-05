# TYINSURE update for Wedge — 2026-11-05
Source: 363d8de7a6613b03d151aa55d1bdb0ea74d59959
Target: https://github.com/tyinsure/tydemo

Changes since Alucard handoff c1c1917:
- Removed pictured explanatory notes from Savings PDF.
- Shared requested disclaimer across all PDF pages.
- Dynamic dividend column heading based on selected/calculated return percentage (web/PDF/Excel).
- Age column headings now show only อายุ; existing row year/phase information retained.
- Savings schedule restyled; phone age cards and tablet sticky age column.

Checks: 41/41 suites; 157 local references and no duplicate IDs; responsive browser QA at 320/375/390/430/768/820/1024 widths; all 16 phone cards numerically match table; no page horizontal overflow. Savings plan/5% return updates and keyboard details toggling verified.
Static deploy directory: dist/. Preserve existing repository history, workflow and unrelated files. No force push, credentials, .openai or runtime files. Source upload only; no hosting/settings changes or workflow dispatch requested in this handoff.
