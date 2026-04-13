import { FolderOpen, FileText, Image, Upload, Download } from 'lucide-react'
import WidgetShell, { type FieldConfig } from './WidgetShell'

interface Props {
  jobNumber: string
  widgetId: string
  fieldConfigs: FieldConfig[]
  visibleFields: Set<string>
  onVisibleFieldsChange: (widgetId: string, fields: Set<string>) => void
  feedback: string
  onFeedbackChange: (widgetId: string, text: string) => void
}

const MOCK_FOLDERS = [
  { name: 'Photos', children: [
    { name: 'Before', files: ['IMG_001.jpg', 'IMG_002.jpg', 'IMG_003.jpg'] },
    { name: 'After', files: ['IMG_010.jpg'] },
  ]},
  { name: 'Estimates', children: [], files: ['Xactimate_Draft.pdf', 'Final_Estimate_v2.pdf'] },
  { name: 'Scope Notes', children: [], files: ['scope_notes.docx'] },
]

export default function FilesWidget({ jobNumber, ...shellProps }: Props) {
  return (
    <WidgetShell
      title="Files"
      icon={<FolderOpen size={15} className="text-brand-500" />}
      rightSlot={
        shellProps.visibleFields.has('actions') ? (
          <div className="flex gap-1.5">
            <button className="p-1.5 rounded-md text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all" title="Upload"><Upload size={14} /></button>
            <button className="p-1.5 rounded-md text-surface-400 hover:text-brand-600 hover:bg-brand-50 transition-all" title="Download All"><Download size={14} /></button>
          </div>
        ) : undefined
      }
      {...shellProps}
    >
      {(visible) => (
        <div className="p-4">
          {visible.has('breadcrumb') && (
            <div className="flex items-center gap-1.5 text-xs text-surface-400 mb-3 pb-2 border-b border-surface-100">
              <FolderOpen size={12} />
              <span className="font-medium text-surface-600">{jobNumber}</span>
            </div>
          )}
          {visible.has('folder_tree') && (
            <div className="space-y-1">
              {MOCK_FOLDERS.map((folder) => (
                <div key={folder.name}>
                  <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-surface-50 cursor-pointer transition-colors">
                    <FolderOpen size={14} className="text-amber-500" />
                    <span className="text-sm font-medium text-surface-700">{folder.name}</span>
                  </div>
                  {folder.children?.map((sub) => (
                    <div key={sub.name} className="ml-5">
                      <div className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-surface-50 cursor-pointer transition-colors">
                        <FolderOpen size={12} className="text-amber-400" />
                        <span className="text-xs font-medium text-surface-600">{sub.name}</span>
                        <span className="text-xs text-surface-300 ml-auto">{sub.files?.length || 0}</span>
                      </div>
                      {sub.files?.map((file) => (
                        <div key={file} className="ml-5 flex items-center gap-2 py-1 px-2 rounded-md hover:bg-brand-50/50 cursor-pointer transition-colors group">
                          <Image size={11} className="text-surface-400" />
                          <span className="text-xs text-surface-500 group-hover:text-brand-600 transition-colors">{file}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {'files' in folder && folder.files?.map((file: string) => (
                    <div key={file} className="ml-5 flex items-center gap-2 py-1 px-2 rounded-md hover:bg-brand-50/50 cursor-pointer transition-colors group">
                      <FileText size={11} className="text-surface-400" />
                      <span className="text-xs text-surface-500 group-hover:text-brand-600 transition-colors">{file}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {!visible.has('folder_tree') && !visible.has('breadcrumb') && (
            <p className="text-xs text-surface-400 text-center py-6">All sections hidden.</p>
          )}
        </div>
      )}
    </WidgetShell>
  )
}
