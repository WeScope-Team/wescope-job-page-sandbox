export interface FieldDefinition {
  id: string;
  label: string;
  group: string;
  defaultW: number;
  defaultH: number;
}

export const AVAILABLE_FIELDS: FieldDefinition[] = [
  { id: 'f_insured_name', label: 'Insured Name', group: 'Job Details', defaultW: 6, defaultH: 2 },
  { id: 'f_client_project', label: 'Client Project Number', group: 'Job Details', defaultW: 6, defaultH: 2 },
  { id: 'f_client_poc', label: 'Client POC', group: 'Job Details', defaultW: 6, defaultH: 2 },
  { id: 'f_job_type', label: 'Job Type', group: 'Job Details', defaultW: 4, defaultH: 2 },
  { id: 'f_order_type', label: 'Order Type', group: 'Job Details', defaultW: 4, defaultH: 2 },
  { id: 'f_insurance_carrier', label: 'Insurance Carrier', group: 'Job Details', defaultW: 6, defaultH: 2 },
  { id: 'f_claim_number', label: 'Claim Number', group: 'Job Details', defaultW: 6, defaultH: 2 },
  { id: 'f_mrp', label: 'Managed Repair Program', group: 'Job Details', defaultW: 6, defaultH: 2 },
  { id: 'f_estimation_software', label: 'Estimation Software', group: 'Job Details', defaultW: 6, defaultH: 2 },
  { id: 'f_zip_code', label: 'Zip Code', group: 'Job Details', defaultW: 4, defaultH: 2 },
  { id: 'f_date_received', label: 'Date Received', group: 'Job Details', defaultW: 6, defaultH: 2 },
  { id: 'f_estimate_value', label: 'Estimate Value', group: 'Job Details', defaultW: 6, defaultH: 2 },
  { id: 'f_size_category', label: 'Size Category', group: 'Job Details', defaultW: 6, defaultH: 2 },
  { id: 'f_flags', label: 'Flags (Urgent/Large Loss)', group: 'Job Details', defaultW: 8, defaultH: 2 },
  
  { id: 'f_tasks_table', label: 'Tasks Table', group: 'Tasks', defaultW: 24, defaultH: 10 },
  
  { id: 'f_files_photos', label: 'Photos', group: 'Files', defaultW: 12, defaultH: 8 },
  { id: 'f_files_documents', label: 'Documents', group: 'Files', defaultW: 12, defaultH: 8 },
  { id: 'f_files_estimates', label: 'Estimates', group: 'Files', defaultW: 12, defaultH: 8 },
  { id: 'f_files_models', label: 'Matterport Models', group: 'Files', defaultW: 12, defaultH: 8 },
  
  { id: 'f_links', label: 'Links Card', group: 'Links', defaultW: 8, defaultH: 6 },
  { id: 'f_matterport', label: 'Matterport Viewer', group: 'Links', defaultW: 16, defaultH: 12 },
  
  { id: 'f_loss_summary', label: 'Loss Summary', group: 'Loss Summary', defaultW: 12, defaultH: 6 },
  
  { id: 'f_insurance_guidelines', label: 'Insurance Guidelines', group: 'Guidelines', defaultW: 12, defaultH: 6 },
  
  { id: 'f_job_notes', label: 'Job Notes', group: 'Job Notes', defaultW: 8, defaultH: 8 },
  
  { id: 'f_action_pane', label: 'Action Pane', group: 'Actions', defaultW: 8, defaultH: 12 },
  { id: 'f_timeline', label: 'Timeline', group: 'Timeline', defaultW: 24, defaultH: 6 }
];
