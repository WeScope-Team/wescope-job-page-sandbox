import { Home, ChevronRight, Package } from 'lucide-react'
import WidgetShell, { type FieldConfig } from './WidgetShell'

interface Room { name: string; items: string[] }
interface LossSummaryData { has_data: boolean; rooms: Room[] }

interface Props {
  data: LossSummaryData
  jobType: string
  widgetId: string
  fieldConfigs: FieldConfig[]
  visibleFields: Set<string>
  onVisibleFieldsChange: (widgetId: string, fields: Set<string>) => void
  feedback: string
  onFeedbackChange: (widgetId: string, text: string) => void
}

export default function LossSummaryWidget({ data, jobType, ...shellProps }: Props) {
  return (
    <WidgetShell
      title="Loss Summary"
      icon={<Home size={15} className="text-brand-500" />}
      badge={<span className="badge badge-slate">{jobType}</span>}
      {...shellProps}
    >
      {(visible) => (
        <div className="p-4">
          {!data.has_data ? (
            <div className="flex flex-col items-center justify-center h-full text-surface-400 py-8">
              <Package size={32} className="mb-3 text-surface-300" />
              <p className="text-sm font-medium">No loss summary for this job type</p>
              <p className="text-xs mt-1">Loss summaries are generated for WTR, MLD, STC, and CON jobs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visible.has('rooms') && data.rooms.map((room) => (
                <div key={room.name} className="rounded-lg border border-surface-100 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-surface-50">
                    <Home size={14} className="text-brand-500" />
                    <span className="text-sm font-semibold text-surface-800">{room.name}</span>
                    <span className="text-xs text-surface-400 ml-auto">{room.items.length} items</span>
                  </div>
                  {visible.has('items') && (
                    <div className="px-3 py-2 flex flex-wrap gap-1.5">
                      {room.items.map((item) => (
                        <span key={item} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                          <ChevronRight size={10} />{item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {!visible.has('rooms') && <p className="text-xs text-surface-400 text-center py-6">Room breakdown hidden.</p>}
            </div>
          )}
        </div>
      )}
    </WidgetShell>
  )
}
