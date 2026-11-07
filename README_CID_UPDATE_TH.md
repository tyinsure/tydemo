# TYINSURE update 2026-11-07
Full source commit: a99c50239f4c4b23fcf2842c244b07d5c8ed286e
Target: tyinsure/tydemo main. User authorized upload AND deployment.
Changes since prior source 9c4fee7: shared PDF A4 footer/disclaimer and contact placement across all reports; senior age heading; phone-only Health annual schedule with age/total expandable details; selected-only separate OPD/daily/CI premium rows in Health comparison.
Preserve all existing plan calculations, other project files, GitHub history, .github workflows, Pages settings and unrelated hosting configuration. Do not force-push. Website lives in dist; use existing manual Pages workflow to deploy updated main and verify deployed source.
No .openai, credentials, temporary runtime, or .git included. Verify CID_UPDATE_MANIFEST.json before import.
Validation: 52-suite project runner; comparison tests cover selected-only rows across all 8 rider combinations and all 4 frequencies. UI verified selected/unselected rows and OPD type labels. PDF audit: 143 scenarios/415 pages, 18 rendered sample PDFs/58 pages reviewed. Mobile age totals match original schedule; iPad keeps table.
