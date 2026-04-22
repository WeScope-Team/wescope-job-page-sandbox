import React from 'react';
import { AVAILABLE_FIELDS } from '../data/AVAILABLE_FIELDS';
import { FileText, LayoutGrid, Type, List, Image as ImageIcon, Link as LinkIcon, File } from 'lucide-react';

export default function FieldRenderer({ fieldId, archetypeData }: { fieldId: string; archetypeData?: any }) {
  const fieldDef = AVAILABLE_FIELDS.find(f => f.id === fieldId);
  
  if (!fieldDef) {
    return <div className="text-red-500 text-sm">Unknown Field</div>;
  }

  // Helper to extract data based on field ID
  const getFieldData = () => {
    if (!archetypeData) return null;
    
    // Mapping Job Details
    const jd = archetypeData.job_details || {};
    switch (fieldId) {
      case 'f_insured_name': return jd.insured_name;
      case 'f_client_project': return jd.client_project_number;
      case 'f_client_poc': return jd.client_poc || 'N/A';
      case 'f_job_type': return jd.job_type;
      case 'f_order_type': return jd.order_type;
      case 'f_insurance_carrier': return jd.insurance_carrier;
      case 'f_claim_number': return jd.insurance_claim_number;
      case 'f_mrp': return jd.managed_repair_program;
      case 'f_estimation_software': return jd.estimation_software;
      case 'f_zip_code': return jd.client_location;
      case 'f_date_received': return new Date(jd.date_request_received).toLocaleDateString();
      case 'f_estimate_value': return `$${jd.current_estimate_value?.toLocaleString()}`;
      case 'f_size_category': return jd.estimate_size_category;
      case 'f_flags': return jd.is_urgent ? 'Urgent' : (jd.is_large_loss ? 'Large Loss' : 'Standard');
      default: return null;
    }
  };

  const dataValue = getFieldData();

  // Special rendering for Job Details fields
  if (fieldDef.group === 'Job Details' && dataValue !== null) {
    return (
      <div className="w-full h-full flex flex-col justify-center px-3 py-1">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 line-clamp-1">{fieldDef.label}</span>
        <span className="text-sm font-medium text-gray-800 line-clamp-2" title={String(dataValue)}>{dataValue}</span>
      </div>
    );
  }

  // Placeholder for complex fields or empty data
  const renderIcon = () => {
    switch (fieldDef.group) {
      case 'Job Details': return <Type className="h-5 w-5 text-blue-500 mb-1" />;
      case 'Tasks': return <List className="h-5 w-5 text-green-500 mb-1" />;
      case 'Files': 
        if (fieldId.includes('photo')) return <ImageIcon className="h-5 w-5 text-purple-500 mb-1" />;
        return <File className="h-5 w-5 text-purple-500 mb-1" />;
      case 'Links': return <LinkIcon className="h-5 w-5 text-orange-500 mb-1" />;
      case 'Job Notes': return <FileText className="h-5 w-5 text-yellow-500 mb-1" />;
      default: return <LayoutGrid className="h-5 w-5 text-gray-500 mb-1" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-center p-2">
      {renderIcon()}
      <span className="text-sm font-medium text-gray-700 leading-tight">
        {fieldDef.label}
      </span>
      {fieldDef.group !== 'Job Details' && (
        <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">
          {fieldDef.group}
          {archetypeData && fieldId === 'f_tasks_table' && ` (${archetypeData.tasks?.length || 0} tasks)`}
        </span>
      )}
    </div>
  );
}
