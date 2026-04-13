# Job Page Architectural Inventory

## Objective
A 100% comprehensive, structured taxonomy of layout elements, data dependencies, conditional rendering rules, and mutation workflows of the Job Page across all files in `src/components/JobView/` and `src/components/pages/ProjectView.tsx`. This output serves as a rigid JSON schema blueprint for future drag-and-drop canvas configuration.

---

## 1. Component & Layout Topology (The "Widgets")

### 1.1 `ProjectView` (Wrapper Layout)
- **Widget Name**: Project Header & Shell wrapper.
- **Placement**: Root layout wrapper for `/view?project=[id]&job=[id]`.
- **Granular UI Elements**: AlacritySidebar, NotificationBell, Global Search/Breadcrumbs, "Upload Files" dropzone header, Matterport/CompanyCam integrations buttons.
- **Interactivity**: Breadcrumb nav, file drop functionality over entire page, popovers for notifications.

### 1.2 `JobView` (Core Active Layout)
- **Widget Name**: Job View Main Pane.
- **Placement**: Center-right document body when a Job is active.
- **Granular UI Elements**: Urgent Flag Toggles, Urgent Action Alert banners, "Delete File" controls, Layout skeleton wrappers.
- **Interactivity**: Integrates `JobDetails`, `TasksDetails`, `LossSummary`, `JobNotes`, `JobTimeline`, `InsuranceCarrierGuidelines` into a stacked grid layout.

### 1.3 `JobDetails`
- **Widget Name**: Job Characteristics Info Grid.
- **Placement**: Top grid block inside `JobView`.
- **Granular UI Elements**: 10 Read-only fields: Insured Name, Zip Code, Client Project Number, Client POC, Job Type, Order Type, Insurance Carrier, Insurance Claim Number, Managed Repair Program, Estimation Software.
- **Interactivity**: Inline "Copy to Clipboard" buttons beside values.

### 1.4 `TasksDetails`
- **Widget Name**: Tasks Datatable / Task Management Grid.
- **Placement**: Center datatable block.
- **Granular UI Elements**: Row per task. Fields: Status badges, task type, assigned estimator name, SLA completion milestones.
- **Interactivity**: Collapsible rows for nested requests. Action Meatball Menu inside each row (View, Edit, Quality Review, Disqualify).

### 1.5 `LossSummary`
- **Widget Name**: Property Loss Tracker.
- **Placement**: Middle layout block, below details.
- **Granular UI Elements**: Room by room breakdown tables, fields for item descriptions, counts, categories.
- **Interactivity**: Accordions per room. Inline inputs to add new properties, trash-can hover actions to delete items.

### 1.6 `InsuranceCarrierGuidelines`
- **Widget Name**: Dynamic Guidelines Banner.
- **Placement**: Top section alert/info card, floating or embedded before Tasks.
- **Granular UI Elements**: Carrier rule text blocks, embedded voice/MIC agent toggles.
- **Interactivity**: Accordions for reading long policies, Voice Agent toggle.

### 1.7 Dialog Widgets (The "Workflow Triggers")
Over 40 specific modal dialog components exist inside `/src/components/JobView/`.
- **Primary Type: Task Completion Forms** (e.g., `QATaskDialog`, `ScopeTaskDialog`, `RevisionTaskDialog`): File choosers, textareas for notes, time-to-complete override toggles.
- **Secondary Type: Disqualification/Cancel** (e.g., `DisqualifyDialog`, `CancelTaskDialog`): Dropdown select reasons, multi-select reasons, "Cancel" verifications.
- **Tertiary Type: Job Level Edits** (e.g., `EditJobDialog`, `EstimateValueDialog`): Pickers for dates, input fields for zip codes/financial values.
- **Utility Dialogs**: `InitiateAudit`, `ViewEditAudit`, `FileGalleryDialog`, `OtherActiveTaskDialog`.

---

## 2. Data Hydration Mapping (The "Props & State")

This table restricts to the exact React Query sources and Xano endpoints hydration mapping.

| Widget | Required Data Entities | Specific Fields Extracted | Refresh Triggers |
|--------|------------------------|---------------------------|------------------|
| **ProjectView** | `project`, `clients`, `users` | `project.Project_Zip_Code`, `project.Insured_Name`, `project.Matterport_Links`, `client_id` | `useQuery(['project', id])` polling/focus |
| **JobView** | `job`, `insurance_carriers`, `managed_repair_programs`, `crmUsedData` | `job.Job_Number`, `job.project_id`, `job._insurance_carriers`, `job.tasks_in_job`, `urgentNote` | `useQuery(['job', id])` / Refetch on URL change |
| **JobDetails** | `jobData` (Prop drill) | `insured_name`, `zip_code`, `Client_Project_Number`, `client_poc_name`, `job_type`, `order_type_id`, `mrp_name` | Derived prop state |
| **TasksDetails**| `tasks`, `submits` (Props drill) | `task.Task_Status`, `task.Type`, `task.Assigned_To_id`, `task.Date_Due`, `task._cancelation_of_task` | Inherits re-renders from JobView QueryClient invalidations |
| **LossSummary** | `jobData` (Prop drill) | JSON Array of objects containing Room, Item, Description, Material | Derived from `jobData` |
| **All Dialogs** | Lookups fetched internally | Options logic (`getSpecifyMissingOptions`, `getSubCategoryOptions`, `getDeliveryInstructions` via Axios/Fetch) | `useEffect` load on Dialog open state `isOpen === true` |

---

## 3. Mutation Surfaces & Workflows (The "Actions")

Exhaustive catalog of every actionable/writable trigger that posts to backend mutations.

| Action Name | Trigger Element | Dialog / Workflow Orchestration | Payload Blueprint (Xano Target) |
|-------------|-----------------|----------------------------------|---------------------------------|
| **Edit Project** | Menu/Button in App Header | `EditProjectDialog` renders -> requires change Reason. | `PATCH /api/projects/{id}` + POST to Changes log table for auditability. |
| **Upload Global Files** | "Upload" Icon / Dropzone | `JobFileUploadDialog` -> Select Category -> Upload | Files multipart array + `reason` + `folder` to Xano endpoint. |
| **Edit Job Metadata** | "Edit" button near JobDetails | `EditJobDialog` opens. Prompts changes to dates and statuses. | `PATCH /api/jobs/{id}` updates dates, override assignments, missing info arrays. |
| **Complete Core Task** | Task Row Menu "Complete" | Opens contextually aware dialog e.g., `QATaskDialog` or `SketchTaskDialog`. Requires files, notes, SLA overrides. | `POST /api/submits`. Usually requires `timeToComplete` integer and structured file mappings. |
| **Start/Switch Task** | Task Row "Play/Resume" | Checks `userActiveTasks`. If another task is active, opens `OtherActiveTaskDialog` -> `SwitchTaskDialog`. | `PATCH` to the active task (pauses clock), `PATCH` to target task (starts clock). |
| **Disqualify Task** | Task Row Action | `DisqualifyDialog` / `DisqualifyIntakeDialog` opens. Requires select input reason. | `PATCH /api/tasks/{id}` setting Status to "Disqualified", `POST` new request/submit with reason. |
| **Request Appr.** | "Request Appr." Button | `RequestApprovalDialog` appears. | Sets `approvedDate` and `approvedValue` via mutations on specific job entities. |
| **Change Order** | Task Sub-menu | e.g. `ChangeOrderQATaskDialog` | Posts a new `change_order` submit context payload. |
| **Save Guideline** | Guideline Edit Hover | `GuidelineChangeRequest` popover triggers. | Posts directly to user suggestion db. |

---

## 4. Conditional Render Matrix (The "Rules Engine")

Granular mapping of business logic defining IF a widget/action is visible.

### 4.1 Role-Based Access Control (RBAC) Wrappers
Utilizes `<PermissionGuard>` component checking `PERMISSIONS.X` flags:
- **Deletion Actions**: Files or objects wrapped in `hasPermission(PERMISSIONS.DELETE)`.
- **Edit Audit/Admin UI**: `InitiateAudit` and overriding auto-assigned estimation times requires elevated privileges.
- **Global Edit**: Global properties on `ProjectView` restrict to Estimator/Admin.

### 4.2 State-Based Render Logic
- **Task Row Actions visibility**:
  - `Play` icon: Visible IF task is `ready` or `paused`.
  - `Pause` icon: Visible IF task is active (`user_clicked`).
  - `Complete` / `Submit` menu item: Visible depending on task lifecycle state.
  - `Disqualify` button: Hidden if task matches `canceled` or `completed`.
- **Dialog Context Logic**:
  - `isSubmitting`/`isLoading` boolean states block form re-sumits via `disabled={true}` across all Action dialogs.
  - *SLA Timer Logic*: If an active task is started internally, form forces user to input `Override TimeReason` mathematically.

### 4.3 Data-Driven Logic (Entity Checks)
- **Matterport/CompanyCam Buttons**: Only show in `ProjectView` IF `job.matterport_url` or `matterport_links[]` is not empty, AND the user has tool access flags initialized in app logic.
- **File Gallery Dropdown**: Shows specific internal mapping (e.g. `Photos/Before`) IF matching string parses natively out of the `fileNote` parsing mapping helper.
- **Copy Icons**: Beside JobDetails values, the `<Copy />` icon renders explicitly if `field.copyable && field.value !== null`.
- **Loss Summary Engine**: Defaults to rendering the expansion layout if the parent job matches structural loss configurations.
- **Job timeline visibility**: Toggled via `isTimelineCollapsed` user toggle, rendering dynamically from historical submits event sourcing array.
