'use client';

import React from 'react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { ExportFormat, ExportFrequency } from '@/types/export';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (config: ExportConfig) => void;
  loading?: boolean;
}

export interface ExportConfig {
  format: ExportFormat;
  startDate: string;
  endDate: string;
  includeBreaks: boolean;
  includeOvertime: boolean;
  groupBy: 'day' | 'week' | 'month';
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  loading = false
}) => {
  const [config, setConfig] = React.useState<ExportConfig>({
    format: 'csv',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // today
    includeBreaks: true,
    includeOvertime: true,
    groupBy: 'day'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExport(config);
  };

  const updateConfig = (updates: Partial<ExportConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Time Entries"
      description="Generate and download your time tracking data"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date Range */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Date Range</h4>
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Start Date"
              value={config.startDate}
              onChange={(e) => updateConfig({ startDate: e.target.value })}
              required
            />
            <Input
              type="date"
              label="End Date"
              value={config.endDate}
              onChange={(e) => updateConfig({ endDate: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Format Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Export Format</h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
              { value: 'pdf', label: 'PDF', description: 'Printable document' },
              { value: 'xlsx', label: 'Excel', description: 'Microsoft Excel' }
            ].map((format) => (
              <button
                key={format.value}
                type="button"
                onClick={() => updateConfig({ format: format.value as ExportFormat })}
                className={cn(
                  'p-3 rounded-lg border text-left transition-colors',
                  config.format === format.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="font-medium text-sm">{format.label}</div>
                <div className="text-xs text-gray-500">{format.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Group By */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Group By</h4>
          <div className="flex space-x-3">
            {[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' }
            ].map((group) => (
              <button
                key={group.value}
                type="button"
                onClick={() => updateConfig({ groupBy: group.value as 'day' | 'week' | 'month' })}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  config.groupBy === group.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Include</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.includeBreaks}
                onChange={(e) => updateConfig({ includeBreaks: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Break time details</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.includeOvertime}
                onChange={(e) => updateConfig({ includeOvertime: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Overtime calculations</span>
            </label>
          </div>
        </div>

        {/* Preview Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-900 mb-2">Export Preview</h5>
          <div className="text-xs text-gray-600 space-y-1">
            <div>
              <span className="font-medium">Period:</span> {config.startDate} to {config.endDate}
            </div>
            <div>
              <span className="font-medium">Format:</span> {config.format.toUpperCase()}
            </div>
            <div>
              <span className="font-medium">Grouping:</span> By {config.groupBy}
            </div>
          </div>
        </div>
      </form>

      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          loading={loading}
          disabled={loading}
        >
          Generate Export
        </Button>
      </ModalFooter>
    </Modal>
  );
};

interface ScheduledExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (config: ScheduledExportConfig) => void;
  loading?: boolean;
}

export interface ScheduledExportConfig {
  name: string;
  format: ExportFormat;
  frequency: ExportFrequency;
  scheduleTime: string;
  emailRecipients: string[];
  dateRangeDays: number;
  isActive: boolean;
}

export const ScheduledExportDialog: React.FC<ScheduledExportDialogProps> = ({
  isOpen,
  onClose,
  onSchedule,
  loading = false
}) => {
  const [config, setConfig] = React.useState<ScheduledExportConfig>({
    name: '',
    format: 'csv',
    frequency: 'weekly',
    scheduleTime: '09:00',
    emailRecipients: [],
    dateRangeDays: 7,
    isActive: true
  });

  const [emailInput, setEmailInput] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.name.trim()) return;
    onSchedule(config);
  };

  const updateConfig = (updates: Partial<ScheduledExportConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (email && !config.emailRecipients.includes(email)) {
      updateConfig({ emailRecipients: [...config.emailRecipients, email] });
      setEmailInput('');
    }
  };

  const removeEmail = (email: string) => {
    updateConfig({
      emailRecipients: config.emailRecipients.filter(e => e !== email)
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Automatic Export"
      description="Set up recurring exports to be sent via email"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <Input
            label="Export Name"
            value={config.name}
            onChange={(e) => updateConfig({ name: e.target.value })}
            placeholder="Weekly Timesheet"
            required
          />
        </div>

        {/* Format and Frequency */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-900">Format</label>
            <select
              value={config.format}
              onChange={(e) => updateConfig({ format: e.target.value as ExportFormat })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="csv">CSV</option>
              <option value="pdf">PDF</option>
              <option value="xlsx">Excel</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-900">Frequency</label>
            <select
              value={config.frequency}
              onChange={(e) => updateConfig({ frequency: e.target.value as ExportFrequency })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {/* Schedule Time */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            type="time"
            label="Schedule Time"
            value={config.scheduleTime}
            onChange={(e) => updateConfig({ scheduleTime: e.target.value })}
          />

          <Input
            type="number"
            label="Date Range (days)"
            value={config.dateRangeDays}
            onChange={(e) => updateConfig({ dateRangeDays: parseInt(e.target.value) })}
            min="1"
            max="365"
          />
        </div>

        {/* Email Recipients */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-900">Email Recipients</label>
          <div className="flex space-x-2">
            <Input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1"
            />
            <Button type="button" onClick={addEmail} variant="outline">
              Add
            </Button>
          </div>

          {config.emailRecipients.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {config.emailRecipients.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmail(email)}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Active Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={config.isActive}
            onChange={(e) => updateConfig({ isActive: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Enable automatic export</span>
        </div>
      </form>

      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          loading={loading}
          disabled={loading || !config.name.trim()}
        >
          Schedule Export
        </Button>
      </ModalFooter>
    </Modal>
  );
};