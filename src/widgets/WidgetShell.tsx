import { useState, useRef, useEffect, type ReactNode } from 'react'
import { MessageSquare, Settings, X, Check } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────
export interface FieldConfig {
  id: string
  label: string
  defaultVisible?: boolean  // defaults to true
}

interface WidgetShellProps {
  widgetId: string
  title: string
  icon?: ReactNode
  badge?: ReactNode
  rightSlot?: ReactNode
  fieldConfigs?: FieldConfig[]
  visibleFields: Set<string>
  onVisibleFieldsChange: (widgetId: string, fields: Set<string>) => void
  feedback: string
  onFeedbackChange: (widgetId: string, text: string) => void
  children: (visibleFields: Set<string>) => ReactNode
}

export default function WidgetShell({
  widgetId,
  title,
  icon,
  badge,
  rightSlot,
  fieldConfigs = [],
  visibleFields,
  onVisibleFieldsChange,
  feedback,
  onFeedbackChange,
  children,
}: WidgetShellProps) {
  const [showComment, setShowComment] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const settingsRef = useRef<HTMLDivElement>(null)
  const commentRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when comment opens
  useEffect(() => {
    if (showComment && commentRef.current) {
      commentRef.current.focus()
    }
  }, [showComment])

  // Close settings dropdown on outside click
  useEffect(() => {
    if (!showSettings) return
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSettings])

  const toggleField = (fieldId: string) => {
    const next = new Set(visibleFields)
    if (next.has(fieldId)) {
      next.delete(fieldId)
    } else {
      next.add(fieldId)
    }
    onVisibleFieldsChange(widgetId, next)
  }

  const selectAll = () => {
    onVisibleFieldsChange(widgetId, new Set(fieldConfigs.map(f => f.id)))
  }

  const deselectAll = () => {
    onVisibleFieldsChange(widgetId, new Set())
  }

  const hasFeedback = feedback.trim().length > 0
  const hiddenCount = fieldConfigs.length > 0
    ? fieldConfigs.length - visibleFields.size
    : 0

  return (
    <div className="widget-card">
      {/* ─── Drag Handle ─────────────────────────────────────── */}
      <div className="widget-drag-handle">
        <h3 className="flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <div className="flex items-center gap-1.5">
          {badge}
          {rightSlot}

          {/* Comment toggle */}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setShowComment(prev => !prev); setShowSettings(false) }}
            className={`p-1 rounded-md transition-all ${
              showComment || hasFeedback
                ? 'bg-amber-100 text-amber-600'
                : 'text-surface-300 hover:text-surface-500 hover:bg-surface-100'
            }`}
            title="Leave feedback"
          >
            <MessageSquare size={13} />
            {hasFeedback && !showComment && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
            )}
          </button>

          {/* Field settings toggle (only if widget has configurable fields) */}
          {fieldConfigs.length > 0 && (
            <div className="relative" ref={settingsRef} onMouseDown={(e) => e.stopPropagation()}>
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setShowSettings(prev => !prev); setShowComment(false) }}
                className={`p-1 rounded-md transition-all ${
                  showSettings
                    ? 'bg-brand-100 text-brand-600'
                    : hiddenCount > 0
                      ? 'bg-amber-50 text-amber-500'
                      : 'text-surface-300 hover:text-surface-500 hover:bg-surface-100'
                }`}
                title="Configure visible fields"
              >
                <Settings size={13} />
              </button>
              {hiddenCount > 0 && !showSettings && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                  {hiddenCount}
                </span>
              )}

              {/* ─── Field toggle dropdown ─────────────────── */}
              {showSettings && (
                <div
                  className="absolute right-0 top-full mt-1 z-[70] w-56 bg-white rounded-lg border border-surface-200 shadow-xl overflow-hidden"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-3 py-2 bg-surface-50 border-b border-surface-100">
                    <span className="text-[10px] font-bold text-surface-500 uppercase tracking-wider">Fields</span>
                    <div className="flex gap-1">
                      <button onClick={selectAll} className="text-[10px] text-brand-600 hover:text-brand-800 font-medium">All</button>
                      <span className="text-surface-200">|</span>
                      <button onClick={deselectAll} className="text-[10px] text-surface-400 hover:text-surface-600 font-medium">None</button>
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto py-1">
                    {fieldConfigs.map((fc) => {
                      const isVisible = visibleFields.has(fc.id)
                      return (
                        <label
                          key={fc.id}
                          className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-50 cursor-pointer transition-colors"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            isVisible
                              ? 'bg-brand-600 border-brand-600'
                              : 'border-surface-300 bg-white'
                          }`}>
                            {isVisible && <Check size={10} className="text-white" />}
                          </div>
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => toggleField(fc.id)}
                            className="sr-only"
                          />
                          <span className={`text-xs ${isVisible ? 'text-surface-700 font-medium' : 'text-surface-400'}`}>
                            {fc.label}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Inline Comment ──────────────────────────────────── */}
      {showComment && (
        <div className="px-3 py-2 bg-amber-50/60 border-b border-amber-100" onMouseDown={(e) => e.stopPropagation()}>
          <div className="flex items-start gap-2">
            <textarea
              ref={commentRef}
              value={feedback}
              onChange={(e) => onFeedbackChange(widgetId, e.target.value)}
              placeholder={`Feedback for "${title}"...`}
              className="flex-1 text-xs rounded-md border border-amber-200 bg-white px-2.5 py-1.5 text-surface-700 placeholder:text-surface-300 focus:ring-1 focus:ring-amber-400 focus:border-amber-400 resize-none"
              rows={2}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => { e.stopPropagation(); setShowComment(false) }}
              className="p-1 text-surface-300 hover:text-surface-500 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          {hasFeedback && (
            <p className="text-[10px] text-amber-500 mt-1">This comment will be included in the exported JSON.</p>
          )}
        </div>
      )}

      {/* ─── Widget Body ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {children(visibleFields)}
      </div>
    </div>
  )
}
