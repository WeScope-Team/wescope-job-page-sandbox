import { Play, Pause, CheckCircle2, XCircle, MoreHorizontal, Zap, AlertTriangle, Camera, MonitorSmartphone, Shield } from 'lucide-react'
import WidgetShell, { type FieldConfig } from './WidgetShell'

interface Task {
  task_id: number
  task_type_name: string
  task_status_desc: string
  task_type_key: number
  assigned_to_name: string | null
  is_urgent: boolean
  revision_type: string | null
}

interface Props {
  tasks: Task[]
  hasMatterport: boolean
  hasCompanyCam: boolean
  hasCrm: boolean
  jobType: string
  orderType: string
  widgetId: string
  fieldConfigs: FieldConfig[]
  visibleFields: Set<string>
  onVisibleFieldsChange: (widgetId: string, fields: Set<string>) => void
  feedback: string
  onFeedbackChange: (widgetId: string, text: string) => void
}

const DIALOG_MAP: Record<number, string> = {
  1: 'SketchTaskDialog', 2: 'LargeLossCallDialog', 3: 'LargeLossApprovalDialog',
  4: 'ScopeTaskDialog', 5: 'QATaskDialog', 6: 'ChangeOrderScopeDialog',
  7: 'ChangeOrderQATaskDialog', 8: 'RevisionTaskDialog', 9: 'SupplementalTaskDialog',
  16: 'UploadOnlyTaskDialog', 17: 'AriseQualityReviewDialog', 18: 'SketchRevisionTaskDialog',
}

function statusIcon(status: string) {
  switch (status) {
    case 'Completed': return <CheckCircle2 size={14} className="text-emerald-500" />
    case 'Ready':     return <Play size={14} className="text-blue-500" />
    case 'Pending':   return <Pause size={14} className="text-amber-500" />
    case 'Canceled':  return <XCircle size={14} className="text-red-400" />
    default:          return <MoreHorizontal size={14} className="text-surface-400" />
  }
}

export default function ActionPaneWidget({ tasks, hasMatterport, hasCompanyCam, hasCrm, ...shellProps }: Props) {
  return (
    <WidgetShell
      title="Actions & Sidebar"
      icon={<Zap size={15} className="text-amber-500" />}
      {...shellProps}
    >
      {(visible) => (
        <div className="p-4 space-y-4">
          {visible.has('quick_actions') && (
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Quick Actions</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-100 bg-surface-50/80 text-xs font-medium text-surface-700 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-all"><Play size={12} /> Start Task</button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-100 bg-surface-50/80 text-xs font-medium text-surface-700 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-all"><CheckCircle2 size={12} /> Complete</button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-100 bg-surface-50/80 text-xs font-medium text-surface-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all"><XCircle size={12} /> Disqualify</button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-100 bg-surface-50/80 text-xs font-medium text-surface-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 transition-all"><AlertTriangle size={12} /> Pending Info</button>
              </div>
            </div>
          )}
          {visible.has('integrations') && (
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Integrations</p>
              <div className="space-y-1.5">
                <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${hasMatterport ? 'border-teal-200 bg-teal-50/50 text-teal-700' : 'border-surface-100 bg-surface-50/50 text-surface-400'}`}>
                  <Camera size={13} /> Matterport <span className={`ml-auto badge text-[10px] ${hasMatterport ? 'badge-green' : 'badge-slate'}`}>{hasMatterport ? 'Connected' : 'N/A'}</span>
                </div>
                <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${hasCompanyCam ? 'border-green-200 bg-green-50/50 text-green-700' : 'border-surface-100 bg-surface-50/50 text-surface-400'}`}>
                  <Camera size={13} /> CompanyCam <span className={`ml-auto badge text-[10px] ${hasCompanyCam ? 'badge-green' : 'badge-slate'}`}>{hasCompanyCam ? 'Connected' : 'N/A'}</span>
                </div>
                <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${hasCrm ? 'border-blue-200 bg-blue-50/50 text-blue-700' : 'border-surface-100 bg-surface-50/50 text-surface-400'}`}>
                  <MonitorSmartphone size={13} /> CRM Delivery <span className={`ml-auto badge text-[10px] ${hasCrm ? 'badge-blue' : 'badge-slate'}`}>{hasCrm ? 'Active' : 'N/A'}</span>
                </div>
              </div>
            </div>
          )}
          {visible.has('dialog_router') && (
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">Dialog Router</p>
              <div className="space-y-1">
                {tasks.map((t) => (
                  <div key={t.task_id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-surface-50/70 border border-surface-50">
                    {statusIcon(t.task_status_desc)}
                    <span className="text-xs font-medium text-surface-700 flex-1 truncate">{t.task_type_name}</span>
                    <span className="text-[10px] text-surface-400 font-mono truncate max-w-[120px]">{DIALOG_MAP[t.task_type_key] || 'Unknown'}</span>
                  </div>
                ))}
                {tasks.length === 0 && <p className="text-xs text-surface-400 text-center py-3">No tasks</p>}
              </div>
            </div>
          )}
          {visible.has('rbac') && (
            <div>
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">RBAC Gates</p>
              <div className="text-[10px] text-surface-500 space-y-1 bg-surface-50 rounded-lg p-2.5 border border-surface-100">
                {['VIEW_EDIT_ESTIMATE_VALUES', 'SET_TO_PENDING_INFO', 'VIEW_DISQUALIFY', 'DELETE_FILES', 'SET_TO_LARGE_LOSS'].map(p => (
                  <div key={p} className="flex items-center gap-1.5"><Shield size={10} className="text-surface-400" />{p}</div>
                ))}
              </div>
            </div>
          )}
          {[...visible].length === 0 && (
            <p className="text-xs text-surface-400 text-center py-6">All sections hidden.</p>
          )}
        </div>
      )}
    </WidgetShell>
  )
}
