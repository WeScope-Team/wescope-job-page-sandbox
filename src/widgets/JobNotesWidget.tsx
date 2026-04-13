import { StickyNote, Clock, Search } from 'lucide-react'
import { useState } from 'react'
import WidgetShell, { type FieldConfig } from './WidgetShell'

interface Props {
  notes: string
  jobNumber: string
  widgetId: string
  fieldConfigs: FieldConfig[]
  visibleFields: Set<string>
  onVisibleFieldsChange: (widgetId: string, fields: Set<string>) => void
  feedback: string
  onFeedbackChange: (widgetId: string, text: string) => void
}

export default function JobNotesWidget({ notes, jobNumber, ...shellProps }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const noteLines = notes.split('\n').filter(l => l.trim().length > 0)
  const filtered = searchTerm.trim()
    ? noteLines.filter(l => l.toLowerCase().includes(searchTerm.toLowerCase()))
    : noteLines

  return (
    <WidgetShell
      title="Job Notes"
      icon={<StickyNote size={15} className="text-brand-500" />}
      rightSlot={<span className="text-xs text-surface-400 font-medium">{noteLines.length} lines</span>}
      {...shellProps}
    >
      {(visible) => (
        <div>
          {visible.has('search') && (
            <div className="px-3 py-2 border-b border-surface-100">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-300" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search notes..."
                  className="w-full text-xs pl-7 pr-3 py-1.5 rounded-md border border-surface-100 bg-surface-50 text-surface-700 placeholder:text-surface-300 focus:ring-1 focus:ring-brand-400 focus:border-brand-400"
                />
              </div>
            </div>
          )}
          {visible.has('content') && (
            <div className="p-3 space-y-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-surface-400 py-4 text-center">No notes match your search</p>
              ) : (
                filtered.map((line, i) => {
                  const isHeader = /^\*\*|^#{1,3}|^-{3,}|^={3,}/.test(line.trim())
                  const isTimestamp = /^\d{1,2}:\d{2}|received on:|Email received/.test(line.trim())
                  const isSeparator = /^-{3,}$|^={3,}$|^_{3,}$/.test(line.trim())
                  if (isSeparator) return <hr key={i} className="border-surface-100 my-1.5" />
                  return (
                    <div key={i} className={`text-xs leading-relaxed rounded px-2 py-0.5 ${
                      isHeader ? 'font-semibold text-surface-800 bg-surface-50' :
                      isTimestamp ? 'text-brand-600 font-medium flex items-center gap-1.5' :
                      'text-surface-600'
                    }`}>
                      {isTimestamp && <Clock size={10} className="text-brand-400 flex-shrink-0" />}
                      <span dangerouslySetInnerHTML={{ __html: line
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/>(.*)/g, '<span class="text-surface-400 italic">$1</span>')
                      }} />
                    </div>
                  )
                })
              )}
            </div>
          )}
          {!visible.has('content') && !visible.has('search') && (
            <p className="text-xs text-surface-400 text-center py-6 px-4">All sections hidden.</p>
          )}
        </div>
      )}
    </WidgetShell>
  )
}
