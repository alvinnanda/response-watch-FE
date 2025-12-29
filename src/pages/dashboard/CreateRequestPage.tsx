import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateRequestForm } from '../../components/request/CreateRequestForm';
import { createRequest } from '../../api/requests';
import { getGroups, type VendorGroup } from '../../api/groups';

import type { InitialNoteData } from '../../components/request/CreateRequestForm';

export function CreateRequestPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Group Fetching Implementation
  const [groups, setGroups] = useState<VendorGroup[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isGroupsLoading, setIsGroupsLoading] = useState(false);

  const fetchGroups = useCallback(async (currentPage: number) => {
    try {
      setIsGroupsLoading(true);
      const response = await getGroups(currentPage, 10); // Limit 10
      const newGroups = response.vendor_groups;
      
      setGroups(prev => currentPage === 1 ? newGroups : [...prev, ...newGroups]);
      setHasMore(currentPage < response.pagination.total_pages);
    } catch (err) {
      console.error('Failed to load groups', err);
    } finally {
      setIsGroupsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups(1);
  }, [fetchGroups]);

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

  const handleSubmit = async (data: { 
      title: string; 
      description: string; 
      followupLink: string; 
      vendorGroupId?: string; 
      initialNote?: InitialNoteData
  }) => {
    setIsLoading(true);
    setError('');
    
    let embeddedPicList: string[] | undefined;
    if (data.vendorGroupId) {
      const selectedGroup = groups.find(g => g.id === data.vendorGroupId);
      if (selectedGroup) {
        embeddedPicList = selectedGroup.pic_names;
      }
    }

    try {
      const newRequest = await createRequest({
        title: data.title,
        description: data.description || undefined,
        followup_link: data.followupLink || undefined,
        embedded_pic_list: embeddedPicList,
      });

      // Chain Creation: If initial note exists, create it
      if (data.initialNote && newRequest.uuid) {
          try {
              // We need to import createNote first. I'll assume it's imported or I will add the import.
              await import('../../api/notes').then(mod => mod.createNote({
                  title: data.initialNote!.title,
                  content: data.initialNote!.content,
                  tagline: data.initialNote!.tagline,
                  background_color: data.initialNote!.background_color,
                  is_reminder: false,
                  request_uuid: newRequest.uuid
              }));
          } catch (noteErr) {
              console.error("Failed to create initial note", noteErr);
          }
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
          Create New Request
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate a tracking link for your vendor
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <CreateRequestForm 
        onSubmit={handleSubmit}
        onCancel={() => navigate('/dashboard')}
        isLoading={isLoading}
        // Group Props
        vendorGroups={groupOptions}
        onLoadMoreGroups={loadMoreGroups}
        hasMoreGroups={hasMore}
        isLoadingGroups={isGroupsLoading}
      />
    </div>
  );
}
