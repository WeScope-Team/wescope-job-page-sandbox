# Portal UI — Job Page Canvas Migration

## Objective

We are deprecating the hardcoded DOM layout of the Job Page (`/view?project=[id]&job=[id]`) in favor of a **dynamic, serialized `react-grid-layout` canvas** powered by user-specific layout preferences stored in Xano and a decoupled Zustand global state.

The existing monolithic `JobView.tsx` (2,260 lines) will be decomposed into self-sufficient, independently renderable widgets that subscribe to a shared data store and can be freely repositioned, resized, and hidden by the user.

---

## Directory Index

| Document | Summary |
|---|---|
| [01_functional_inventory.md](./01_functional_inventory.md) | V1 Architectural Inventory — high-level taxonomy of all widgets, data hydration mappings, mutation surfaces, and the RBAC/conditional rendering rules engine. |
| [02_technical_deep_dive.md](./02_technical_deep_dive.md) | V2 Deep-Dive Validation — file-by-file gap analysis of all 41 components, exact layout topology, full TypeScript interface mapping, mutation/data-flow catalog, and edge-case state machines (auto-start timer, dialog minimize/restore, RBAC gating). |
| [03_schema_and_state_architecture.md](./03_schema_and_state_architecture.md) | **Source of Truth** — Xano `user_ui_preferences` database schema, responsive `react-grid-layout` TypeScript interfaces, debounced layout persistence hook, Zustand store definition with strict re-render isolation selectors, CLS-free hydration gate, and monolith decoupling checklist. |

---

## Execution Mandate

> [!CAUTION]
> **`03_schema_and_state_architecture.md` is the absolute Source of Truth** for database schemas, TypeScript interfaces, and state management patterns. All implementation code must conform to the interfaces, selector patterns, and persistence strategies defined in that document.
>
> Specifically:
> - **Layout state must NEVER live in `useJobStore`**. Violating this boundary will cause 10 FPS frame drops during drag operations due to re-render cascades across heavy widgets (`TasksDetails`, `LossSummary`).
> - **All widget selectors must use `useShallow`** from `zustand/react/shallow`. Bare `useJobStore((s) => s)` calls are prohibited.
> - **Layout saves must use the `useLayoutPersistence` hook** with dirty-flag + debounce + `sendBeacon`. Direct `PATCH` calls on `onLayoutChange` will DDoS the Xano API with 200+ requests per drag.
