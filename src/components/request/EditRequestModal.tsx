import { useState, useEffect } from 'react';
import { CreateRequestForm } from '../request/CreateRequestForm';
import { updateRequest } from '../../api/requests';
import { getGroups, type VendorGroup } from '../../api/groups';
import type { Request } from '../../types/requests';

interface EditRequestModalProps {
  request: Request;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditRequestModal({ request, isOpen, onClose, onSuccess }: EditRequestModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Group Fetching (Reuse logic from CreatePage or abstract hook later)
  const [groups, setGroups] = useState<VendorGroup[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isGroupsLoading, setIsGroupsLoading] = useState(false);

  // Initial group load
  useEffect(() => {
    if (isOpen && groups.length === 0) {
      fetchGroups(1);
    }
  }, [isOpen]);

  const fetchGroups = async (currentPage: number) => {
    try {
      setIsGroupsLoading(true);
      const response = await getGroups(currentPage, 10);
      const newGroups = response.vendor_groups;
      
      setGroups(prev => currentPage === 1 ? newGroups : [...prev, ...newGroups]);
      setHasMore(currentPage < response.pagination.total_pages);
    } catch (err) {
      console.error('Failed to load groups', err);
    } finally {
      setIsGroupsLoading(false);
    }
  };

  const loadMoreGroups = () => {
    if (!isGroupsLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchGroups(nextPage);
    }
  };

  const groupOptions = groups.map(g => ({
    value: g.id,
    label: g.group_name,
    subLabel: `${g.pic_names.length} PICs`
  }));

  const handleSubmit = async (data: { title: string; description: string; followupLink: string; vendorGroupId?: string }) => {
    setIsLoading(true);
    setError('');

    let embeddedPicList: string[] | undefined;
    
    // Only update pic list if a *new* group is selected. 
    // If user doesn't touch group, we might keep existing? 
    // But CreateRequestForm has "optional" group. 
    // Complexity: We don't know the original group ID of the request (it's not stored, only embedded_pic_list).
    // Strategy: If user selects a group, OVERWRITE existing embedded_pic_list.
    if (data.vendorGroupId) {
       const selectedGroup = groups.find(g => g.id === data.vendorGroupId);
       if (selectedGroup) {
         embeddedPicList = selectedGroup.pic_names;
       }
    }

    try {
      await updateRequest(request.id, {
        title: data.title,
        description: data.description || undefined,
        followup_link: data.followupLink || undefined,
        embedded_pic_list: embeddedPicList, // Only sends if defined
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update request');
      // Don't close on error
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Edit Request</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <CreateRequestForm
            initialValues={{
              title: request.title,
              description: request.description,
              followupLink: request.followup_link || '',
              // We don't pre-fill group ID because we don't persist it. 
              // User has to re-select if they want to change group.
            }}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={isLoading}
            vendorGroups={groupOptions}
            onLoadMoreGroups={loadMoreGroups}
            hasMoreGroups={hasMore}
            isLoadingGroups={isGroupsLoading}
          />
        </div>
      </div>
    </div>
  );
}
