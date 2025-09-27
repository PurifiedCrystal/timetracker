// T029: Update groups management page with QR and sharing features in src/app/dashboard/groups/[id]/page.tsx
// Feature: 006-group-creation-qr

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Settings, QrCode, Link, Trash2, Crown } from 'lucide-react';
import QRCodeGenerator from '@/components/groups/QRCodeGenerator';
import ShareableLinks from '@/components/groups/ShareableLinks';
import DeleteGroupModal from '@/components/groups/DeleteGroupModal';

interface GroupPageProps {
  params: { id: string };
}

interface GroupData {
  id: string;
  name: string;
  description?: string;
  role: 'admin' | 'member';
  members: number;
  created_at: string;
}

export default function GroupPage({ params }: GroupPageProps) {
  const router = useRouter();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'qr' | 'share' | 'settings'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGroup();
  }, [params.id]);

  const loadGroup = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/groups/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Group not found');
          return;
        }
        throw new Error('Failed to load group');
      }
      const data = await response.json();
      setGroup(data.group);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load group';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!group) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/v1/groups/${group.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirm_deletion: true,
          notify_members: true
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete group');
      }

      router.push('/dashboard/groups');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete group';
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'Group not found') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Group Not Found</h2>
          <p className="text-gray-600 mb-4">
            This group doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => router.push('/dashboard/groups')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-600">Failed to load group</p>
          <button
            onClick={loadGroup}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = group.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/dashboard/groups')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
              {isAdmin && <Crown className="h-5 w-5 text-yellow-500" />}
            </div>
            <p className="text-gray-600">{group.members} members</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Overview
                </div>
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => setActiveTab('qr')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'qr'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      QR Code
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('share')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'share'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Share Link
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'settings'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Settings
                    </div>
                  </button>
                </>
              )}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Group Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <p className="text-gray-900">{group.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Members</label>
                        <p className="text-gray-900">{group.members}</p>
                      </div>
                      {group.description && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Description</label>
                          <p className="text-gray-900">{group.description}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Your Role</label>
                        <p className="text-gray-900 capitalize">{group.role}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Created</label>
                        <p className="text-gray-900">{new Date(group.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'qr' && isAdmin && (
              <QRCodeGenerator
                groupId={group.id}
                groupName={group.name}
                onError={handleError}
              />
            )}

            {activeTab === 'share' && isAdmin && (
              <ShareableLinks
                groupId={group.id}
                groupName={group.name}
                onError={handleError}
              />
            )}

            {activeTab === 'settings' && isAdmin && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Danger Zone</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-red-800 font-medium">Delete Group</h4>
                        <p className="text-red-700 text-sm mt-1">
                          Permanently delete this group and all its data. This action cannot be undone.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="ml-4 flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Group
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteGroupModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteGroup}
        groupId={group.id}
        groupName={group.name}
        isDeleting={isDeleting}
      />
    </div>
  );
}