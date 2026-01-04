import { useState, useEffect, useCallback } from 'react';
import { Button, Card } from '../../components/ui';
import { getGroups, deleteGroup, type VendorGroup, type GroupPagination } from '../../api/groups';
import { CreateGroupModal } from '../../components/group/CreateGroupModal';
import { EditGroupModal } from '../../components/group/EditGroupModal';
import moment from 'moment';

export function GroupsPage() {
  const [groups, setGroups] = useState<VendorGroup[]>([]);
  const [pagination, setPagination] = useState<GroupPagination>({ page: 1, limit: 10, total: 0, total_pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<VendorGroup | null>(null);

  const fetchGroups = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      setError('');
      const response = await getGroups(page);
      setGroups(response.vendor_groups);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to load groups');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      await deleteGroup(id);
      fetchGroups(pagination.page);
    } catch (err) {
      alert('Failed to delete group');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Groups</h1>
          <p className="text-sm text-gray-500 mt-1">Manage vendor teams and their PICs</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + New Group
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <Card padding="none" className="overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          {isLoading ? (
             <div className="flex items-center justify-center py-12">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
             </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Group Name</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">PIC Count</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groups.length > 0 ? (
                  groups.map((group) => (
                    <tr key={group.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{group.group_name}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {group.pic_names.slice(0, 3).map((pic, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {pic}
                            </span>
                          ))}
                          {group.pic_names.length > 3 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                              +{group.pic_names.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {group.pic_names.length} PICs
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {moment(group.created_at).format('MMM DD, YYYY')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => setEditingGroup(group)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDelete(group.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                       No vendor groups found. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => fetchGroups(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.total_pages}
                onClick={() => fetchGroups(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {showCreateModal && (
        <CreateGroupModal
          onCheck={() => {
            setShowCreateModal(false);
            fetchGroups(1);
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {editingGroup && (
        <EditGroupModal
          group={editingGroup}
          onSuccess={() => {
            setEditingGroup(null);
            fetchGroups(pagination.page);
          }}
          onCancel={() => setEditingGroup(null)}
        />
      )}
    </div>
  );
}
