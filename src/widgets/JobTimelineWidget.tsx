import { Clock, ArrowRight, CalendarDays } from 'lucide-react'
import WidgetShell, { type FieldConfig } from './WidgetShell'

interface Task {
  task_id: number
  task_type_name: string
  task_status_desc: string
  date_received: string | null
  date_due: string | null
  task_creation_date: string | null
  assigned_to_name: string | null
}

interface Props {
  tasks: Task[]
  dateRequestReceived: string | null
  estimateValue: number
  widgetId: string
  fieldConfigs: FieldConfig[]
  visibleFields: Set<string>
  onVisibleFieldsChange: (widgetId: string, fields: Set<string>) => void
  feedback: string
  onFeedbackChange: (widgetId: string, text: string) => void
}

function formatDate(iso: string | null): string {
  if (!iso) return '-'
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return '-' }
}
function formatTime(iso: string | null): string {
  if (!iso) return ''
  try { return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) }
  catch { return '' }
}
function formatCurrency(v: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v)
}

export default function JobTimelineWidget({ tasks, dateRequestReceived, estimateValue, ...shellProps }: Props) {
  return (
    <WidgetShell
      title="Job Timeline"
      icon={<Clock size={15} className="text-brand-500" />}
      rightSlot={<div className="flex items-center gap-2 text-xs text-surface-400"><CalendarDays size={12} /> events</div>}
      {...shellProps}
    >
      {(visible) => {
        const events: { date: string; time: string; label: string; detail: string; type: string }[] = []

        if (visible.has('intake_event') && dateRequestReceived) {
          events.push({
            date: formatDate(dateRequestReceived), time: formatTime(dateRequestReceived),
            label: 'Request Received',
            detail: estimateValue > 0 ? `Est. Value: ${formatCurrency(estimateValue)}` : 'Intake created',
            type: 'intake',
          })
        }

        if (visible.has('task_events')) {
          tasks.sort((a, b) => (a.task_creation_date || '').localeCompare(b.task_creation_date || '')).forEach((t) => {
            events.push({
              date: formatDate(t.task_creation_date), time: formatTime(t.task_creation_date),
              label: `${t.task_type_name} Task Created`,
              detail: t.assigned_to_name ? `Assigned: ${t.assigned_to_name}` : 'Unassigned',
              type: t.task_status_desc === 'Completed' ? 'completed' : 'active',
            })
          })
        }

        return (
          <div className="overflow-x-auto px-4 py-4">
            {events.length === 0 ? (
              <div className="flex items-center justify-center w-full py-6 text-surface-400 text-sm">No timeline events visible</div>
            ) : (
              <div className="flex items-start gap-0">
                {events.map((ev, i) => (
                  <div key={i} className="flex items-start flex-shrink-0">
                    <div className="flex flex-col items-center min-w-[140px]">
                      <div className={`w-3 h-3 rounded-full ring-2 ${
                        ev.type === 'completed' ? 'bg-emerald-500 ring-emerald-200' :
                        ev.type === 'intake' ? 'bg-brand-500 ring-brand-200' :
                        'bg-amber-400 ring-amber-200'
                      }`} />
                      <div className="mt-2 text-center">
                        <p className="text-xs font-semibold text-surface-800">{ev.label}</p>
                        <p className="text-[10px] text-surface-400 mt-0.5">{ev.date}</p>
                        {ev.time && <p className="text-[10px] text-surface-300">{ev.time}</p>}
                        <p className="text-[10px] text-surface-500 mt-1 max-w-[120px]">{ev.detail}</p>
                      </div>
                    </div>
                    {i < events.length - 1 && (
                      <div className="flex items-center mt-1.5 mx-1">
                        <div className="w-8 h-px bg-surface-200" />
                        <ArrowRight size={10} className="text-surface-300 -ml-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }}
    </WidgetShell>
  )
}
