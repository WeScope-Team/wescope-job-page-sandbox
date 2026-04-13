# Job Page Canvas Sandbox

A drag-and-drop prototype for the new **Job Page** layout. Estimators use this canvas to rearrange, resize, and provide feedback on widget configurations before the production migration.

**Live URL**: [https://sandboxapp-orcin.vercel.app](https://sandboxapp-orcin.vercel.app)

---

## Features

- **9 draggable widgets**: Job Details, Tasks Table, Loss Summary, Insurance & Guidelines, Links, Files, Job Notes, Timeline, Action Pane
- **24-column grid** (`react-grid-layout`) for fine-grained resizing
- **Modular fields**: Click the ⚙️ icon on any widget to toggle individual fields on/off
- **Click-to-comment**: Click the 💬 icon on any widget to leave inline feedback
- **44 job archetypes**: Switch between real-world archetypes (Program/Non-Program × Order Type × Job Type) via the dropdown
- **Export Layout**: Downloads a JSON file containing grid coordinates, field visibility, and widget-level feedback

---

## Quick Start

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173/`

---

## Regenerating Fixture Data

The `src/data/archetypes.json` file contains real (anonymized) job data extracted from BigQuery. To refresh it:

```bash
# Requires GCP authentication for project: xano-fivetran-bq
# Either `gcloud auth application-default login` or a service account key
python scripts/generate_fixtures.py
```

This queries `int_xano.int_jobs`, `marts_xano_dims.dim_task`, and related tables to produce 44 unique archetype combinations.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| Grid Engine | `react-grid-layout` (Responsive + WidthProvider) |
| Icons | Lucide React |
| Hosting | Vercel |
| Data Source | BigQuery (`xano-fivetran-bq`) via Python |

---

## Architecture

```
src/
├── App.tsx              # Grid orchestrator, archetype selector, export logic
├── main.tsx             # React entry point
├── index.css            # Tailwind + custom widget utilities
├── data/
│   └── archetypes.json  # 44 job archetypes (176 KB)
└── widgets/
    ├── WidgetShell.tsx   # Shared wrapper (comment + field toggles)
    ├── JobDetailsWidget.tsx
    ├── TasksTableWidget.tsx
    ├── LossSummaryWidget.tsx
    ├── InsuranceGuidelinesWidget.tsx
    ├── LinksWidget.tsx
    ├── FilesWidget.tsx
    ├── JobNotesWidget.tsx
    ├── JobTimelineWidget.tsx
    └── ActionPaneWidget.tsx
```

Architectural specs (functional inventory, technical deep-dive, schema/state architecture) are in [`docs/`](./docs/).

---

## Reference Repos

| Repo | Relationship |
|---|---|
| [`WeScope-Team/wescope-datapipeline`](https://github.com/WeScope-Team/wescope-datapipeline) | BigQuery data models that power `generate_fixtures.py` |
| Portal repo (private) | Source `JobView.tsx` and `JobView/` components being modularized |

---

## Deployment

Hosted on Vercel. To redeploy:

```bash
npx vercel --prod
```

This is a **temporary throwaway** sandbox. Once estimator feedback is collected and the production migration begins, this repo can be archived.
