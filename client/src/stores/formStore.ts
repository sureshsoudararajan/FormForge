import { create } from 'zustand';
import { FormField, Form } from '@/types';
import { generateId } from '@/lib/utils';

interface FormStore {
  // Form metadata
  formId: string | null;
  title: string;
  description: string;
  published: boolean;
  tone: string;

  // Fields
  fields: FormField[];
  selectedFieldId: string | null;

  // Actions
  setFormId: (id: string | null) => void;
  setTitle: (title: string) => void;
  setDescription: (desc: string) => void;
  setPublished: (published: boolean) => void;
  setTone: (tone: string) => void;

  // Field actions
  addField: (type: FormField['type']) => void;
  removeField: (id: string) => void;
  updateField: (id: string, updates: Partial<FormField>) => void;
  reorderFields: (activeId: string, overId: string) => void;
  selectField: (id: string | null) => void;

  // Bulk actions
  loadForm: (form: Form) => void;
  loadSchema: (fields: FormField[]) => void;
  resetForm: () => void;

  // Getters
  getSelectedField: () => FormField | undefined;
}

const defaultFieldProps: Record<FormField['type'], Partial<FormField>> = {
  text: { label: 'Text Input', placeholder: 'Enter text...' },
  textarea: { label: 'Long Text', placeholder: 'Enter your response...' },
  dropdown: { label: 'Dropdown', options: [{ id: generateId(), label: 'Option 1', value: 'option_1' }] },
  radio: { label: 'Multiple Choice', options: [{ id: generateId(), label: 'Option 1', value: 'option_1' }] },
  checkbox: { label: 'Checkboxes', options: [{ id: generateId(), label: 'Option 1', value: 'option_1' }] },
  date: { label: 'Date' },
  email: { label: 'Email', placeholder: 'email@example.com' },
  number: { label: 'Number', placeholder: '0' },
  file: { label: 'File Upload' },
};

export const useFormStore = create<FormStore>((set, get) => ({
  formId: null,
  title: 'Untitled Form',
  description: '',
  published: false,
  tone: 'friendly',
  fields: [],
  selectedFieldId: null,

  setFormId: (id) => set({ formId: id }),
  setTitle: (title) => set({ title }),
  setDescription: (desc) => set({ description: desc }),
  setPublished: (published) => set({ published }),
  setTone: (tone) => set({ tone }),

  addField: (type) => {
    const newField: FormField = {
      id: generateId(),
      type,
      label: defaultFieldProps[type].label || 'New Field',
      placeholder: defaultFieldProps[type].placeholder || '',
      helpText: '',
      required: false,
      options: defaultFieldProps[type].options
        ? defaultFieldProps[type].options!.map(o => ({ ...o, id: generateId() }))
        : undefined,
    };
    set((state) => ({
      fields: [...state.fields, newField],
      selectedFieldId: newField.id,
    }));
  },

  removeField: (id) =>
    set((state) => ({
      fields: state.fields.filter((f) => f.id !== id),
      selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId,
    })),

  updateField: (id, updates) =>
    set((state) => ({
      fields: state.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),

  reorderFields: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.fields.findIndex((f) => f.id === activeId);
      const newIndex = state.fields.findIndex((f) => f.id === overId);
      if (oldIndex === -1 || newIndex === -1) return state;

      const newFields = [...state.fields];
      const [removed] = newFields.splice(oldIndex, 1);
      newFields.splice(newIndex, 0, removed);
      return { fields: newFields };
    }),

  selectField: (id) => set({ selectedFieldId: id }),

  loadForm: (form) =>
    set({
      formId: form.id,
      title: form.title,
      description: form.description || '',
      published: form.published,
      tone: form.tone || 'friendly',
      fields: form.schema,
      selectedFieldId: null,
    }),

  loadSchema: (fields) =>
    set({
      fields,
      selectedFieldId: null,
    }),

  resetForm: () =>
    set({
      formId: null,
      title: 'Untitled Form',
      description: '',
      published: false,
      tone: 'friendly',
      fields: [],
      selectedFieldId: null,
    }),

  getSelectedField: () => {
    const state = get();
    return state.fields.find((f) => f.id === state.selectedFieldId);
  },
}));
