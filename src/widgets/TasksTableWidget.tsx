import { ListChecks, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import WidgetShell, { type FieldConfig } from './WidgetShell'

interface Task {
  task_id: number
  task_name: string | null
  task_status: string
  task_status_desc: string
  revision_type: string | null
  is_cancelled: boolean | null
  is_urgent: boolean
  date_due: string | null
  date_received: string | null
  date_info_available: string | null
  task_creation_date: string | null
  task_age_days: number | null
  days_past_due: number | null
  task_type_key: number
  task_type_name: string
  assigned_to_name: string | null
  priority_category: string | null
}

interface Props {
  tasks: Task[]
  widgetId: string
  fieldConfigs: FieldConfig[]
  visibleFields: Set<string>
  onVisibleFieldsChange: (widgetId: string, fields: Set<string>) => void
  feedback: string
  onFeedbackChange: (widgetId: string, text: string) => void
}

function statusBadge(status: string) {
  switch (status) {
    case 'Completed': return 'badge-green'
    case 'Ready':     return 'badge-blue'
    case 'Pending':   return 'badge-amber'
    case 'Canceled':  return 'badge-red'
    default:          return 'badge-slate'
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '-'
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return '-' }
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  } catch { return '-' }
}

export default function TasksTableWidget({ tasks, ...shellProps }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRow = (taskId: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })
  }

  return (
    <WidgetShell
      title="Tasks"
      icon={<ListChecks size={15} className="text-brand-500" />}
      rightSlot={<>
        <span className="text-xs text-surface-400 font-medium">{tasks.length} tasks</span>
        {tasks.some(t => t.is_urgent) && <span className="badge badge-red text-[10px]">HAS URGENT</span>}
      </>}
      {...shellProps}
    >
      {(visible) => (
        <div className="overflow-auto">
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center h-full text-surface-400 text-sm py-12">
              No tasks for this archetype
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  {visible.has('expand_detail') && <th className="w-6"></th>}
                  {visible.has('type') && <th>Type</th>}
                  {visible.has('status') && <th>Status</th>}
                  {visible.has('assigned_to') && <th>Assigned To</th>}
                  {visible.has('received') && <th>Received</th>}
                  {visible.has('due_date') && <th>Due Date</th>}
                  {visible.has('age') && <th>Age</th>}
                  {visible.has('past_due') && <th>Past Due</th>}
                  {visible.has('priority') && <th>Priority</th>}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const isExpanded = expandedRows.has(t.task_id)
                  return (
                    <>
                      <tr key={t.task_id} className={visible.has('expand_detail') ? 'cursor-pointer' : ''} onClick={() => visible.has('expand_detail') && toggleRow(t.task_id)}>
                        {visible.has('expand_detail') && (
                          <td className="!px-1">
                            {isExpanded ? <ChevronDown size={12} className="text-surface-400" /> : <ChevronRight size={12} className="text-surface-300" />}
                          </td>
                        )}
                        {visible.has('type') && (
                          <td className="font-medium">
                            <span className="flex items-center gap-1.5">
                              {t.task_type_name}
                              {t.is_urgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
                            </span>
                            {t.revision_type && <span className="text-[10px] text-surface-400 mt-0.5 block">{t.revision_type}</span>}
                          </td>
                        )}
                        {visible.has('status') && (
                          <td><span className={`badge ${statusBadge(t.task_status_desc)}`}>{t.task_status_desc}</span></td>
                        )}
                        {visible.has('assigned_to') && (
                          <td className="text-surface-600">{t.assigned_to_name || '-'}</td>
                        )}
                        {visible.has('received') && (
                          <td className="font-mono text-[11px]">{formatDate(t.date_received)}</td>
                        )}
                        {visible.has('due_date') && (
                          <td className="font-mono text-[11px]">{formatDate(t.date_due)}</td>
                        )}
                        {visible.has('age') && (
                          <td className="text-center">
                            <span className={`text-xs font-semibold ${(t.task_age_days || 0) > 30 ? 'text-red-600' : (t.task_age_days || 0) > 14 ? 'text-amber-600' : 'text-surface-600'}`}>
                              {t.task_age_days ?? '-'}d
                            </span>
                          </td>
                        )}
                        {visible.has('past_due') && (
                          <td className="text-center">
                            {(t.days_past_due ?? 0) > 0
                              ? <span className="text-xs font-semibold text-red-600">+{t.days_past_due}d</span>
                              : <span className="text-xs text-surface-400">-</span>}
                          </td>
                        )}
                        {visible.has('priority') && (
                          <td>
                            <span className={`badge ${t.priority_category === 'Urgent' ? 'badge-red' : 'badge-slate'}`}>
                              {t.priority_category || 'Standard'}
                            </span>
                          </td>
                        )}
                      </tr>
                      {visible.has('expand_detail') && isExpanded && (
                        <tr key={`${t.task_id}-detail`} className="bg-surface-50/50">
                          <td></td>
                          <td colSpan={8}>
                            <div className="grid grid-cols-3 gap-x-6 gap-y-2 py-2 text-[11px]">
                              <div><span className="text-surface-400 uppercase tracking-wider">Task ID</span><p className="font-mono text-surface-700">{t.task_id}</p></div>
                              <div><span className="text-surface-400 uppercase tracking-wider">Type Key</span><p className="font-mono text-surface-700">{t.task_type_key}</p></div>
                              <div><span className="text-surface-400 uppercase tracking-wider">Info Available</span><p className="font-mono text-surface-700">{formatDateTime(t.date_info_available)}</p></div>
                              <div><span className="text-surface-400 uppercase tracking-wider">Created</span><p className="font-mono text-surface-700">{formatDateTime(t.task_creation_date)}</p></div>
                              <div><span className="text-surface-400 uppercase tracking-wider">Received</span><p className="font-mono text-surface-700">{formatDateTime(t.date_received)}</p></div>
                              <div><span className="text-surface-400 uppercase tracking-wider">Cancelled</span><p className="text-surface-700">{t.is_cancelled === null ? 'N/A' : t.is_cancelled ? 'Yes' : 'No'}</p></div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </WidgetShell>
  )
}
