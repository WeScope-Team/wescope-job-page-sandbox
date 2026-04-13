import { Clipboard, Check, CalendarDays, DollarSign, Home } from 'lucide-react'
import { useState, useCallback } from 'react'
import WidgetShell, { type FieldConfig } from './WidgetShell'

interface JobDetailsData {
  job_id: number
  job_number: string
  job_status: string
  insured_name: string
  client_project_number: string
  client_poc: string | null
  insurance_carrier: string | null
  insurance_claim_number: string | null
  managed_repair_program: string | null
  estimation_software: string
  order_type: string
  job_type: string
  is_large_loss: boolean
  is_urgent: boolean
  current_estimate_value: number
  estimated_rooms: number
  estimated_bathrooms: number
  estimated_kitchens: number
  estimate_size_category: string | null
  date_request_received: string | null
  client_name: string | null
  client_location: string | null
}

interface Props {
  data: JobDetailsData
  widgetId: string
  fieldConfigs: FieldConfig[]
  visibleFields: Set<string>
  onVisibleFieldsChange: (widgetId: string, fields: Set<string>) => void
  feedback: string
  onFeedbackChange: (widgetId: string, text: string) => void
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [text])
  return (
    <button onClick={handleCopy} className="ml-1.5 p-0.5 rounded text-surface-300 hover:text-brand-500 transition-colors" title="Copy">
      {copied ? <Check size={12} className="text-emerald-500" /> : <Clipboard size={12} />}
    </button>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function formatDate(iso: string | null): string {
  if (!iso) return 'N/A'
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  } catch { return 'N/A' }
}

export default function JobDetailsWidget({ data, ...shellProps }: Props) {
  const allFields: { id: string; label: string; value: string; copy?: boolean; icon?: any }[] = [
    { id: 'insured_name',      label: 'Insured Name',        value: data.insured_name, copy: true },
    { id: 'client_proj',       label: 'Client Proj #',       value: data.client_project_number, copy: true },
    { id: 'client_poc',        label: 'Client POC',          value: data.client_poc || 'N/A' },
    { id: 'job_type',          label: 'Job Type',            value: data.job_type },
    { id: 'order_type',        label: 'Order Type',          value: data.order_type },
    { id: 'insurance_carrier', label: 'Insurance Carrier',   value: data.insurance_carrier || 'N/A' },
    { id: 'claim_number',      label: 'Claim #',             value: data.insurance_claim_number || 'N/A', copy: true },
    { id: 'mrp',               label: 'MRP',                 value: data.managed_repair_program || 'None' },
    { id: 'est_software',      label: 'Est. Software',       value: data.estimation_software },
    { id: 'client_name',       label: 'Client',              value: data.client_name || 'N/A' },
    { id: 'location',          label: 'Location',            value: data.client_location || 'N/A' },
    { id: 'date_received',     label: 'Date Received',       value: formatDate(data.date_request_received), icon: CalendarDays },
    { id: 'est_value',         label: 'Est. Value',          value: formatCurrency(data.current_estimate_value), icon: DollarSign },
    { id: 'size_category',     label: 'Size Category',       value: data.estimate_size_category || 'N/A' },
    { id: 'rooms',             label: 'Rooms / Bath / Kit',  value: `${data.estimated_rooms} / ${data.estimated_bathrooms} / ${data.estimated_kitchens}`, icon: Home },
    { id: 'job_id',            label: 'Job ID',              value: String(data.job_id), copy: true },
  ]

  return (
    <WidgetShell
      title="Job Details"
      badge={<><span className="badge badge-slate">{data.job_type}</span><span className="badge badge-blue ml-1">{data.order_type}</span></>}
      {...shellProps}
    >
      {(visible) => {
        const shownFields = allFields.filter(f => visible.has(f.id))
        return (
          <div className="p-4">
            {shownFields.length === 0 ? (
              <p className="text-xs text-surface-400 text-center py-6">All fields hidden. Click the gear icon to show fields.</p>
            ) : (
              <div className="info-grid">
                {shownFields.map(f => (
                  <div key={f.id}>
                    <div className="info-label flex items-center gap-1">
                      {f.icon && <f.icon size={10} />}
                      {f.label}
                    </div>
                    <div className="info-value flex items-center">
                      {f.value}
                      {f.copy && f.value && f.value !== 'N/A' && <CopyButton text={f.value} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Flags */}
            {visible.has('flags') && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-surface-100">
                <span className={`badge text-[10px] ${data.is_large_loss ? 'badge-purple' : 'badge-slate'}`}>
                  Large Loss: {data.is_large_loss ? 'YES' : 'NO'}
                </span>
                <span className={`badge text-[10px] ${data.is_urgent ? 'badge-red' : 'badge-slate'}`}>
                  Urgent: {data.is_urgent ? 'YES' : 'NO'}
                </span>
              </div>
            )}
          </div>
        )
      }}
    </WidgetShell>
  )
}
