'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  X,
  MapPin,
  Users,
  FileText,
  Hash,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  Save,
  Settings
} from 'lucide-react';

interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string[];
  group_id?: string;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: FileText },
  { value: 'number', label: 'Number Input', icon: Hash },
  { value: 'select', label: 'Dropdown Select', icon: Settings },
  { value: 'textarea', label: 'Long Text Area', icon: FileText },
];

const PRESET_FIELDS = [
  {
    name: 'Location',
    type: 'select' as const,
    placeholder: 'Select work location',
    options: ['Office', 'Home', 'Client Site', 'Remote'],
    icon: MapPin
  },
  {
    name: 'Team Size',
    type: 'number' as const,
    placeholder: 'Number of people working',
    icon: Users
  },
  {
    name: 'Project Notes',
    type: 'textarea' as const,
    placeholder: 'What are you working on today?',
    required: false,
    icon: FileText
  },
  {
    name: 'Task Priority',
    type: 'select' as const,
    options: ['Low', 'Medium', 'High', 'Urgent'],
    icon: Clock
  }
];

export default function AdminPanel() {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [newField, setNewField] = useState<Partial<CustomField>>({
    name: '',
    type: 'text',
    required: true,
    placeholder: '',
    options: []
  });
  const [newOption, setNewOption] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomFields();
  }, []);

  const loadCustomFields = async () => {
    try {
      // Try to load from API first
      try {
        const response = await fetch('/api/v1/groups/custom-fields');
        if (response.ok) {
          const data = await response.json();
          setCustomFields(data.fields || []);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.warn('API failed, using localStorage:', apiError);
      }

      // Fallback to localStorage
      const saved = localStorage.getItem('group_custom_fields');
      if (saved) {
        setCustomFields(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load custom fields:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveField = async () => {
    if (!newField.name?.trim()) return;

    const field: CustomField = {
      id: Date.now().toString(),
      name: newField.name,
      type: newField.type || 'text',
      required: newField.required || false,
      placeholder: newField.placeholder || '',
      options: newField.options || [],
      group_id: 'default' // TODO: Get actual group ID
    };

    try {
      // Try API first
      try {
        const response = await fetch('/api/v1/groups/custom-fields', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(field)
        });

        if (response.ok) {
          await loadCustomFields();
          resetForm();
          return;
        }
      } catch (apiError) {
        console.warn('API save failed, using localStorage:', apiError);
      }

      // Fallback to localStorage
      const updated = [...customFields, field];
      localStorage.setItem('group_custom_fields', JSON.stringify(updated));
      setCustomFields(updated);
    } catch (error) {
      console.error('Failed to save field:', error);
    }

    resetForm();
  };

  const deleteField = async (fieldId: string) => {
    try {
      // Try API first
      try {
        const response = await fetch(`/api/v1/groups/custom-fields/${fieldId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await loadCustomFields();
          return;
        }
      } catch (apiError) {
        console.warn('API delete failed, using localStorage:', apiError);
      }

      // Fallback to localStorage
      const updated = customFields.filter(field => field.id !== fieldId);
      localStorage.setItem('group_custom_fields', JSON.stringify(updated));
      setCustomFields(updated);
    } catch (error) {
      console.error('Failed to delete field:', error);
    }
  };

  const addPresetField = (preset: any) => {
    setNewField({
      name: preset.name,
      type: preset.type,
      required: preset.required ?? true,
      placeholder: preset.placeholder,
      options: preset.options || []
    });
    setShowAddForm(true);
  };

  const addOption = () => {
    if (newOption.trim() && !newField.options?.includes(newOption.trim())) {
      setNewField({
        ...newField,
        options: [...(newField.options || []), newOption.trim()]
      });
      setNewOption('');
    }
  };

  const removeOption = (option: string) => {
    setNewField({
      ...newField,
      options: newField.options?.filter(opt => opt !== option) || []
    });
  };

  const resetForm = () => {
    setNewField({
      name: '',
      type: 'text',
      required: true,
      placeholder: '',
      options: []
    });
    setShowAddForm(false);
    setEditingField(null);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
            <Shield className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600">Configure custom fields for your group members</p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-orange-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-orange-800 font-medium">Group Manager Controls</p>
              <p className="text-orange-700 mt-1">
                Add custom fields that your group members must fill out before clocking in.
                You can require location, project details, team size, or any other information needed for your workflow.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Fields */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Add Fields</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRESET_FIELDS.map((preset, index) => (
            <button
              key={index}
              onClick={() => addPresetField(preset)}
              className="flex items-center p-4 border border-gray-200 hover:border-orange-300 hover:bg-orange-50 rounded-lg transition-colors text-left"
            >
              <preset.icon className="h-5 w-5 text-orange-600 mr-3 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">{preset.name}</div>
                <div className="text-sm text-gray-500">{preset.placeholder}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Add Custom Field */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Custom Fields</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="font-medium text-gray-900 mb-4">Create Custom Field</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
                  <input
                    type="text"
                    value={newField.name || ''}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                    placeholder="e.g., Work Location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                  <select
                    value={newField.type || 'text'}
                    onChange={(e) => setNewField({ ...newField, type: e.target.value as CustomField['type'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {FIELD_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder Text</label>
                <input
                  type="text"
                  value={newField.placeholder || ''}
                  onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                  placeholder="Help text for users"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              {/* Options for select type */}
              {newField.type === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Add option"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <button
                      onClick={addOption}
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newField.options?.map((option, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                      >
                        {option}
                        <button
                          onClick={() => removeOption(option)}
                          className="ml-1 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={newField.required || false}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="required" className="ml-2 text-sm text-gray-700">
                  Required field
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveField}
                  disabled={!newField.name?.trim()}
                  className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Field
                </button>
                <button
                  onClick={resetForm}
                  className="flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Fields */}
        <div className="space-y-3">
          {customFields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p>No custom fields configured yet</p>
              <p className="text-sm">Add fields above to require information before clock-in</p>
            </div>
          ) : (
            customFields.map((field) => (
              <div key={field.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{field.name}</span>
                    {field.required && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                        Required
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded capitalize">
                      {field.type}
                    </span>
                  </div>
                  {field.placeholder && (
                    <p className="text-sm text-gray-500 mt-1">{field.placeholder}</p>
                  )}
                  {field.options && field.options.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {field.options.map((option, index) => (
                        <span key={index} className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                          {option}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => deleteField(field.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Preview */}
      {customFields.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Clock-In Preview</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm mb-4">
              This is how your group members will see the custom fields when they clock in:
            </p>
            <div className="bg-white rounded-lg p-4 space-y-4">
              {customFields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.name} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    >
                      <option>{field.placeholder}</option>
                      {field.options?.map((option, index) => (
                        <option key={index}>{option}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      disabled
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 h-24"
                    />
                  ) : (
                    <input
                      type={field.type}
                      disabled
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  )}
                </div>
              ))}
              <button
                disabled
                className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg opacity-50 cursor-not-allowed"
              >
                Clock In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}