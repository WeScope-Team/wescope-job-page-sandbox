import { ShieldCheck, BookOpen } from 'lucide-react'
import WidgetShell, { type FieldConfig } from './WidgetShell'

interface GuidelinesData {
  carrier_id: number | null
  carrier_name: string | null
  mrp_id: number | null
  mrp_name: string | null
}

interface Props {
  data: GuidelinesData
  widgetId: string
  fieldConfigs: FieldConfig[]
  visibleFields: Set<string>
  onVisibleFieldsChange: (widgetId: string, fields: Set<string>) => void
  feedback: string
  onFeedbackChange: (widgetId: string, text: string) => void
}

export default function InsuranceGuidelinesWidget({ data, ...shellProps }: Props) {
  const hasCarrier = data.carrier_name && data.carrier_name !== 'N/A'
  const hasMrp = data.mrp_name && data.mrp_name !== 'No programs' && data.mrp_name !== 'N/A'

  return (
    <WidgetShell
      title="Insurance & Guidelines"
      icon={<ShieldCheck size={15} className="text-brand-500" />}
      {...shellProps}
    >
      {(visible) => (
        <div className="p-4 space-y-4">
          {visible.has('carrier') && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-50 border border-surface-100">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 mt-0.5">
                <ShieldCheck size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">Insurance Carrier</p>
                <p className="text-sm font-semibold text-surface-800 mt-0.5">{hasCarrier ? data.carrier_name : 'No carrier assigned'}</p>
                {hasCarrier && <p className="text-xs text-surface-400 mt-1">Carrier ID: {data.carrier_id}</p>}
              </div>
            </div>
          )}
          {visible.has('mrp') && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-surface-50 border border-surface-100">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-50 text-purple-600 mt-0.5">
                <BookOpen size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">Managed Repair Program</p>
                <p className="text-sm font-semibold text-surface-800 mt-0.5">{hasMrp ? data.mrp_name : 'No program'}</p>
                {hasMrp && <p className="text-xs text-surface-400 mt-1">Program ID: {data.mrp_id}</p>}
              </div>
            </div>
          )}
          {visible.has('guidelines') && hasCarrier && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 text-xs">
              <p className="font-semibold">Guidelines Available</p>
              <p className="mt-1 text-amber-600">Carrier-specific scoping and delivery guidelines would load here from the Guidelines API for {data.carrier_name}.</p>
            </div>
          )}
          {[...visible].length === 0 && (
            <p className="text-xs text-surface-400 text-center py-6">All sections hidden. Click the gear icon to configure.</p>
          )}
        </div>
      )}
    </WidgetShell>
  )
}
