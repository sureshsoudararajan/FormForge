export type FieldType =
  | 'text'
  | 'textarea'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'email'
  | 'number'
  | 'file';

export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: FieldOption[];
  hint?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface Form {
  id: string;
  title: string;
  description?: string;
  schema: FormField[];
  userId: string;
  published: boolean;
  createdAt: string;
  updatedAt?: string;
  tone?: string;
  questions?: string[];
}

export interface FormResponse {
  id: string;
  formId: string;
  data: Record<string, any>;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

export interface AnalyticsData {
  totalResponses: number;
  submissionsOverTime: { date: string; count: number }[];
  fieldDistributions: Record<string, { label: string; value: string; count: number }[]>;
}
