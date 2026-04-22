import React, { useState, useRef } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Trash2, GripHorizontal, Edit2, Check, X, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import FieldRenderer from './FieldRenderer';
import { AVAILABLE_FIELDS } from '../data/AVAILABLE_FIELDS';

const ResponsiveGrid = WidthProvider(Responsive);

export interface DynamicWidgetProps {
  widgetId: string;
  title: string;
  fields: string[]; // List of field IDs present in this widget
  innerLayout: Layout[]; // Layout for the fields within this widget
  onTitleChange: (newTitle: string) => void;
  onRemoveWidget: () => void;
  onDropField: (fieldId: string, layoutItem: Layout) => void;
  onInnerLayoutChange: (newLayout: Layout[]) => void;
  onRemoveField: (fieldId: string) => void;
  archetypeData?: any;
  widgetComment?: string;
  onWidgetCommentChange?: (comment: string) => void;
  fieldComments?: Record<string, string>;
  onFieldCommentChange?: (fieldId: string, comment: string) => void;
}

export default function DynamicWidget({
  widgetId,
  title,
  fields,
  innerLayout,
  onTitleChange,
  onRemoveWidget,
  onDropField,
  onInnerLayoutChange,
  onRemoveField,
  archetypeData,
  widgetComment = '',
  onWidgetCommentChange,
  fieldComments = {},
  onFieldCommentChange
}: DynamicWidgetProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showWidgetComment, setShowWidgetComment] = useState(false);
  const [showFieldComments, setShowFieldComments] = useState<Record<string, boolean>>({});
  const [editTitleValue, setEditTitleValue] = useState(title);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const handleSaveTitle = () => {
    if (editTitleValue.trim()) {
      onTitleChange(editTitleValue.trim());
    } else {
      setEditTitleValue(title);
    }
    setIsEditingTitle(false);
  };

  const processDrop = (fieldId: string | undefined, e: Event | React.DragEvent, item?: Layout) => {
    if (!fieldId) return;
    if (fields.includes(fieldId)) return;

    const fieldDef = AVAILABLE_FIELDS.find(f => f.id === fieldId);
    
    // Calculate new position
    let newLayoutItem: Layout;
    if (item) {
      // From RGL
      newLayoutItem = { ...item };
      newLayoutItem.w = fieldDef ? fieldDef.defaultW : 4;
      newLayoutItem.h = fieldDef ? fieldDef.defaultH : 2;
    } else {
      // Native drop
      let maxY = 0;
      innerLayout.forEach(l => { if (l.y + l.h > maxY) maxY = l.y + l.h; });
      newLayoutItem = { 
        i: fieldId, 
        x: 0, 
        y: maxY, 
        w: fieldDef ? fieldDef.defaultW : 4, 
        h: fieldDef ? fieldDef.defaultH : 2 
      };
    }
    
    onDropField(fieldId, newLayoutItem);
  };

  const handleRGLDrop = (layout: Layout[], item: Layout, e: Event) => {
    const dragEvent = e as unknown as DragEvent;
    const fieldId = dragEvent.dataTransfer?.getData('text/plain');
    processDrop(fieldId, e, item);
  };

  const handleNativeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const fieldId = e.dataTransfer.getData('text/plain');
    processDrop(fieldId, e);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Widget Header - Outer Drag Handle */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200 group">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="widget-drag-handle cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1 rounded-sm">
            <GripHorizontal className="h-5 w-5" />
          </div>
          
          {isEditingTitle ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                type="text"
                autoFocus
                className="flex-1 px-2 py-1 text-sm border border-blue-400 rounded outline-none focus:ring-2 focus:ring-blue-100"
                value={editTitleValue}
                onChange={(e) => setEditTitleValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                onBlur={handleSaveTitle}
              />
              <button onMouseDown={handleSaveTitle} className="p-1 text-green-600 hover:bg-green-50 rounded">
                <Check className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0 group/title cursor-pointer" onClick={() => setIsEditingTitle(true)}>
              <h3 className="font-medium text-gray-800 text-sm truncate select-none">{title}</h3>
              <Edit2 className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover/title:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowWidgetComment(!showWidgetComment)}
            className={cn("p-1.5 rounded-md transition-colors", showWidgetComment || widgetComment ? "text-blue-500 bg-blue-50" : "text-gray-400 hover:text-blue-500 hover:bg-blue-50")}
            title="Widget Feedback"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            onClick={onRemoveWidget}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
            title="Remove Widget"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {showWidgetComment && (
        <div className="px-3 pb-2 bg-gray-50 border-b border-gray-200">
          <textarea
            className="w-full bg-white border border-blue-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-400 outline-none resize-y min-h-[40px]"
            placeholder="Add feedback for this widget..."
            value={widgetComment}
            onChange={(e) => onWidgetCommentChange?.(e.target.value)}
          />
        </div>
      )}

      {/* Widget Inner Content - Droppable Area */}
      <div 
        className={cn(
          "flex-1 overflow-y-auto relative p-2",
          fields.length === 0 && "flex items-center justify-center border-2 border-dashed border-gray-200 m-2 rounded-lg bg-gray-50/50"
        )}
        ref={gridContainerRef}
      >
        {fields.length === 0 ? (
          <div 
            className="text-center p-4 w-full h-full flex flex-col items-center justify-center bg-gray-50/50"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleNativeDrop}
          >
            <p className="text-sm text-gray-500 font-medium">Empty Widget</p>
            <p className="text-xs text-gray-400 mt-1">Drag fields from the sidebar and drop them here.</p>
          </div>
        ) : (
          <ResponsiveGrid
            className="inner-layout-grid h-full w-full"
            layouts={{ lg: innerLayout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 24, md: 24, sm: 24, xs: 24, xxs: 24 }}
            rowHeight={28}
            onLayoutChange={onInnerLayoutChange}
            isDroppable={true}
            onDrop={handleRGLDrop}
            droppingItem={{ i: 'drop', w: 6, h: 2 }}
            isDraggable={true}
            isResizable={true}
            compactType="vertical"
            margin={[8, 8]}
            containerPadding={[0, 0]}
          >
            {fields.map(fieldId => (
              <div key={fieldId} className="relative group/field h-full w-full flex flex-col">
                <div className="absolute top-1 right-1 z-10 opacity-0 group-hover/field:opacity-100 transition-opacity flex items-center gap-1">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFieldComments(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
                    }}
                    className={cn("p-1 border border-gray-200 rounded shadow-sm", showFieldComments[fieldId] || fieldComments[fieldId] ? "bg-blue-50 text-blue-500" : "bg-white text-gray-400 hover:bg-blue-50")}
                    title="Field Feedback"
                  >
                    <MessageSquare className="h-3 w-3" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveField(fieldId);
                    }}
                    className="p-1 bg-white border border-gray-200 rounded text-red-500 hover:bg-red-50 shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="w-full h-full p-2 bg-gray-50 border border-gray-200 rounded shadow-sm overflow-hidden flex items-center justify-center hover:border-blue-300 transition-colors cursor-move">
                  <FieldRenderer fieldId={fieldId} archetypeData={archetypeData} />
                </div>
                {showFieldComments[fieldId] && (
                  <div className="absolute bottom-1 left-1 right-1 z-20">
                    <textarea
                      className="w-full bg-white border border-blue-200 rounded p-1 text-[10px] focus:ring-1 focus:ring-blue-400 outline-none resize-none shadow-md h-12"
                      placeholder="Field feedback..."
                      value={fieldComments[fieldId] || ''}
                      onChange={(e) => onFieldCommentChange?.(fieldId, e.target.value)}
                      onMouseDown={(e) => e.stopPropagation()} // prevent drag
                    />
                  </div>
                )}
              </div>
            ))}
          </ResponsiveGrid>
        )}

        {/* This invisible overlay acts as a drop target when the grid is empty, 
            or extends the droppable area below the grid items */}
        {fields.length > 0 && (
          <div 
            className="absolute inset-0 pointer-events-none"
            onDragOver={(e) => {
              // Only allow drop if we're not over the grid items
              // RGL handles its own drops
              e.preventDefault();
            }}
            onDrop={(e) => {
              // If the drop event reached here, RGL didn't catch it
              handleNativeDrop(e);
            }}
          />
        )}
      </div>
    </div>
  );
}
