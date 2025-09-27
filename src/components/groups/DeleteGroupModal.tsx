// T027: Group deletion confirmation modal in src/components/groups/DeleteGroupModal.tsx
// Feature: 006-group-creation-qr

'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, X, RefreshCw } from 'lucide-react';

interface DeleteGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  groupId: string;
  groupName: string;
  isDeleting?: boolean;
}

interface DeletionPreview {
  can_delete: boolean;
  impact_summary: {
    members_affected: number;
    time_entries_preserved: number;
    pending_invitations: number;
  };
  warnings: string[];
  restrictions?: string[];
}

export default function DeleteGroupModal({
  isOpen,
  onClose,
  onConfirm,
  groupId,
  groupName,
  isDeleting = false
}: DeleteGroupModalProps) {
  const [deletionPreview, setDeletionPreview] = useState<DeletionPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [notifyMembers, setNotifyMembers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && groupId) {
      loadDeletionPreview();
    }
  }, [isOpen, groupId]);

  const loadDeletionPreview = async () => {
    setIsLoadingPreview(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/groups/${groupId}/deletion-preview`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load deletion preview');
      }
      const data = await response.json();
      setDeletionPreview(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load deletion preview';
      setError(errorMessage);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleConfirm = () => {
    if (confirmationChecked && deletionPreview?.can_delete) {
      onConfirm();
    }
  };

  const handleClose = () => {
    setConfirmationChecked(false);
    setNotifyMembers(true);
    setError(null);
    setDeletionPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Delete Group</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={isDeleting}
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  You are about to permanently delete "{groupName}"
                </p>
                <p className="text-sm text-red-700 mt-1">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading deletion preview...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={loadDeletionPreview}
                className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          ) : deletionPreview ? (
            <div className="space-y-4">
              {/* Impact Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Deletion Impact</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Members affected:</span>
                    <span className="font-medium">{deletionPreview.impact_summary.members_affected}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time entries preserved:</span>
                    <span className="font-medium">{deletionPreview.impact_summary.time_entries_preserved}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending invitations:</span>
                    <span className="font-medium">{deletionPreview.impact_summary.pending_invitations}</span>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {deletionPreview.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">Important Notes</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {deletionPreview.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-1">"</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Restrictions */}
              {deletionPreview.restrictions && deletionPreview.restrictions.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-800 mb-2">Cannot Delete</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {deletionPreview.restrictions.map((restriction, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-600 mt-1">"</span>
                        <span>{restriction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Options */}
              {deletionPreview.can_delete && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="notify-members"
                      checked={notifyMembers}
                      onChange={(e) => setNotifyMembers(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="notify-members" className="text-sm text-gray-700">
                      Notify members about group deletion
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="confirm-deletion"
                      checked={confirmationChecked}
                      onChange={(e) => setConfirmationChecked(e.target.checked)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mt-0.5"
                    />
                    <label htmlFor="confirm-deletion" className="text-sm text-gray-700">
                      I understand that this action cannot be undone and want to delete "{groupName}" permanently.
                    </label>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!confirmationChecked || !deletionPreview?.can_delete || isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Group
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}