import { Link2, Camera, Box, MonitorSmartphone, ExternalLink } from 'lucide-react'
import WidgetShell, { type FieldConfig } from './WidgetShell'

interface LinkedSystem { system_id: number; system_name: string }

interface Props {
  linkedSystems: LinkedSystem[]
  hasMatterport: boolean
  hasCompanyCam: boolean
  hasCrm: boolean
  widgetId: string
  fieldConfigs: FieldConfig[]
  visibleFields: Set<string>
  onVisibleFieldsChange: (widgetId: string, fields: Set<string>) => void
  feedback: string
  onFeedbackChange: (widgetId: string, text: string) => void
}

function systemIcon(id: number) {
  if (id === 6) return <Camera size={14} />
  if (id === 10) return <Camera size={14} />
  if ([7, 8, 18, 22, 24, 50].includes(id)) return <MonitorSmartphone size={14} />
  return <Box size={14} />
}

function systemColor(id: number): string {
  if (id === 6) return 'bg-teal-50 text-teal-600 ring-teal-200'
  if (id === 10) return 'bg-green-50 text-green-600 ring-green-200'
  if ([7, 8, 18, 22, 24, 50].includes(id)) return 'bg-blue-50 text-blue-600 ring-blue-200'
  return 'bg-surface-50 text-surface-600 ring-surface-200'
}

export default function LinksWidget({ linkedSystems, hasMatterport, hasCompanyCam, hasCrm, ...shellProps }: Props) {
  return (
    <WidgetShell
      title="Links & Integrations"
      icon={<Link2 size={15} className="text-brand-500" />}
      rightSlot={<span className="text-xs text-surface-400 font-medium">{linkedSystems.length} systems</span>}
      {...shellProps}
    >
      {(visible) => (
        <div className="p-4">
          {visible.has('status_badges') && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`badge ${hasMatterport ? 'badge-green' : 'badge-slate'}`}>Matterport {hasMatterport ? 'ON' : 'OFF'}</span>
              <span className={`badge ${hasCompanyCam ? 'badge-green' : 'badge-slate'}`}>CompanyCam {hasCompanyCam ? 'ON' : 'OFF'}</span>
              <span className={`badge ${hasCrm ? 'badge-blue' : 'badge-slate'}`}>CRM {hasCrm ? 'ON' : 'OFF'}</span>
            </div>
          )}
          {visible.has('system_list') && (
            linkedSystems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-surface-400">
                <Link2 size={28} className="mb-2 text-surface-300" />
                <p className="text-sm font-medium">No linked systems</p>
              </div>
            ) : (
              <div className="space-y-2">
                {linkedSystems.map((sys) => (
                  <div key={sys.system_id} className="flex items-center gap-3 p-2.5 rounded-lg border border-surface-100 hover:border-surface-200 hover:bg-surface-50/50 transition-all group">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-md ring-1 ${systemColor(sys.system_id)}`}>{systemIcon(sys.system_id)}</div>
                    <span className="text-sm font-medium text-surface-700 flex-1">{sys.system_name}</span>
                    <ExternalLink size={14} className="text-surface-300 group-hover:text-brand-500 transition-colors" />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </WidgetShell>
  )
}
