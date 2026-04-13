import { useState, useCallback, useRef, useMemo } from 'react'
import { Responsive, WidthProvider, type Layouts, type Layout } from 'react-grid-layout'
import { Download, LayoutGrid, ChevronDown, RotateCcw } from 'lucide-react'
import archetypes from './data/archetypes.json'
import type { FieldConfig } from './widgets/WidgetShell'

import JobDetailsWidget from './widgets/JobDetailsWidget'
import TasksTableWidget from './widgets/TasksTableWidget'
import LossSummaryWidget from './widgets/LossSummaryWidget'
import InsuranceGuidelinesWidget from './widgets/InsuranceGuidelinesWidget'
import LinksWidget from './widgets/LinksWidget'
import FilesWidget from './widgets/FilesWidget'
import JobNotesWidget from './widgets/JobNotesWidget'
import JobTimelineWidget from './widgets/JobTimelineWidget'
import ActionPaneWidget from './widgets/ActionPaneWidget'

const ResponsiveGrid = WidthProvider(Responsive)

// ─── Grid constants (24-col for fine-grained resizing) ───────────
const BREAKPOINTS = { lg: 1200, md: 768, sm: 480 }
const COLS        = { lg: 24,   md: 16,  sm: 4 }
const ROW_HEIGHT  = 28

// ─── Widget registry ─────────────────────────────────────────────
const WIDGET_IDS = [
  'job-details', 'insurance-guidelines', 'loss-summary',
  'links', 'files', 'tasks-details', 'job-notes', 'job-timeline', 'action-pane',
] as const

const WIDGET_LABELS: Record<string, string> = {
  'job-details':          'Job Details',
  'insurance-guidelines': 'Insurance & Guidelines',
  'loss-summary':         'Loss Summary',
  'links':                'Links & Integrations',
  'files':                'Files',
  'tasks-details':        'Tasks Table',
  'job-notes':            'Job Notes',
  'job-timeline':         'Timeline',
  'action-pane':          'Action Pane / Sidebar',
}

// ─── Per-widget field configs (what can be toggled) ──────────────
const WIDGET_FIELD_CONFIGS: Record<string, FieldConfig[]> = {
  'job-details': [
    { id: 'insured_name',       label: 'Insured Name' },
    { id: 'client_proj',        label: 'Client Project #' },
    { id: 'client_poc',         label: 'Client POC' },
    { id: 'job_type',           label: 'Job Type' },
    { id: 'order_type',         label: 'Order Type' },
    { id: 'insurance_carrier',  label: 'Insurance Carrier' },
    { id: 'claim_number',       label: 'Claim #' },
    { id: 'mrp',                label: 'Managed Repair Program' },
    { id: 'est_software',       label: 'Estimation Software' },
    { id: 'client_name',        label: 'Client Name' },
    { id: 'location',           label: 'Location' },
    { id: 'date_received',      label: 'Date Received' },
    { id: 'est_value',          label: 'Estimate Value' },
    { id: 'size_category',      label: 'Size Category' },
    { id: 'rooms',              label: 'Rooms / Bath / Kitchen' },
    { id: 'job_id',             label: 'Job ID' },
    { id: 'flags',              label: 'Flags (Urgent/Large Loss)' },
  ],
  'tasks-details': [
    { id: 'type',          label: 'Type' },
    { id: 'status',        label: 'Status' },
    { id: 'assigned_to',   label: 'Assigned To' },
    { id: 'received',      label: 'Date Received' },
    { id: 'due_date',      label: 'Due Date' },
    { id: 'age',           label: 'Age (days)' },
    { id: 'past_due',      label: 'Past Due' },
    { id: 'priority',      label: 'Priority' },
    { id: 'expand_detail', label: 'Expandable Details' },
  ],
  'insurance-guidelines': [
    { id: 'carrier',    label: 'Insurance Carrier Card' },
    { id: 'mrp',        label: 'Managed Repair Program Card' },
    { id: 'guidelines', label: 'Guidelines Available Banner' },
  ],
  'loss-summary': [
    { id: 'rooms', label: 'Room Breakdown Cards' },
    { id: 'items', label: 'Item Tags' },
  ],
  'links': [
    { id: 'status_badges',   label: 'Quick Status Badges' },
    { id: 'system_list',     label: 'System List' },
  ],
  'files': [
    { id: 'breadcrumb',   label: 'Breadcrumb Path' },
    { id: 'folder_tree',  label: 'Folder Tree' },
    { id: 'actions',      label: 'Upload/Download Actions' },
  ],
  'job-notes': [
    { id: 'search',   label: 'Search Bar' },
    { id: 'content',  label: 'Notes Content' },
  ],
  'job-timeline': [
    { id: 'intake_event', label: 'Intake Event' },
    { id: 'task_events',  label: 'Task Events' },
  ],
  'action-pane': [
    { id: 'quick_actions',  label: 'Quick Action Buttons' },
    { id: 'integrations',   label: 'Integration Status' },
    { id: 'dialog_router',  label: 'Dialog Router Map' },
    { id: 'rbac',           label: 'RBAC Gates Reference' },
  ],
}

// ─── Default layouts ─────────────────────────────────────────────
const DEFAULT_LAYOUTS: Layouts = {
  lg: [
    { i: 'job-details',           x: 0,  y: 0,  w: 16, h: 6,  minW: 4, minH: 2 },
    { i: 'action-pane',           x: 16, y: 0,  w: 8,  h: 14, minW: 4, minH: 2 },
    { i: 'insurance-guidelines',  x: 0,  y: 6,  w: 16, h: 5,  minW: 4, minH: 2 },
    { i: 'loss-summary',          x: 0,  y: 11, w: 16, h: 6,  minW: 4, minH: 2 },
    { i: 'links',                 x: 0,  y: 17, w: 8,  h: 8,  minW: 3, minH: 2 },
    { i: 'files',                 x: 8,  y: 17, w: 8,  h: 8,  minW: 3, minH: 2 },
    { i: 'job-notes',             x: 16, y: 14, w: 8,  h: 11, minW: 4, minH: 2 },
    { i: 'job-timeline',          x: 0,  y: 25, w: 24, h: 5,  minW: 4, minH: 2 },
    { i: 'tasks-details',         x: 0,  y: 30, w: 24, h: 12, minW: 6, minH: 3 },
  ],
  md: [
    { i: 'job-details',           x: 0,  y: 0,  w: 16, h: 7,  minW: 4, minH: 2 },
    { i: 'insurance-guidelines',  x: 0,  y: 7,  w: 16, h: 5,  minW: 4, minH: 2 },
    { i: 'loss-summary',          x: 0,  y: 12, w: 16, h: 6,  minW: 4, minH: 2 },
    { i: 'links',                 x: 0,  y: 18, w: 8,  h: 7,  minW: 3, minH: 2 },
    { i: 'files',                 x: 8,  y: 18, w: 8,  h: 7,  minW: 3, minH: 2 },
    { i: 'action-pane',           x: 0,  y: 25, w: 16, h: 8,  minW: 4, minH: 2 },
    { i: 'job-notes',             x: 0,  y: 33, w: 16, h: 8,  minW: 4, minH: 2 },
    { i: 'job-timeline',          x: 0,  y: 41, w: 16, h: 5,  minW: 4, minH: 2 },
    { i: 'tasks-details',         x: 0,  y: 46, w: 16, h: 12, minW: 6, minH: 3 },
  ],
  sm: [
    { i: 'job-details',           x: 0, y: 0,  w: 4, h: 9,  minW: 4, minH: 2, static: true },
    { i: 'insurance-guidelines',  x: 0, y: 9,  w: 4, h: 5,  minW: 4, minH: 2, static: true },
    { i: 'loss-summary',          x: 0, y: 14, w: 4, h: 6,  minW: 4, minH: 2, static: true },
    { i: 'links',                 x: 0, y: 20, w: 4, h: 7,  minW: 4, minH: 2, static: true },
    { i: 'files',                 x: 0, y: 27, w: 4, h: 7,  minW: 4, minH: 2, static: true },
    { i: 'action-pane',           x: 0, y: 34, w: 4, h: 8,  minW: 4, minH: 2, static: true },
    { i: 'job-notes',             x: 0, y: 42, w: 4, h: 8,  minW: 4, minH: 2, static: true },
    { i: 'job-timeline',          x: 0, y: 50, w: 4, h: 5,  minW: 4, minH: 2, static: true },
    { i: 'tasks-details',         x: 0, y: 55, w: 4, h: 14, minW: 4, minH: 3, static: true },
  ],
}

// ─── Initialize default visible fields (all on) ─────────────────
function initVisibleFields(): Record<string, Set<string>> {
  const result: Record<string, Set<string>> = {}
  for (const [widgetId, fields] of Object.entries(WIDGET_FIELD_CONFIGS)) {
    result[widgetId] = new Set(fields.map(f => f.id))
  }
  return result
}

// ─── Types ───────────────────────────────────────────────────────
type WidgetFeedback = Record<string, string>

function App() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [layouts, setLayouts] = useState<Layouts>(DEFAULT_LAYOUTS)
  const layoutsRef = useRef<Layouts>(layouts)
  const [feedback, setFeedback] = useState<WidgetFeedback>({})
  const [visibleFields, setVisibleFields] = useState<Record<string, Set<string>>>(initVisibleFields)

  const archetype = (archetypes as any[])[selectedIndex]

  // ─── Layout change handler ────────────────────────────────────
  const handleLayoutChange = useCallback((_current: Layout[], allLayouts: Layouts) => {
    layoutsRef.current = allLayouts
    setLayouts(allLayouts)
  }, [])

  // ─── Feedback handler ─────────────────────────────────────────
  const handleFeedbackChange = useCallback((widgetId: string, text: string) => {
    setFeedback(prev => ({ ...prev, [widgetId]: text }))
  }, [])

  // ─── Field visibility handler ─────────────────────────────────
  const handleVisibleFieldsChange = useCallback((widgetId: string, fields: Set<string>) => {
    setVisibleFields(prev => ({ ...prev, [widgetId]: fields }))
  }, [])

  // ─── Reset all ────────────────────────────────────────────────
  const handleResetLayout = useCallback(() => {
    setLayouts({ ...DEFAULT_LAYOUTS })
    layoutsRef.current = { ...DEFAULT_LAYOUTS }
    setVisibleFields(initVisibleFields())
    setFeedback({})
  }, [])

  // ─── Export layout + feedback + field visibility ──────────────
  const handleExportLayout = useCallback(() => {
    const fieldVisibilityExport: Record<string, { visible: string[]; hidden: string[] }> = {}
    for (const [wid, configs] of Object.entries(WIDGET_FIELD_CONFIGS)) {
      const vis = visibleFields[wid] || new Set()
      fieldVisibilityExport[wid] = {
        visible: configs.filter(f => vis.has(f.id)).map(f => f.id),
        hidden: configs.filter(f => !vis.has(f.id)).map(f => f.id),
      }
    }

    const exportPayload = {
      exported_at: new Date().toISOString(),
      archetype_id: archetype.archetype_id,
      archetype_label: archetype.archetype_label,
      grid_config: { breakpoints: BREAKPOINTS, cols: COLS, rowHeight: ROW_HEIGHT },
      layouts: layoutsRef.current,
      field_visibility: fieldVisibilityExport,
      widget_feedback: Object.entries(feedback)
        .filter(([, v]) => v.trim().length > 0)
        .map(([widgetId, comment]) => ({
          widget_id: widgetId,
          widget_label: WIDGET_LABELS[widgetId] || widgetId,
          comment,
        })),
    }
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `canvas_export_${archetype.archetype_id}_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [archetype, feedback, visibleFields])

  const feedbackCount = Object.values(feedback).filter(v => v.trim().length > 0).length
  const hiddenFieldCount = useMemo(() => {
    let count = 0
    for (const [wid, configs] of Object.entries(WIDGET_FIELD_CONFIGS)) {
      const vis = visibleFields[wid]
      if (vis) count += configs.length - vis.size
    }
    return count
  }, [visibleFields])

  // ─── Shared props builder ─────────────────────────────────────
  const shellProps = (widgetId: string) => ({
    widgetId,
    fieldConfigs: WIDGET_FIELD_CONFIGS[widgetId] || [],
    visibleFields: visibleFields[widgetId] || new Set<string>(),
    onVisibleFieldsChange: handleVisibleFieldsChange,
    feedback: feedback[widgetId] || '',
    onFeedbackChange: handleFeedbackChange,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-brand-50/20">
      {/* ─── Fixed Header Bar ───────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-600 text-white">
              <LayoutGrid size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-surface-900 leading-tight">Job Page Canvas</h1>
              <p className="text-xs text-surface-400">
                Layout Sandbox v3
                {feedbackCount > 0 && <span className="text-amber-500 ml-2">{feedbackCount} comments</span>}
                {hiddenFieldCount > 0 && <span className="text-brand-500 ml-2">{hiddenFieldCount} fields hidden</span>}
              </p>
            </div>
          </div>

          {/* Center -- Archetype Selector */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-surface-500 uppercase tracking-wider">Archetype</label>
            <div className="relative">
              <select
                id="archetype-select"
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(Number(e.target.value))}
                className="appearance-none bg-surface-50 border border-surface-200 text-surface-800 text-sm font-medium rounded-lg pl-4 pr-10 py-2 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all min-w-[360px] cursor-pointer hover:border-surface-300"
              >
                {(archetypes as any[]).map((a: any, i: number) => (
                  <option key={a.archetype_id} value={i}>
                    {a.is_program ? '[PGM]' : '[ NP ]'} {a.order_type} - {a.job_type} | {a.job_details.job_number}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none" />
            </div>
          </div>

          {/* Right -- Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetLayout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-surface-200 text-surface-600 text-sm font-medium hover:bg-surface-50 transition-all"
              title="Reset layout, fields, and feedback"
            >
              <RotateCcw size={14} />
              Reset All
            </button>
            <button
              id="export-layout-btn"
              onClick={handleExportLayout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 active:bg-brand-800 transition-all shadow-sm hover:shadow-md"
            >
              <Download size={16} />
              Export Layout
            </button>
          </div>
        </div>
      </header>

      {/* ─── Job Header ─────────────────────────────────────────── */}
      <div className="max-w-[1800px] mx-auto px-6 pt-5 pb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-surface-900">{archetype.job_details.job_number}</h2>
          {archetype.job_details.is_urgent && <span className="badge badge-red">URGENT</span>}
          {archetype.job_details.is_large_loss && <span className="badge badge-purple">LARGE LOSS</span>}
          <span className="badge badge-green">{archetype.job_details.job_status}</span>
          <span className="badge badge-blue">{archetype.order_type}</span>
        </div>
        <p className="text-sm text-surface-500 mt-1">
          {archetype.job_details.client_name}
          {archetype.job_details.client_location && <span className="text-surface-300 mx-2">|</span>}
          {archetype.job_details.client_location}
          <span className="text-surface-300 mx-2">|</span>
          <span className="font-mono text-xs">{archetype.archetype_id}</span>
        </p>
      </div>

      {/* ─── Grid Canvas ────────────────────────────────────────── */}
      <div className="max-w-[1800px] mx-auto px-6 pb-12">
        <ResponsiveGrid
          layouts={layouts}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={ROW_HEIGHT}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".widget-drag-handle"
          useCSSTransforms
          compactType="vertical"
          margin={[12, 12]}
        >
          <div key="job-details">
            <JobDetailsWidget data={archetype.job_details} {...shellProps('job-details')} />
          </div>
          <div key="action-pane">
            <ActionPaneWidget
              tasks={archetype.tasks}
              hasMatterport={archetype.has_matterport}
              hasCompanyCam={archetype.has_companycam}
              hasCrm={archetype.has_crm}
              jobType={archetype.job_type}
              orderType={archetype.order_type}
              {...shellProps('action-pane')}
            />
          </div>
          <div key="insurance-guidelines">
            <InsuranceGuidelinesWidget data={archetype.guidelines} {...shellProps('insurance-guidelines')} />
          </div>
          <div key="loss-summary">
            <LossSummaryWidget data={archetype.loss_summary} jobType={archetype.job_type} {...shellProps('loss-summary')} />
          </div>
          <div key="links">
            <LinksWidget
              linkedSystems={archetype.linked_systems}
              hasMatterport={archetype.has_matterport}
              hasCompanyCam={archetype.has_companycam}
              hasCrm={archetype.has_crm}
              {...shellProps('links')}
            />
          </div>
          <div key="files">
            <FilesWidget jobNumber={archetype.job_details.job_number} {...shellProps('files')} />
          </div>
          <div key="job-notes">
            <JobNotesWidget notes={archetype.notes} jobNumber={archetype.job_details.job_number} {...shellProps('job-notes')} />
          </div>
          <div key="job-timeline">
            <JobTimelineWidget
              tasks={archetype.tasks}
              dateRequestReceived={archetype.job_details.date_request_received}
              estimateValue={archetype.job_details.current_estimate_value}
              {...shellProps('job-timeline')}
            />
          </div>
          <div key="tasks-details">
            <TasksTableWidget tasks={archetype.tasks} {...shellProps('tasks-details')} />
          </div>
        </ResponsiveGrid>
      </div>
    </div>
  )
}

export default App
