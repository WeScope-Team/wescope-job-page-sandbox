# V2 Deep-Dive Validation: Job Page Architectural Blueprint

> **Scope**: `src/components/JobView.tsx` (2,260 lines) + `src/components/JobView/` (41 files)
> **Purpose**: A strict, programmatic blueprint for migrating the static Job Page to a dynamic drag-and-drop canvas.

---

## 1. Gap Analysis & Verification

### 1.1 Complete File Manifest (41 files)

| # | File | Size (KB) | V1 Covered? | Category |
|---|------|-----------|-------------|----------|
| 1 | `TasksDetails.tsx` | 100.5 | ✅ | **Widget** |
| 2 | `RevisionTaskDialog.tsx` | 84.9 | ❌ MISSED | Dialog |
| 3 | `EditJobDialog.tsx` | 81.1 | ✅ | Dialog |
| 4 | `JobNotes.tsx` | 64.9 | ✅ | **Widget** |
| 5 | `QATaskDialog.tsx` | 64.3 | ✅ | Dialog |
| 6 | `InitiateAudit.tsx` | 62.5 | ❌ MISSED | Dialog |
| 7 | `UploadOnlyTaskDialog.tsx` | 52.4 | ❌ MISSED | Dialog |
| 8 | `SupplementalTaskDialog.tsx` | 48.6 | ❌ MISSED | Dialog |
| 9 | `QATaskDialogInline.tsx` | 40.2 | ❌ MISSED | Dialog (variant) |
| 10 | `ChangeOrderQATaskDialog.tsx` | 35.7 | ❌ MISSED | Dialog |
| 11 | `PrelimWTRTaskDialog.tsx` | 33.9 | ❌ MISSED | Dialog |
| 12 | `SketchTaskDialog.tsx` | 32.4 | ✅ | Dialog |
| 13 | `ScopeTaskDialog.tsx` | 33.1 | ✅ | Dialog |
| 14 | `InsuranceCarrierGuidelines.tsx` | 31.6 | ✅ | **Widget** |
| 15 | `ScopeRevisionTaskDialog.tsx` | 28.8 | ❌ MISSED | Dialog |
| 16 | `ChangeOrderScopeDialog.tsx` | 27.9 | ❌ MISSED | Dialog |
| 17 | `ScopeTaskDialogInline.tsx` | 27.9 | ❌ MISSED | Dialog (variant) |
| 18 | `LossSummary.tsx` | 24.7 | ✅ | **Widget** |
| 19 | `ViewEditAudit.tsx` | 23.1 | ❌ MISSED | Dialog |
| 20 | `FileGalleryDialog.tsx` | 22.4 | ❌ MISSED | Dialog |
| 21 | `SketchRevisionTaskDialog.tsx` | 21.5 | Part. | Dialog |
| 22 | `CreateSketchRevisionDialog.tsx` | 18.9 | Part. | Dialog |
| 23 | `EstimateValueDialog.tsx` | 18.6 | Part. | Dialog |
| 24 | `AriseQualityReviewDialog.tsx` | 17.4 | Part. | Dialog |
| 25 | `LargeLossApprovalDialog.tsx` | 17.2 | Part. | Dialog |
| 26 | `PendingInfoDialog.tsx` | 15.8 | Part. | Dialog |
| 27 | `DisqualifyIntakeDialog.tsx` | 15.0 | Part. | Dialog |
| 28 | `LargeLossCallDialog.tsx` | 13.8 | Part. | Dialog |
| 29 | `CreateScopeRevisionDialog.tsx` | 13.5 | Part. | Dialog |
| 30 | `GuidelineChangeRequest.tsx` | 12.4 | ❌ MISSED | Dialog |
| 31 | `DisqualifyDialog.tsx` | 12.1 | ✅ | Dialog |
| 32 | `WorkflowStepsDialog.tsx` | 8.7 | Part. | Dialog |
| 33 | `DisqualifySketchDialog.tsx` | 7.6 | Part. | Dialog |
| 34 | `RequestApprovalDialog.tsx` | 4.8 | Part. | Dialog |
| 35 | `SwitchTaskDialog.tsx` | 4.7 | Part. | Dialog |
| 36 | `OtherActiveTaskDialog.tsx` | 4.1 | Part. | Dialog |
| 37 | `JobDetails.tsx` | 3.5 | ✅ | **Widget** |
| 38 | `ViewSketchDisqualificationDialog.tsx` | 3.3 | Part. | Dialog |
| 39 | `CancelTaskDialog.tsx` | 2.3 | Part. | Dialog |
| 40 | `ViewDisqualificationDialog.tsx` | 1.9 | Part. | Dialog |
| 41 | `JobTimeline.tsx` | 1.4 | ✅ | **Widget** |

### 1.2 Critical Gaps Identified

> [!WARNING]
> The V1 inventory missed **11 full components** and only partially covered **16 dialog components**. The most critical gaps are:

| Missed Component | Impact | Why It Matters |
|---|---|---|
| `RevisionTaskDialog.tsx` (85KB) | 🔴 Critical | Largest dialog; handles all revision submission workflows including sub-revisions, CRM delivery, email, and workflow checklists |
| `InitiateAudit.tsx` (63KB) | 🔴 Critical | Contains embedded PDF parsing engine (PDF.js), audit point scoring system, and line-item multi-select |
| `UploadOnlyTaskDialog.tsx` (52KB) | 🟡 High | Full task submission with CRM delivery, email, workflow checklist |
| `SupplementalTaskDialog.tsx` (49KB) | 🟡 High | Supplemental task submission with estimate value tracking |
| `QATaskDialogInline.tsx` (40KB) | 🟡 High | Inline variant of QA dialog — used for different rendering context |
| `ChangeOrderQATaskDialog.tsx` (36KB) | 🟡 High | Change order QA submission with trade-specific fields |
| `PrelimWTRTaskDialog.tsx` (34KB) | 🟡 High | Preliminary/WTR task submission |
| `FileGalleryDialog.tsx` (22KB) | 🟡 High | Full-screen file browser with sidebar folder tree, search, upload, download |
| `GuidelineChangeRequest.tsx` (12KB) | 🟢 Medium | Slack-integrated guideline change request form |
| `ViewEditAudit.tsx` (23KB) | 🟡 High | Read-only/editable audit viewer |
| `ScopeTaskDialogInline.tsx` (28KB) | 🟡 High | Inline variant of scope dialog |

---

## 2. Layout Topology — Exact Rendering Order

The JSX return block of `JobView.tsx` (lines 1352–2256) renders the following visual hierarchy:

```
┌──────────────────────────────────────────────────────────────┐
│ <div className="flex-1 overflow-auto">                       │
│  <div className="px-8 py-6">                                 │
│                                                              │
│  ┌─ HEADER ──────────────────────────────────────────────┐   │
│  │ [← Back] Job_Number (h1, click-to-copy)               │   │
│  │ Client_Name (link to /clients)                        │   │
│  │ [Urgent Switch (hidden)] [EditJobDialog trigger btn]  │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─ ROW 1: JOB DETAILS ─────────────────── className="mb-7"─┐│
│  │ <JobDetails jobData={jobData} PocInfoComponent={...} />   ││
│  │ Grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-5           ││
│  │ Fields: Insured Name, Zip, Client Proj#, POC popover,     ││
│  │         Job Type, Order Type, Insurance Carrier,          ││
│  │         Claim#, MRP, Estimation Software                  ││
│  └───────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─ ROW 2: GUIDELINES ──────────────────── className="mb-7"─┐│
│  │ <InsuranceCarrierGuidelines defaultCollapsed={true} />    ││
│  │ Searchable, filterable, voice-enabled guideline display   ││
│  └───────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─ ROW 3: LOSS SUMMARY ─────────────────── (conditional) ──┐│
│  │ <LossSummary jobData={jobData} user={user} />             ││
│  │ Only renders if jobData has summary data                  ││
│  └───────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─ ROW 4: LINKS & FILES ─── grid grid-cols-1 md:grid-cols-2│
│  │  gap-8 mb-7                                               │
│  │ ┌─ COL 1: Links Card ──┐ ┌─ COL 2: Files Card ────────┐  │
│  │ │ ScrollArea h-[250px]  │ │ Breadcrumbs + DnD folders  │  │
│  │ │ Matterport + Other    │ │ ScrollArea h-[200px]       │  │
│  │ │ CompanyCam integration│ │ Upload/Download/Delete     │  │
│  │ │ Photo download        │ │ Expand → FileGalleryDialog │  │
│  │ └──────────────────────┘ └─────────────────────────────┘  │
│  └───────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─ ROW 5: TASKS TABLE ─────────────────────────────────────┐│
│  │ <TasksDetails                                             ││
│  │   tasks={jobData._tasks_in_job}                           ││
│  │   submits={jobData._submits_in_job}                       ││
│  │   ... (30+ props)                                         ││
│  │ />                                                        ││
│  │ Internally renders 25+ dialog components                  ││
│  └───────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─ FLOATING: Delete File Dialog ────────────────────────────┤│
│  ├─ FLOATING: FileGalleryDialog ─────────────────────────────┤│
│  ├─ FLOATING: CompanyCamViewer ──────────────────────────────┤│
│  ├─ FLOATING: Time Confirmation Dialog ──────────────────────┤│
│  └─ FLOATING: Mark Urgent Dialog ────────────────────────────┤│
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.1 Widget Registry (Draggable Candidates)

For the new canvas, these are the **6 primary widgets** that should be treated as atomic, draggable units:

| Widget ID | Component | Default Grid Position | Default ColSpan |
|---|---|---|---|
| `job-details` | `<JobDetails>` | Row 0 | 12 |
| `insurance-guidelines` | `<InsuranceCarrierGuidelines>` | Row 1 | 12 |
| `loss-summary` | `<LossSummary>` | Row 2 | 12 |
| `links` | Inline Card in `JobView.tsx` | Row 3, Col 0 | 6 |
| `files` | Inline Card in `JobView.tsx` | Row 3, Col 6 | 6 |
| `tasks-details` | `<TasksDetails>` | Row 4 | 12 |

> [!IMPORTANT]
> The **Links** and **Files** sections are NOT standalone components — they are ~600 lines of inline JSX within `JobView.tsx` (lines 1639–2116). They must be **extracted** into standalone `<LinksWidget>` and `<FilesWidget>` components before they can be placed in a widget registry.

### 2.2 Non-Draggable Elements (Must Remain Fixed)

| Element | Location | Reason |
|---|---|---|
| Header (Back btn + Job Number + Client Name) | JobView.tsx L1358-1400 | Navigation chrome; always visible |
| EditJobDialog trigger button | JobView.tsx L1391-1398 | Part of header actions |
| JobNotes sidebar panel | Rendered by parent `ProjectView.tsx` | Global side panel, not a widget |
| All TasksDetails dialogs (25+) | TasksDetails.tsx L1880-2345 | Portaled overlays, not widget content |

---

## 3. TypeScript Interface Mapping

### 3.1 JobView Props (Root Orchestrator)

```typescript
// JobView.tsx:71-78
interface JobViewProps {
  jobId: number;
  crmUsedData: any[];                // System access credentials (Matterport, CompanyCam, Alacrity, etc.)
  ordersInProject: Array<number>;    // Order type IDs for the project
  onBackToProject: () => void;       // Navigation callback
  onProjectUpdate?: () => void;      // Cache invalidation callback
  internalUsers?: any[];             // Users for @mention in notes
}
```

### 3.2 Widget Props

#### JobDetails
```typescript
// JobDetails.tsx:8-12
interface JobDetailsProps {
  jobData: any;                      // Full job object from getJobById()
  className?: string;                // Tailwind classes for layout
  PocInfoComponent?: React.ReactNode; // Injected Popover for Client POC
}
// Internal fields extracted: insured_name, zip_code, Client_Project_Number,
// client_poc_name, job_type, order_type_id, _insurance_carriers.Name,
// Insurance_Claim_Number, mrp_name, Estimation_Software
```

#### InsuranceCarrierGuidelines
```typescript
// InsuranceCarrierGuidelines.tsx (from previous analysis)
// Props passed from JobView.tsx L1622-1631:
{
  insuranceCarrierId: number;        // jobData.insurance_carriers_id
  managedRepairProgramId: number;    // jobData.managed_repair_program_id
  jobTypeId: number;                 // jobData.job_type_id
  clientId: number;                  // jobData.client_id
  estimationSoftware: string;        // jobData.estimation_software || 'Xactimate'
  defaultCollapsed: boolean;         // true
  className: string;                 // 'mb-7'
  jobData: any;                      // Full job object (for GuidelineChangeRequest)
}
```

#### LossSummary
```typescript
// LossSummary.tsx (from previous analysis)
// Props passed from JobView.tsx L1634:
{
  jobData: any;    // Full job object — accesses jobData.summary (JSON)
  user: any;       // Current authenticated user
}
```

#### TasksDetails
```typescript
// TasksDetails.tsx — the largest prop interface (~30 props)
// Passed from JobView.tsx L2119-2168:
{
  tasks: any[];                       // jobData._tasks_in_job
  tasksInProject: any[];              // jobData._tasks_in_project
  submits: any[];                     // jobData._submits_in_job
  client_poc_email: string;
  client_poc_name: string;
  insured_name: string;
  thread_id: string;                  // jobData.intake_threadID
  intake_subject: string;
  client_id: number;
  jobNumber: string;
  large_loss: boolean;
  order_type_id: number;
  estimationSoftware: string;
  job_type_id: number;
  job_type: string;
  currentEstimateValue: number;
  intake_preferences_delivery: string[];  // jobData._intake_preferences.Delivery
  crmUsedData: any[];
  mrp_id: number;
  carrier_id: number;
  client_project_number: string;
  workflows: any[];                   // jobData._workflows_of_client
  onTasksUpdate: (updatedTasks: any[]) => void;
  subCategories: any[];
  esmSlack_id: string;
  clientName: string;
  subscription_id: number;
  insuranceClaimNumber: string;
  systemAccessLogins: any[];          // projectData._system_access_logins_of_client
  dueDateKnobs: any[];
  jobData: any;                       // Full job object (used for revision dialogs)
}
```

#### JobNotes
```typescript
// JobNotes.tsx:42-51
interface JobNotesProps {
  isVisible: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  jobId?: string | number;
  jobData: any;           // Detailed job data (required)
  internalUsers?: any[];  // For @mention picker
  currentUser?: any;      // Authenticated user
}
```

#### JobTimeline
```typescript
// JobTimeline.tsx:6-9
interface JobTimelineProps {
  currentEstimateValue: number;
  className?: string;
}
// NOTE: This is a stub component — only shows a collapsible header + placeholder text.
```

### 3.3 EditJobDialog — Full Form Schema

```typescript
// EditJobDialog.tsx:83-121
interface JobFormData {
  id?: number;
  client_project_number: string;
  job_number: string;
  orderType: string;            // 'Sketch Only' | 'Scope Only' | 'Sketch & Scope' | 'Supplemental' | 'Revision'
  jobType: string;              // 'ASB'|'BIO'|'CON'|'MLD'|'RFG'|'STC'|'STR'|'WTR'|'TMP'
  sketchrequired: boolean;
  additionalInfo: string;
  estimatedRooms: number;
  numberOfKitchens: number;
  numberOfBathrooms: number;
  insuranceCarrier: string;
  managedRepairProgram: string;
  sketchOverride: string;       // User name for override
  scopeOverride: string;
  qaOverride: string;
  anticipatedLargeLoss: 'yes' | 'no';
  dateRequestReceived: string;
  dateSketchInfoAvailable: string;
  dateSketchInfoMissing: string[];
  dateScopeInfoAvailable: string;
  dateScopeInfoMissing: string[];
  dateRevisionInfoAvailable: string;
  dateSupplementalInfoAvailable: string;
  originalEstimateValue: string;
  jobNotes: string;
  estimationSoftware: string;
  insuranceClaimNumber: string;
  revisionTaskType: string;
  clientPoc: string;
  contact_of_client?: Array<{ id; Email; Full_Name; User_role_id; Inactive; associated_user_inactive }>;
}
```

---

## 4. Mutation & Data-Flow Catalog

### 4.1 Primary Data Fetching (react-query)

| Query Key | Source | Called In | Invalidated By |
|---|---|---|---|
| `['job', jobId]` | `getJobById(jobId)` | JobView.tsx L748-752 | Every mutation handler |
| `['project', projectId]` | `getProjectById(projectId)` | JobView.tsx L757-761 | File upload/delete |
| `['insurance-carriers']` | `getDirectInsuranceCarriers()` | JobView.tsx L777-781 | Never (staleTime: Infinity) |
| `['managed-repair-programs']` | `/api/direct-db/managed-repair-programs` | JobView.tsx L784-792 | Never |
| `['users', 'override']` | `/api/direct-db/users?internal_only=true` | JobView.tsx L795-805 | Never |
| `['sub-categories']` | `/api/direct-db/sub-categories` | JobView.tsx L808-816 | Never |
| `['due-date-knobs']` | `getDirectDueDateKnobs()` | JobView.tsx L819-823 | Never |

### 4.2 Xano API Mutations

| Mutation | xano-client Function | Called In | Purpose |
|---|---|---|---|
| Update job | `updateJob(id, payload)` | JobView L1087, L1159 | Toggle urgent, cancel |
| Update job (workflow) | `wfupdateJob(id, payload)` | EditJobDialog L564 | Full job edit (triggers workflow task creation) |
| Create workflow tasks | `createWorkflowTasks(id, payload)` | EditJobDialog L578 | Create pending info tasks |
| Create change record | `createChange(changeData)` | EditJobDialog L730, JobView L1219/1325 | Audit trail for job/file changes |
| Track task click | `trackTaskClick({ user_id, new_task_id, type })` | JobView L958-962 | Auto-start timer |
| Delete file | `deleteFile(fileId)` | JobView L1206 | File deletion |
| Upload project file | `uploadProjectFile(projectId, file, submitId?)` | JobView L1295 | File upload |
| Update file | `updateFile(fileId, { File_Note })` | JobView L891, L1312 | Move file to folder |
| Get signed URL | `getGoogleFileUrl(fileId)` | Multiple locations | File viewing/downloading |
| Create job note | `createJobNote(data)` | JobNotes L425-444 | Add note to timeline |
| Update summary job | `updateSummaryJob(...)` | LossSummary (internal) | Toggle/delete/add items |
| Uncancel job | `uncancelJob(id, reason)` | EditJobDialog L789 | Reverse cancellation |
| Create audit | `createAudit(payload)` | InitiateAudit L610-640 | Create quality audit |
| Submit QA | `submitQA(taskId, data)` | QATaskDialog L641 | QA task completion |
| Upload to CRM | `uploadToCRM(payload)` | QATaskDialog L677 | CRM delivery post-QA |
| Create estimator request | `createEstimatorRequest(data)` | GuidelineChangeRequest L140 | Guideline change request |

### 4.3 Non-Xano API Calls

| Endpoint | Called In | Purpose |
|---|---|---|
| `/api/slack` | JobView L1100, GuidelineChangeRequest L157 | Slack notifications for urgent marking, guideline changes |
| `/api/integrations/matterport/get-model-photos` | JobView L278 | Download Matterport model photos |
| `/api/integrations/companycam/list-photos` | JobView L1260 | Fetch CompanyCam project photos |
| `/api/integrations/alacrity/search-assignments` | QATaskDialog L302 | Fetch Alacrity trade assignments |
| `/api/browserbase/alacrity/alacrity-submission` | QATaskDialog L727 | Automated Alacrity submission (fire-and-forget) |

### 4.4 Cache Invalidation Pattern

```
Every mutation → invalidateQueries(['job', jobId])
                → onProjectUpdate?.()  // parent refreshes project-level data
                → getCurrentUser()     // refresh user's active task list
                → invalidateQueries(['project', projectData?.id])  (file ops only)
```

---

## 5. State & Edge-Case Handling

### 5.1 Task Auto-Start Timer System

This is the most complex state machine in the codebase. It spans 3 `useEffect` hooks in `JobView.tsx` (lines 900-995):

```
                    ┌──────────────────────────┐
                    │ Page Load                │
                    │ Store current active     │
                    │ task ID in              │
                    │ lastAutoStartedTaskIdRef │
                    └────────┬─────────────────┘
                             │
                    ┌────────▼─────────────────┐
                    │ Effect 1: Detect         │
                    │ completion               │
                    │ (active → none)          │
                    │ Set lastCompletedTaskId  │
                    │ Set recentlyCompletedId  │
                    └────────┬─────────────────┘
                             │
                    ┌────────▼─────────────────┐
                    │ Effect 2: Auto-start     │
                    │ next Ready task          │
                    │ Guards:                  │
                    │ - Role = LL Estimator|ESM│
                    │ - No active tasks        │
                    │ - Task ≠ last auto-start │
                    │ - Fresh fetch confirms   │
                    │   task still Ready       │
                    └────────┬─────────────────┘
                             │
                    ┌────────▼─────────────────┐
                    │ Effect 3: Cleanup        │
                    │ Clear refs once task is  │
                    │ no longer Ready          │
                    └──────────────────────────┘
```

> [!IMPORTANT]
> This logic uses **3 refs** (`prevActiveTaskIdRef`, `lastCompletedTaskIdRef`, `lastAutoStartedTaskIdRef`) plus **1 state** (`recentlyCompletedTaskId`) to prevent race conditions. The new canvas **must** preserve this exact logic — it should live in a shared hook or context, NOT inside individual widgets.

### 5.2 Time Override Dialog

Located in `JobView.tsx` L1402-1510. Triggered after task completion:

| State | Type | Purpose |
|---|---|---|
| `isTimeConfirmDialogOpen` | `boolean` | Shows time confirmation dialog |
| `taskTimeData` | `{ taskId, timeSpent, taskType }` | Current completion data |
| `isOverrideMode` | `boolean` | Toggles between confirm/override views |
| `overrideTimeValue` | `string` | Manual time input (minutes) |
| `overrideReason` | `string` | Required explanation for override |

### 5.3 Dialog Minimize/Restore Pattern

Several task dialogs implement a minimizable pattern (minimizes to a floating bottom-right chip instead of closing):

| Dialog | Pattern |
|---|---|
| `QATaskDialog` | `isMinimized` state → renders fixed `bottom-20 right-4` chip with restore/close buttons |
| `GuidelineChangeRequest` | Same pattern — progress indicator shows completion state |
| `ScopeTaskDialog` | Same pattern |
| `SketchTaskDialog` | Same pattern |

**Behavior**: ESC/click-outside → minimize (NOT close). Explicit X button → full close. This preserves in-progress form data.

### 5.4 RBAC Gating (PermissionGuard + hasPermission)

Permissions used across the page:

| Permission Constant | Used For | Location |
|---|---|---|
| `PERMISSIONS.SET_TO_PENDING_INFO` | "Set to Pending Info" dropdown item | TasksDetails L1625 |
| `PERMISSIONS.VIEW_EDIT_ESTIMATE_VALUES` | "Edit Estimate Values" menu item | TasksDetails L1673 |
| `PERMISSIONS.SET_TO_LARGE_LOSS` | Large loss toggle menu items | TasksDetails L1686, L1698 |
| `PERMISSIONS.VIEW_DISQUALIFY` | All disqualification actions | TasksDetails L1714+ |
| `PERMISSIONS.VIEW_CANCEL_TASK` | "Cancel Task" option | TasksDetails L1818 |
| `PERMISSIONS.CHANGE_TO_SUPPLEMENTAL` | "Change to Supplemental" | TasksDetails L1825 |
| `PERMISSIONS.SKETCH_REVISION` | "Request Revision" for sketch | TasksDetails L1832 |
| `PERMISSIONS.DELETE_FILES` | File delete button visibility | JobView L2086 |

### 5.5 Access Flags (Feature Flags)

```typescript
// Used in QATaskDialog:
ACCESS_FLAGS.AUTOMATED_ALACRITY_DELIVERY  // Enables Alacrity trade selection + auto-submit
```

### 5.6 Task Type Decision Matrix

The dropdown menu in `TasksDetails` uses `task.task_type_id` as a router for which dialog to open:

| task_type_id | Type | Dialog Component |
|---|---|---|
| 1 | Sketch | `SketchTaskDialog` |
| 2 | Large Loss Call | `LargeLossCallDialog` |
| 3 | Large Loss Approval | `LargeLossApprovalDialog` |
| 4 | Scope | `ScopeTaskDialog` |
| 5 | QA | `QATaskDialog` |
| 6 | Change Order Scope | `ChangeOrderScopeDialog` |
| 7 | Change Order QA | `ChangeOrderQATaskDialog` |
| 8 | Revision | `RevisionTaskDialog` |
| 9 | Supplemental | `SupplementalTaskDialog` |
| 16 | Upload Only | `UploadOnlyTaskDialog` |
| 17 | ARISE | `AriseQualityReviewDialog` |
| 18 | Sketch Revision | `SketchRevisionTaskDialog` |
| 19 | Scope Revision | `ScopeRevisionTaskDialog` |
| 20 | Preliminary | `PrelimWTRTaskDialog` |

### 5.7 Conditional Rendering Rules

| Condition | Effect |
|---|---|
| `jobData.summary` is truthy | Show `<LossSummary>` |
| `defaultCollapsed={true}` | Guidelines card starts collapsed |
| `task.Task_Status === 'Completed'` | Show "View Details" instead of "Edit Task" |
| `task.Task_Status === 'Ready' && task.task_type_id in [1,4,9,6]` | Show "Set to Pending Info" |
| `submit.Source === 'Post-Disqualification'` | Show "View Disqualification" instead of "Disqualify" |
| `submit.Reported_Quality === 'Unsatisfactory'` | Show "Reverse Disqualification" |
| `!large_loss && task_type_id === 4 && Ready` | Show "Set To Large Loss" |
| `large_loss && task_type_id === 2 && (Ready\|Pending)` | Show "Unset Large Loss" |
| `task_type_id === 8 && !Completed && !Canceled` | Show "Change to Supplemental" |
| `sketchRevisionTaskReadyExists === false` | Show "Request Revision" for sketch tasks |
| `CompanyCam system_access_id === 10 && API_Key present` | Enable CompanyCam photo viewer |
| `user.Role_Employee in ['LL Estimator', 'ESM']` | Enable auto-start timer |
| `hasPermission(user.role_id, PERMISSIONS.DELETE_FILES)` | Show file delete button |

---

## 6. Recommended Widget Architecture for Canvas

### 6.1 JSON Layout Schema (Proposal)

```json
{
  "version": 1,
  "widgets": [
    { "id": "job-details", "row": 0, "col": 0, "colSpan": 12, "component": "JobDetailsWidget" },
    { "id": "insurance-guidelines", "row": 1, "col": 0, "colSpan": 12, "component": "InsuranceGuidelinesWidget" },
    { "id": "loss-summary", "row": 2, "col": 0, "colSpan": 12, "component": "LossSummaryWidget", "conditional": "jobData.summary" },
    { "id": "links", "row": 3, "col": 0, "colSpan": 6, "component": "LinksWidget" },
    { "id": "files", "row": 3, "col": 6, "colSpan": 6, "component": "FilesWidget" },
    { "id": "tasks-details", "row": 4, "col": 0, "colSpan": 12, "component": "TasksDetailsWidget" }
  ]
}
```

### 6.2 Data Provider Pattern

```typescript
// Instead of prop-drilling 30+ props into TasksDetails,
// wrap the canvas in a data provider:

interface JobPageContext {
  jobData: JobData;
  projectData: ProjectData;
  user: User;
  crmUsedData: any[];
  insuranceCarriers: any[];
  managedRepairPrograms: any[];
  overrideUsers: any[];
  subCategories: any[];
  dueDateKnobs: any[];
  
  // Actions
  invalidateJob: () => void;
  invalidateProject: () => void;
  refreshUser: () => void;
}
```

### 6.3 Dialog Manager Pattern

All 25+ dialogs in `TasksDetails` should be moved to a centralized Dialog Manager:

```typescript
interface DialogManager {
  open: (dialogId: string, props: Record<string, any>) => void;
  close: (dialogId: string) => void;
  minimize: (dialogId: string) => void;
  restore: (dialogId: string) => void;
}

// Registry maps dialog IDs to components:
const DIALOG_REGISTRY = {
  'sketch-task': SketchTaskDialog,
  'scope-task': ScopeTaskDialog,
  'qa-task': QATaskDialog,
  'revision-task': RevisionTaskDialog,
  // ... 20+ more
};
```

### 6.4 Components Requiring Extraction Before Canvas Migration

| Current Location | Extract To | Lines of Code |
|---|---|---|
| Links Card (JobView.tsx L1639-1757) | `src/components/JobView/LinksWidget.tsx` | ~120 lines |
| Files Card (JobView.tsx L1759-2116) | `src/components/JobView/FilesWidget.tsx` | ~360 lines |
| File Upload Dialog (JobView.tsx L437-698) | `src/components/JobView/JobFileUploadDialog.tsx` | ~260 lines |
| Header section (JobView.tsx L1358-1400) | `src/components/JobView/JobHeader.tsx` | ~45 lines |

---

## 7. External Integration Points

| Integration | System Access ID | Used In | Credential Field |
|---|---|---|---|
| Matterport | 6 | Links section (auth token append, photo download) | `API_Key` |
| CompanyCam | 10 | Links section (photo viewer) | `API_Key` |
| Alacrity | 5 | QATaskDialog (trade search + automated submission) | `API_Key`, `Company_Code`, `Username`, `Password` |
| Dash CRM | 7 | QATaskDialog (delivery routing) | via `crmUsedData` |
| RMS CRM | 22 | QATaskDialog | via `crmUsedData` |
| Fusion CRM | 24 | QATaskDialog | via `crmUsedData` |
| PSA CRM | 18 | QATaskDialog | via `crmUsedData` |
| Builder Trend | 8 | QATaskDialog | via `crmUsedData` |
| Albiware | 50 | QATaskDialog | via `crmUsedData` |
| Encircle | 12 | QATaskDialog | via `crmUsedData` |

---

> [!NOTE]
> This document supersedes the V1 Architectural Inventory and should be used as the authoritative reference for all canvas migration work.
