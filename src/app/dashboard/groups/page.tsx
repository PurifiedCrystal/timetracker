'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Users, Settings, QrCode, UserPlus, Crown, Trash2, UserMinus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import QRCodeInvite from '@/app/components/groups/QRCodeInvite';

interface Group {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'member';
  members: number;
  created_at?: string;
  description?: string;
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showQRInvite, setShowQRInvite] = useState<{groupId: string, groupName: string} | null>(null);
  const [showGroupManagement, setShowGroupManagement] = useState<Group | null>(null);
  const [showQRInModal, setShowQRInModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      // Try to load from API first
      try {
        const response = await fetch('/api/v1/groups');
        if (response.ok) {
          const data = await response.json();
          // Updated API response format
          const apiGroups = (data.data || data.groups || [])
            .filter((group: any) => !group.deleted_at) // Filter out soft-deleted groups
            .map((group: any) => ({
              id: group.id,
              name: group.name,
              role: group.role || group.group_memberships?.[0]?.role || 'admin', // Default to admin for created groups
              members: group.member_count || group.members_count || group._count_memberships || 1,
              description: group.description,
              created_at: group.created_at
            }));
          setGroups(apiGroups);
          return;
        }
      } catch (apiError) {
        console.warn('API failed, using localStorage:', apiError);
      }

      // Fallback to localStorage
      const savedGroups = localStorage.getItem('user_groups');
      if (savedGroups) {
        const parsedGroups = JSON.parse(savedGroups);
        // Filter out mock "Design Team" group
        const validGroups = parsedGroups.filter((group: any) => group.name !== 'Design Team');
        setGroups(validGroups);
        // Update localStorage to remove the mock data
        if (validGroups.length !== parsedGroups.length) {
          localStorage.setItem('user_groups', JSON.stringify(validGroups));
        }
      } else {
        // Initialize with empty groups if none exist
        setGroups([]);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;

    setCreating(true);
    try {
      // Try API first
      try {
        const response = await fetch('/api/v1/groups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newGroupName,
            description: newGroupDescription,
            max_members: null // No limit on members
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Reload groups to get the updated list
          await loadGroups();

          // Reset form
          setNewGroupName('');
          setNewGroupDescription('');
          setShowCreateForm(false);
          return;
        }
      } catch (apiError) {
        console.warn('API failed, using localStorage:', apiError);
      }

      // Fallback to localStorage - generate proper UUID
      const newGroup: Group = {
        id: crypto.randomUUID(),
        name: newGroupName,
        role: 'admin',
        members: 1,
        created_at: new Date().toISOString(),
        description: newGroupDescription
      };

      const updatedGroups = [newGroup, ...groups];
      setGroups(updatedGroups);
      localStorage.setItem('user_groups', JSON.stringify(updatedGroups));

      // Reset form
      setNewGroupName('');
      setNewGroupDescription('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setCreating(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirm_deletion: true
        }),
      });

      if (response.ok) {
        // Remove group from state
        setGroups(groups.filter(g => g.id !== groupId));
        setShowGroupManagement(null);
        return;
      }
    } catch (error) {
      console.error('Failed to delete group via API:', error);
    }

    // Fallback to localStorage
    const updatedGroups = groups.filter(g => g.id !== groupId);
    setGroups(updatedGroups);
    localStorage.setItem('user_groups', JSON.stringify(updatedGroups));
    setShowGroupManagement(null);
  };

  if (loading) {
    return (
      <div className="pb-20 max-w-md mx-auto lg:max-w-4xl lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 max-w-md mx-auto lg:max-w-4xl lg:px-8">
      {/* Back Navigation */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">My Groups</h1>
            <p className="text-gray-600">Manage your time tracking groups</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Group
          </button>
        </div>
      </div>

      {/* Create Group Form */}
      {showCreateForm && (
        <div className="mb-6 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Group</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Development Team"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the group..."
                rows={3}
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={createGroup}
                disabled={!newGroupName.trim() || creating}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {creating ? 'Creating...' : 'Create Group'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewGroupName('');
                  setNewGroupDescription('');
                }}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Invite Modal */}
      {showQRInvite && (
        <div className="mb-6">
          <QRCodeInvite
            groupId={showQRInvite.groupId}
            groupName={showQRInvite.groupName}
            onInvitationGenerated={(invitation) => {
              console.log('Invitation generated:', invitation);
            }}
          />
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowQRInvite(null)}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Group Management Modal Overlay */}
      {showGroupManagement && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowGroupManagement(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Manage "{showGroupManagement.name}"
              </h3>
              <button
                onClick={() => setShowGroupManagement(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Group Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Group Information</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-600">Name:</span> {showGroupManagement.name}</div>
                  {showGroupManagement.description && (
                    <div><span className="text-gray-600">Description:</span> {showGroupManagement.description}</div>
                  )}
                  <div><span className="text-gray-600">Members:</span> {showGroupManagement.members}</div>
                  <div><span className="text-gray-600">Your Role:</span>
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                      showGroupManagement.role === 'admin' || showGroupManagement.role === 'manager'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {showGroupManagement.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Member Management */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Member Management</h4>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors">
                    <UserPlus className="h-5 w-5 mr-2" />
                    View Members & Manage Access
                  </button>
                  {(showGroupManagement.role === 'admin' || showGroupManagement.role === 'manager') && (
                    <button
                      onClick={() => setShowQRInModal(true)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
                    >
                      <QrCode className="h-5 w-5 mr-2" />
                      Generate Invitation Link
                    </button>
                  )}
                </div>
              </div>

              {/* QR Code Section */}
              {showQRInModal && (showGroupManagement.role === 'admin' || showGroupManagement.role === 'manager') && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Invitation QR Code</h4>
                    <button
                      onClick={() => setShowQRInModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <QRCodeInvite
                      groupId={showGroupManagement.id}
                      groupName={showGroupManagement.name}
                      onInvitationGenerated={(invitation) => {
                        console.log('Invitation generated:', invitation);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              {(showGroupManagement.role === 'admin' || showGroupManagement.role === 'manager') && (
                <div>
                  <h4 className="font-medium text-red-900 mb-3">Danger Zone</h4>
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <p className="text-sm text-red-700 mb-3">
                      Once you delete a group, there is no going back. This will remove all members and cannot be undone.
                    </p>
                    <button
                      onClick={() => deleteGroup(showGroupManagement.id)}
                      className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Group
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="space-y-4">
        {groups.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Groups Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first group to start collaborating with your team
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Group
            </button>
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              onClick={() => setShowGroupManagement(group)}
              className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 mr-3">{group.name}</h3>
                    {(group.role === 'admin' || group.role === 'manager') && (
                      <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        <Crown className="h-3 w-3 mr-1" />
                        {group.role === 'admin' ? 'Admin' : 'Manager'}
                      </span>
                    )}
                  </div>
                  {group.description && (
                    <p className="text-gray-600 text-sm mb-3">{group.description}</p>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    {group.members} member{group.members !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}