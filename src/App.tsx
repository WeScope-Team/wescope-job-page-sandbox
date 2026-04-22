import React, { useState } from 'react';
import { Responsive, WidthProvider, type Layout, type Layouts } from 'react-grid-layout';
import { Plus, LayoutGrid, RotateCcw, Download, Database, MessageSquare } from 'lucide-react';
import FieldSidebar from './components/FieldSidebar';
import DynamicWidget from './components/DynamicWidget';
import archetypes from './data/archetypes.json';

const ResponsiveGrid = WidthProvider(Responsive);

interface WidgetData {
  id: string;
  title: string;
  fields: string[];
}

export default function App() {
  const [widgets, setWidgets] = useState<WidgetData[]>([]);
  const [mainLayouts, setMainLayouts] = useState<Layouts>({ lg: [] });
  const [innerLayouts, setInnerLayouts] = useState<Record<string, Layout[]>>({});
  const [selectedArchetypeIndex, setSelectedArchetypeIndex] = useState(0);
  const [comments, setComments] = useState<{
    page: string;
    widgets: Record<string, string>;
    fields: Record<string, string>;
  }>({ page: '', widgets: {}, fields: {} });
  const [showPageComment, setShowPageComment] = useState(false);

  const handleAddWidget = () => {
    const newId = `widget-${Date.now()}`;
    setWidgets(prev => [...prev, { id: newId, title: 'New Widget', fields: [] }]);
    setMainLayouts(prev => {
      const currentLg = prev.lg || [];
      // Calculate next available Y
      let maxY = 0;
      currentLg.forEach(l => { if (l.y + l.h > maxY) maxY = l.y + l.h; });
      return {
        ...prev,
        lg: [...currentLg, { i: newId, x: 0, y: maxY, w: 8, h: 8, minW: 4, minH: 4 }]
      };
    });
    setInnerLayouts(prev => ({ ...prev, [newId]: [] }));
  };

  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
    setMainLayouts(prev => ({
      ...prev,
      lg: (prev.lg || []).filter(l => l.i !== widgetId)
    }));
    setInnerLayouts(prev => {
      const newLayouts = { ...prev };
      delete newLayouts[widgetId];
      return newLayouts;
    });
  };

  const handleTitleChange = (widgetId: string, newTitle: string) => {
    setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, title: newTitle } : w));
  };

  const handleDropField = (widgetId: string, fieldId: string, layoutItem: Layout) => {
    setWidgets(prev => prev.map(w => {
      if (w.id === widgetId && !w.fields.includes(fieldId)) {
        return { ...w, fields: [...w.fields, fieldId] };
      }
      return w;
    }));
    
    setInnerLayouts(prev => {
      const currentLayout = prev[widgetId] || [];
      return {
        ...prev,
        [widgetId]: [...currentLayout, { ...layoutItem, i: fieldId }]
      };
    });
  };

  const handleRemoveField = (widgetId: string, fieldId: string) => {
    setWidgets(prev => prev.map(w => {
      if (w.id === widgetId) {
        return { ...w, fields: w.fields.filter(f => f !== fieldId) };
      }
      return w;
    }));
    
    setInnerLayouts(prev => {
      const currentLayout = prev[widgetId] || [];
      return {
        ...prev,
        [widgetId]: currentLayout.filter(l => l.i !== fieldId)
      };
    });
  };

  const handleInnerLayoutChange = (widgetId: string, newLayout: Layout[]) => {
    setInnerLayouts(prev => ({ ...prev, [widgetId]: newLayout }));
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset the entire layout?")) {
      setWidgets([]);
      setMainLayouts({ lg: [] });
      setInnerLayouts({});
    }
  };

  const handleExportLayout = () => {
    const exportData = {
      widgets,
      mainLayouts,
      innerLayouts,
      comments
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "job_page_layout.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const usedFieldIds = React.useMemo(() => {
    const set = new Set<string>();
    widgets.forEach(w => w.fields.forEach(f => set.add(f)));
    return set;
  }, [widgets]);

  const currentArchetype = archetypes[selectedArchetypeIndex];

  return (
    <div className="h-screen w-screen flex bg-gray-100 overflow-hidden text-gray-900 font-sans">
      {/* Left Sidebar */}
      <FieldSidebar usedFieldIds={usedFieldIds} />

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0 overflow-x-auto gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-blue-50 p-2 rounded-lg hidden sm:block">
              <LayoutGrid className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight whitespace-nowrap">Job Page Builder</h1>
              <p className="text-sm text-gray-500 hidden md:block whitespace-nowrap">Drag fields from the sidebar into widgets.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPageComment(!showPageComment)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-blue-200 whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Page Note</span>
            </button>
            <div className="relative flex items-center border border-gray-300 rounded-md bg-white mr-1">
              <div className="pl-2 pr-1 text-gray-500">
                <Database className="h-4 w-4" />
              </div>
              <select
                className="py-1.5 pr-7 pl-1 text-sm bg-transparent border-none outline-none focus:ring-0 text-gray-700 cursor-pointer appearance-none max-w-[150px] sm:max-w-xs truncate"
                value={selectedArchetypeIndex}
                onChange={(e) => setSelectedArchetypeIndex(Number(e.target.value))}
              >
                {archetypes.map((arch, idx) => (
                  <option key={arch.archetype_id} value={idx}>
                    Preview: {arch.archetype_label}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleExportLayout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={handleAddWidget}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Widget</span>
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-y-auto w-full relative">
          {showPageComment && (
            <div className="mx-8 mt-4 mb-2 bg-yellow-50 border border-yellow-200 rounded-md p-3 shadow-sm relative">
              <label className="block text-xs font-semibold text-yellow-800 uppercase tracking-wider mb-1">Page Feedback</label>
              <textarea
                className="w-full bg-white border border-yellow-300 rounded p-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none resize-y min-h-[60px]"
                placeholder="Enter feedback for the entire page..."
                value={comments.page}
                onChange={(e) => setComments(prev => ({ ...prev, page: e.target.value }))}
              />
            </div>
          )}
          {widgets.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-white/50">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <LayoutGrid className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-medium text-gray-800 mb-2">Canvas is Empty</h2>
              <p className="text-gray-500 max-w-sm text-center mb-6">
                Get started by adding an empty widget box, then drag fields into it from the palette.
              </p>
              <button
                onClick={handleAddWidget}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Widget
              </button>
            </div>
          ) : (
            <ResponsiveGrid
              className="main-layout-grid"
              layouts={mainLayouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 24, md: 24, sm: 24, xs: 24, xxs: 24 }}
              rowHeight={28}
              onLayoutChange={(layout, layouts) => setMainLayouts(layouts)}
              draggableHandle=".widget-drag-handle"
              compactType="vertical"
              margin={[16, 16]}
              containerPadding={[0, 0]}
            >
              {widgets.map(widget => (
                <div key={widget.id} className="relative h-full w-full">
                  <DynamicWidget
                    widgetId={widget.id}
                    title={widget.title}
                    fields={widget.fields}
                    innerLayout={innerLayouts[widget.id] || []}
                    archetypeData={currentArchetype}
                    widgetComment={comments.widgets[widget.id] || ''}
                    onWidgetCommentChange={(c) => setComments(prev => ({ ...prev, widgets: { ...prev.widgets, [widget.id]: c } }))}
                    fieldComments={comments.fields}
                    onFieldCommentChange={(fId, c) => setComments(prev => ({ ...prev, fields: { ...prev.fields, [fId]: c } }))}
                    onTitleChange={(title) => handleTitleChange(widget.id, title)}
                    onRemoveWidget={() => handleRemoveWidget(widget.id)}
                    onDropField={(fieldId, layoutItem) => handleDropField(widget.id, fieldId, layoutItem)}
                    onInnerLayoutChange={(layout) => handleInnerLayoutChange(widget.id, layout)}
                    onRemoveField={(fieldId) => handleRemoveField(widget.id, fieldId)}
                  />
                </div>
              ))}
            </ResponsiveGrid>
          )}
        </div>
      </div>
    </div>
  );
}
