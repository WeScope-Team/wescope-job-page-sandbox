import React, { useState, useMemo } from 'react';
import { AVAILABLE_FIELDS } from '../data/AVAILABLE_FIELDS';
import { ChevronDown, ChevronRight, GripVertical, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export default function FieldSidebar({ usedFieldIds = new Set<string>() }: { usedFieldIds?: Set<string> }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const filteredFields = useMemo(() => {
    if (!searchQuery) return AVAILABLE_FIELDS;
    const lowerQuery = searchQuery.toLowerCase();
    return AVAILABLE_FIELDS.filter(f => 
      f.label.toLowerCase().includes(lowerQuery) || 
      f.group.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  const groupedFields = useMemo(() => {
    const groups: Record<string, typeof AVAILABLE_FIELDS> = {};
    filteredFields.forEach(field => {
      if (!groups[field.group]) {
        groups[field.group] = [];
      }
      groups[field.group].push(field);
    });
    return groups;
  }, [filteredFields]);

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col shadow-sm flex-shrink-0 z-10">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Field Palette</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search fields..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {Object.entries(groupedFields).map(([group, fields]) => {
          const isCollapsed = collapsedGroups[group];
          return (
            <div key={group} className="space-y-1">
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 py-1.5 px-2 rounded-md transition-colors"
              >
                <span>{group}</span>
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {!isCollapsed && (
                <div className="space-y-1 mt-1">
                  {fields.map(field => {
                    const isUsed = usedFieldIds.has(field.id);
                    return (
                      <div
                        key={field.id}
                        draggable={!isUsed}
                        unselectable="on"
                        onDragStart={(e) => {
                          if (isUsed) {
                            e.preventDefault();
                            return;
                          }
                          e.dataTransfer.setData('text/plain', field.id);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md text-sm",
                          isUsed 
                            ? "bg-gray-50 border border-transparent text-gray-400 cursor-not-allowed opacity-60" 
                            : "droppable-element bg-white border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow transition-all group cursor-grab active:cursor-grabbing"
                        )}
                      >
                        <GripVertical className={cn("h-4 w-4 transition-colors", isUsed ? "text-gray-300" : "text-gray-400 group-hover:text-blue-400")} />
                        <span className={cn("truncate font-medium", isUsed ? "text-gray-400 line-through" : "text-gray-700")}>{field.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {Object.keys(groupedFields).length === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            No fields found.
          </div>
        )}
      </div>
    </div>
  );
}
