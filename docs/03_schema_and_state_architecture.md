# Schema Definition & State Architecture — Source of Truth

> **Scope**: Xano Database Schema, TypeScript Layout Interfaces, Zustand Global State, Layout Persistence, Hydration Strategy, and Widget Decoupling Directives.
> **Purpose**: Technical specifications required to decouple data fetching from presentation logic and serialize layout positioning for a dynamic, user-configurable `react-grid-layout` canvas.

> [!CAUTION]
> This document is the **absolute Source of Truth** for database schemas, TypeScript interfaces, and state management patterns. All implementation code must conform to the interfaces and patterns defined here. Deviation will cause re-render cascades and API spam.

---

## 1. Xano Database Schema (`user_ui_preferences`)

### 1.1 Table Definition

| Field Name | Type | Properties & Constraints | Description |
|---|---|---|---|
| `id` | `integer` | Primary Key, Auto-increment | Unique preference record identifier. |
| `created_at` | `timestamp` | Auto-generated | UNIX timestamp of creation. |
| `updated_at` | `timestamp` | Auto-update | UNIX timestamp of last modification. |
| `user_id` | `table_reference` | FK -> `user.id`, Nullable | If set, applies only to this specific user. |
| `role_id` | `table_reference` | FK -> `role.id`, Nullable | If `user_id` is null, acts as the default layout for this role. |
| `page_identifier` | `text` | Required | e.g., `"job_view_v2"`. Allows schema reuse across portal pages. |
| `layout_json` | `json` | Required | A **breakpoint-keyed object**: `{ lg: [...], md: [...], sm: [...] }`. See Section 2 for exact shape. |

> [!WARNING]
> A record must have either `user_id` OR `role_id` defined, but not necessarily both. Resolution order on page load: (1) `user_id` match → (2) `role_id` match → (3) hardcoded frontend `STANDARD_BLUEPRINT`.

### 1.2 Indexes (Sub-50ms Retrieval)

- **Primary Index** (`idx_user_page`): `user_id` (ASC), `page_identifier` (ASC)
- **Secondary Index** (`idx_role_page`): `role_id` (ASC), `page_identifier` (ASC)

### 1.3 REST Endpoints

**`GET /api/ui-preferences/{page_identifier}`**
- **Auth**: Requires JWT.
- **Logic**: Reads `auth.id`. Searches `user_ui_preferences` where `user_id = auth.id` AND `page_identifier = input.page_identifier`.
- **Fallback**: If null, queries where `role_id = auth.role_id`. Returns payload.

**`PATCH /api/ui-preferences/{page_identifier}`**
- **Auth**: Requires JWT.
- **Payload**: `{ layout_json: { lg: [...], md: [...], sm: [...] } }`
- **Logic**: Upserts record where `user_id = auth.id` AND `page_identifier = input.page_identifier`.
- **Validation**: Must reject if `layout_json` is an array (legacy flat format). Accept only if it is an object with at least an `"lg"` key:
  ```
  typeof input.layout_json === 'object' && !Array.isArray(input.layout_json) && 'lg' in input.layout_json
  ```

---

## 2. TypeScript Interfaces (The JSON Layout Schema)

### 2.1 Interface Definitions

```typescript
import type { Layout, Layouts } from 'react-grid-layout';

// ─── Strict Widget ID Union ───────────────────────────────────
export type WidgetId =
  | 'job-details'
  | 'insurance-guidelines'
  | 'loss-summary'
  | 'links'
  | 'files'
  | 'tasks-details';

// ─── Per-Widget Layout Item ───────────────────────────────────
// Extends RGL's Layout with our business-logic fields
export interface WidgetLayoutItem extends Layout {
  /** Must be a valid WidgetId */
  i: WidgetId;
  /** Hide widget without removing from config (e.g., LossSummary when no summary data) */
  isHidden?: boolean;
}

// ─── Breakpoint Definitions ───────────────────────────────────
export const GRID_BREAKPOINTS = { lg: 1200, md: 768, sm: 480 } as const;
export const GRID_COLS       = { lg: 12,   md: 8,   sm: 4   } as const;
export const GRID_ROW_HEIGHT = 30; // px per row unit

export type Breakpoint = keyof typeof GRID_BREAKPOINTS;

// ─── Full Page Layout Config ──────────────────────────────────
// This is the exact shape stored in Xano `layout_json`
export type ResponsiveLayoutConfig = Record<Breakpoint, WidgetLayoutItem[]>;

// ─── Component Registry ──────────────────────────────────────
export interface WidgetRegistryEntry {
  id: WidgetId;
  component: React.ComponentType;
  label: string;           // Human-readable name for drag palette
  defaultHidden?: boolean; // e.g., loss-summary hidden by default
}
```

### 2.2 Standard Blueprint (Responsive Default Layout)

If no user or role preference exists, the frontend hydrates with this configuration:

```typescript
export const STANDARD_BLUEPRINT: ResponsiveLayoutConfig = {
  lg: [
    { i: 'job-details',           x: 0, y: 0,  w: 12, h: 4,  minW: 6,  minH: 3  },
    { i: 'insurance-guidelines',  x: 0, y: 4,  w: 12, h: 3,  minW: 8,  minH: 2  },
    { i: 'loss-summary',          x: 0, y: 7,  w: 12, h: 5,  minW: 8,  minH: 3  },
    { i: 'links',                 x: 0, y: 12, w: 6,  h: 5,  minW: 4,  minH: 4  },
    { i: 'files',                 x: 6, y: 12, w: 6,  h: 5,  minW: 4,  minH: 4  },
    { i: 'tasks-details',         x: 0, y: 17, w: 12, h: 12, minW: 12, minH: 6  },
  ],
  md: [
    { i: 'job-details',           x: 0, y: 0,  w: 8,  h: 5,  minW: 6,  minH: 3  },
    { i: 'insurance-guidelines',  x: 0, y: 5,  w: 8,  h: 3,  minW: 8,  minH: 2  },
    { i: 'loss-summary',          x: 0, y: 8,  w: 8,  h: 5,  minW: 8,  minH: 3  },
    { i: 'links',                 x: 0, y: 13, w: 4,  h: 5,  minW: 4,  minH: 4  },
    { i: 'files',                 x: 4, y: 13, w: 4,  h: 5,  minW: 4,  minH: 4  },
    { i: 'tasks-details',         x: 0, y: 18, w: 8,  h: 12, minW: 8,  minH: 6  },
  ],
  sm: [
    { i: 'job-details',           x: 0, y: 0,  w: 4,  h: 6,  minW: 4,  minH: 4,  static: true },
    { i: 'insurance-guidelines',  x: 0, y: 6,  w: 4,  h: 3,  minW: 4,  minH: 2,  static: true },
    { i: 'loss-summary',          x: 0, y: 9,  w: 4,  h: 5,  minW: 4,  minH: 3,  static: true },
    { i: 'links',                 x: 0, y: 14, w: 4,  h: 5,  minW: 4,  minH: 4,  static: true },
    { i: 'files',                 x: 0, y: 19, w: 4,  h: 5,  minW: 4,  minH: 4,  static: true },
    { i: 'tasks-details',         x: 0, y: 24, w: 4,  h: 14, minW: 4,  minH: 8,  static: true },
  ],
};
```

> [!NOTE]
> All `sm` breakpoint items are `static: true`. On mobile viewports, drag-and-drop is disabled — the layout is locked to a single-column stack to prevent accidental repositioning on touch devices.

---

## 3. Layout Save Strategy & API Debouncing

### 3.1 Design Decision

| Strategy | Verdict | Reason |
|---|---|---|
| Explicit "Save" FAB | ❌ Rejected | User forgets to save; navigates away → lost changes |
| Save on every `onLayoutChange` | ❌ Rejected | Fires 50-200 times per drag operation → API DDoS |
| Debounced auto-save (2s) | ⚠️ Close | Still fires during drag if user pauses |
| **Dirty-flag + debounce + onDragStop** | ✅ Selected | Fires only after a completed interaction; batches rapid successive drags |

**Rule**: Fire the debounced save only on `onDragStop` / `onResizeStop`, not on every pixel-level `onLayoutChange`. This reduces API calls from ~200 per drag to exactly **1 per completed interaction**, then debounces successive interactions into a 2-second window.

### 3.2 Custom Hook: `useLayoutPersistence`

```typescript
// src/hooks/useLayoutPersistence.ts
import { useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { Layouts } from 'react-grid-layout';
import type { ResponsiveLayoutConfig } from '@/types/layout';

const DEBOUNCE_MS = 2000;
const PAGE_ID = 'job_view_v2';

interface UseLayoutPersistenceOptions {
  /** The currently saved layout from the server (used for dirty-checking) */
  serverLayout: ResponsiveLayoutConfig | null;
}

export function useLayoutPersistence({ serverLayout }: UseLayoutPersistenceOptions) {
  const pendingLayoutRef = useRef<ResponsiveLayoutConfig | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Mutation ───────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (layout: ResponsiveLayoutConfig) => {
      const response = await fetch(`/api/ui-preferences/${PAGE_ID}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout_json: layout }),
      });
      if (!response.ok) throw new Error('Failed to save layout');
      return response.json();
    },
  });

  // ─── Dirty Check ────────────────────────────────────────────
  const isDirty = useCallback(
    (newLayout: ResponsiveLayoutConfig): boolean => {
      if (!serverLayout) return true;
      return JSON.stringify(newLayout) !== JSON.stringify(serverLayout);
    },
    [serverLayout]
  );

  // ─── Debounced Save (called from onDragStop / onResizeStop) ─
  const scheduleFlush = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const layout = pendingLayoutRef.current;
      if (layout && isDirty(layout)) {
        saveMutation.mutate(layout);
      }
    }, DEBOUNCE_MS);
  }, [isDirty, saveMutation]);

  // ─── Called on every onLayoutChange (updates local ref ONLY) ─
  const handleLayoutChange = useCallback(
    (_currentLayout: Layouts, allLayouts: Layouts) => {
      // Store latest layout in ref — no state set, no re-render
      pendingLayoutRef.current = allLayouts as ResponsiveLayoutConfig;
    },
    []
  );

  // ─── Called on onDragStop / onResizeStop ─────────────────────
  const handleInteractionEnd = useCallback(() => {
    scheduleFlush();
  }, [scheduleFlush]);

  // ─── Flush on unmount (navigation away with unsaved changes) ─
  const flushNow = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const layout = pendingLayoutRef.current;
    if (layout && isDirty(layout)) {
      // Use sendBeacon for reliability during page navigation
      navigator.sendBeacon(
        `/api/ui-preferences/${PAGE_ID}`,
        new Blob([JSON.stringify({ layout_json: layout })], { type: 'application/json' })
      );
    }
  }, [isDirty]);

  return {
    handleLayoutChange,
    handleInteractionEnd,
    flushNow,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
  };
}
```

### 3.3 Usage in Grid Component

```tsx
// src/components/JobView/JobPageGrid.tsx
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useLayoutPersistence } from '@/hooks/useLayoutPersistence';
import { GRID_BREAKPOINTS, GRID_COLS, GRID_ROW_HEIGHT } from '@/types/layout';

const ResponsiveGrid = WidthProvider(Responsive);

export function JobPageGrid({ layouts, serverLayout }: Props) {
  const { handleLayoutChange, handleInteractionEnd, flushNow } =
    useLayoutPersistence({ serverLayout });

  // Flush unsaved changes when navigating away
  useEffect(() => {
    return () => flushNow();
  }, [flushNow]);

  return (
    <ResponsiveGrid
      layouts={layouts}
      breakpoints={GRID_BREAKPOINTS}
      cols={GRID_COLS}
      rowHeight={GRID_ROW_HEIGHT}
      onLayoutChange={handleLayoutChange}        // ref update only, no API call
      onDragStop={handleInteractionEnd}           // triggers 2s debounced save
      onResizeStop={handleInteractionEnd}         // triggers 2s debounced save
      draggableHandle=".widget-drag-handle"
      useCSSTransforms
    >
      {/* Widget children */}
    </ResponsiveGrid>
  );
}
```

> [!TIP]
> The `navigator.sendBeacon` fallback in `flushNow` ensures layout is persisted even if the user navigates away before the 2-second debounce window completes. `sendBeacon` is fire-and-forget and survives page unloads — unlike `fetch()`.

---

## 4. State Management (Zustand Blueprint)

### 4.1 Architectural Boundary: Separate Layout State from Data State

> [!CAUTION]
> **Layout state MUST NOT live in `useJobStore`.** Layout position data must live in its own dedicated store or in local component state. This is the single most important performance boundary.

```typescript
// ❌ WRONG — Layout and data in the same store
export const useJobStore = create((set) => ({
  jobData: null,
  layouts: {},          // Grid positions — NEVER put this here
  setLayouts: (l) => set({ layouts: l }),
}));

// ✅ CORRECT — Completely separate stores
export const useJobStore = create(/* ... data only ... */);
export const useLayoutStore = create(/* ... positions only ... */);
```

This architectural boundary guarantees that dragging a widget **never touches `useJobStore` subscribers**. Widgets like `TasksDetails` subscribe only to `useJobStore` and are completely inert during drag/resize operations.

### 4.2 `useJobStore` Definition

```typescript
// src/store/useJobStore.ts
import { create } from 'zustand';

interface JobPageState {
  // --- Data Slices ---
  jobData: any | null;
  projectData: any | null;
  currentUser: any | null;
  crmUsedData: any[];
  insuranceCarriers: any[];
  managedRepairPrograms: any[];
  subCategories: any[];
  dueDateKnobs: any[];

  // --- UI & Lifecycle State ---
  isLoading: boolean;
  isError: boolean;

  // --- Actions ---
  setJobData: (data: any) => void;
  setProjectData: (data: any) => void;
  setUIData: (key: string, data: any) => void;

  // --- Complex State Machines ---
  activeTaskId: number | null;
  setActiveTask: (id: number | null) => void;

  // --- Cache Invalidation (bound at page level to react-query) ---
  invalidateJobQuery: () => Promise<void>;
  invalidateProjectQuery: () => Promise<void>;
}

export const useJobStore = create<JobPageState>((set) => ({
  jobData: null,
  projectData: null,
  currentUser: null,
  crmUsedData: [],
  insuranceCarriers: [],
  managedRepairPrograms: [],
  subCategories: [],
  dueDateKnobs: [],
  isLoading: true,
  isError: false,
  activeTaskId: null,

  setJobData: (data) => set({ jobData: data }),
  setProjectData: (data) => set({ projectData: data }),
  setActiveTask: (id) => set({ activeTaskId: id }),
  setUIData: (key, data) => set({ [key]: data }),

  invalidateJobQuery: async () => {},
  invalidateProjectQuery: async () => {},
}));
```

### 4.3 Re-Render Optimization: Strict Selector Rules

| Rule | Rationale |
|---|---|
| **Never** return `state` directly: `useJobStore((s) => s)` | Every store write re-renders every subscriber |
| **Always** use `useShallow` when selecting 2+ fields | Prevents new-object-literal equality failures |
| **Derive** computed values inside `useMemo`, not in the selector | Selectors run on every store write; `useMemo` memoizes the output |
| **Never** place `layouts` or `currentBreakpoint` in `useJobStore` | Drag operations fire ~60 state updates/sec; must be isolated |

### 4.4 Widget Selector Examples

**TasksDetails — Atomic Selector (useShallow):**

```typescript
// src/components/JobView/TasksDetailsWidget.tsx
import { useJobStore } from '@/store/useJobStore';
import { useShallow } from 'zustand/react/shallow';

export function TasksDetailsWidget() {
  // ✅ useShallow prevents re-render when other store slices change
  const { tasks, crmUsedData, clientPocEmail, invalidateJobQuery } = useJobStore(
    useShallow((state) => ({
      tasks:              state.jobData?._tasks_in_job ?? [],
      crmUsedData:        state.crmUsedData,
      clientPocEmail:     state.jobData?.client_poc_email ?? '',
      invalidateJobQuery: state.invalidateJobQuery,
    }))
  );

  // This component will ONLY re-render when one of the 4 selected values
  // changes by shallow comparison. Changes to `insuranceCarriers`, `projectData`,
  // `dueDateKnobs`, etc. are completely invisible to this component.

  return <div>{/* ... 2350 lines of task rendering ... */}</div>;
}
```

**LossSummary — Derived State (useMemo):**

```typescript
// src/components/JobView/LossSummaryWidget.tsx
import { useJobStore } from '@/store/useJobStore';
import { useMemo } from 'react';

export function LossSummaryWidget() {
  // Select only the raw summary JSON — single scalar selector, no useShallow needed
  const summary = useJobStore((state) => state.jobData?.summary);

  // Expensive derivation: parse, flatten, compute toggles
  // useMemo ensures this only recalculates when `summary` ref changes
  const { items, grandTotal, userItems } = useMemo(() => {
    if (!summary) return { items: [], grandTotal: 0, userItems: [] };
    return parseLossSummary(summary);
  }, [summary]);

  if (!summary) return null; // Widget self-hides

  return <div>{/* render items */}</div>;
}
```

---

## 5. Hydration & Layout Shift Prevention

### 5.1 The CLS Problem

If we render the `<ResponsiveGrid>` immediately and then async-load the user's saved layout from Xano, the grid will:

1. First paint with `STANDARD_BLUEPRINT` positions.
2. ~200ms later, snap all widgets to the user's saved positions.

This causes a **Cumulative Layout Shift (CLS)** score of 0.3+ — a fail on Core Web Vitals.

### 5.2 Hydration Sequence

```
┌──────────────────────────────────────────────────────────────┐
│ 1. JobPageWrapper mounts                                     │
│    ├── Fires useQuery('ui-preferences', 'job_view_v2')       │
│    ├── Fires useQuery('job', jobId)                           │
│    ├── Fires useQuery('project', projectId)                   │
│    └── Renders <JobViewSkeleton /> (full-page shimmer)        │
│                                                              │
│ 2. All queries resolve                                       │
│    ├── Merge: savedLayout ?? STANDARD_BLUEPRINT → layouts    │
│    ├── Hydrate useJobStore with jobData + projectData         │
│    └── Set isHydrated = true                                 │
│                                                              │
│ 3. First meaningful paint                                    │
│    ├── <ResponsiveGrid> mounts with FINAL layout positions   │
│    └── Widgets subscribe to store, render content             │
│         CLS = 0.0 (no position shift)                        │
└──────────────────────────────────────────────────────────────┘
```

### 5.3 `JobPageWrapper` Implementation

```tsx
// src/components/pages/JobPageWrapper.tsx
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useJobStore } from '@/store/useJobStore';
import { JobViewSkeleton } from '@/components/JobView/JobViewSkeleton';
import { JobPageGrid } from '@/components/JobView/JobPageGrid';
import { STANDARD_BLUEPRINT, type ResponsiveLayoutConfig } from '@/types/layout';

interface JobPageWrapperProps {
  jobId: number;
  projectId: number;
  crmUsedData: any[];
  onBackToProject: () => void;
}

export function JobPageWrapper({ jobId, projectId, crmUsedData, onBackToProject }: JobPageWrapperProps) {
  const setJobData = useJobStore((s) => s.setJobData);
  const setProjectData = useJobStore((s) => s.setProjectData);

  // ─── Fetch user layout preferences ─────────────────────────
  const {
    data: preferencesData,
    isLoading: isPreferencesLoading,
  } = useQuery({
    queryKey: ['ui-preferences', 'job_view_v2'],
    queryFn: async () => {
      const res = await fetch('/api/ui-preferences/job_view_v2');
      if (!res.ok) return null;
      const data = await res.json();
      return data?.layout_json as ResponsiveLayoutConfig | null;
    },
    staleTime: Infinity,
    retry: 1,
  });

  // ─── Fetch job data ─────────────────────────────────────────
  const { data: jobData, isLoading: isJobLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJobById(jobId),
  });

  // ─── Fetch project data ─────────────────────────────────────
  const { data: projectData, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProjectById(projectId),
  });

  // ─── Hydrate global store once data arrives ─────────────────
  useEffect(() => { if (jobData) setJobData(jobData); }, [jobData, setJobData]);
  useEffect(() => { if (projectData) setProjectData(projectData); }, [projectData, setProjectData]);

  // ─── Gate: Show skeleton until ALL critical data is ready ───
  const isHydrating = isPreferencesLoading || isJobLoading || isProjectLoading;

  if (isHydrating) return <JobViewSkeleton />;

  if (!jobData) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span>No job data found</span>
      </div>
    );
  }

  // ─── Resolve final layout: user pref > role pref > standard ─
  const resolvedLayouts: ResponsiveLayoutConfig = preferencesData ?? STANDARD_BLUEPRINT;

  return (
    <JobPageGrid
      layouts={resolvedLayouts}
      serverLayout={preferencesData}
      jobData={jobData}
      onBackToProject={onBackToProject}
    />
  );
}
```

> [!IMPORTANT]
> The skeleton (`<JobViewSkeleton />`) is the **only** component rendered during the hydration phase. This eliminates CLS entirely because the grid never mounts with stale or default positions.

### 5.4 Skeleton Design Specification

```tsx
// src/components/JobView/JobViewSkeleton.tsx
export function JobViewSkeleton() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-32 bg-gray-100 rounded-lg mb-7 animate-pulse" />
        <div className="h-16 bg-gray-100 rounded-lg mb-7 animate-pulse" />
        <div className="grid grid-cols-2 gap-8 mb-7">
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
        </div>
        <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
```

---

## 6. Monolith Decoupling Strategy

The ~480 lines of inline JSX for "Links" and "Files" inside `JobView.tsx` must be extracted before they can be registered as grid widgets.

### 6.1 Extraction Checklist

- [ ] **Create `LinksWidget.tsx`**
  - Extract lines 1639-1757 from `JobView.tsx`.
  - Replace prop dependencies with `useJobStore((state) => state.projectData)`.
  - Extract `handleCompanyCamLink` / `downloadModelPhotos` into the widget or a shared `utilities/integrationUtils.ts`.
  - Pull `crmUsedData` from the store to access `API_Key` fields.

- [ ] **Create `FilesWidget.tsx`**
  - Extract lines 1759-2116 from `JobView.tsx`.
  - Port `JSZip` mass-download logic directly into the widget.
  - Port DnD state logic (`currentFilesFolder`, `dragOverFolderKey`) entirely into **local state** inside `FilesWidget.tsx`. This does not belong in the global store.

- [ ] **Migrate Action Handlers & Dialogs**
  - Move `<JobFileUploadDialog />` into `FilesWidget.tsx`.
  - `handleFileUpload()` will call `invalidateJobQuery()` and `invalidateProjectQuery()` from the global store after upload completes.
  - Move `<FileGalleryDialog />` instantiation into `FilesWidget`. Open/Close state is purely local.

### 6.2 Centralized Dialog Manager

Remove hidden dialog overlays from `JobView.tsx` (File Deletion, Mark Urgent, Time Confirmation). Deploy a `DialogManager` inside the main layout wrapper:

```tsx
// src/components/JobView/DialogManager.tsx
const { openDialogId, dialogProps, closeDialog } = useUIStore();

return (
  <>
    {openDialogId === 'delete-file' && <DeleteFileDialog {...dialogProps} onClose={closeDialog} />}
    {openDialogId === 'mark-urgent' && <MarkUrgentDialog {...dialogProps} onClose={closeDialog} />}
    {openDialogId === 'time-confirm' && <TimeConfirmDialog {...dialogProps} onClose={closeDialog} />}
  </>
);
```

This removes thousands of lines of conditionally-hidden component JSX from the initial render lifecycle.
