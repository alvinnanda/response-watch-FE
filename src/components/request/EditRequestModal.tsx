import { useState, useEffect } from 'react';
import { CreateRequestForm } from '../request/CreateRequestForm';
import { updateRequest } from '../../api/requests';
import { getGroups, type VendorGroup } from '../../api/groups';
import { getNotes } from '../../api/notes';
import type { Request } from '../../types/requests';
import type { Note } from '../../types/notes';
import { EditNoteModal } from '../note/EditNoteModal';
import { getNoteColor } from '../../constants/notes';
import moment from 'moment';

import type { InitialNoteData } from './CreateRequestForm';

interface EditRequestModalProps {
  request: Request;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditRequestModal({ request, isOpen, onClose, onSuccess }: EditRequestModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'notes'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Group Fetching
  const [groups, setGroups] = useState<VendorGroup[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isGroupsLoading, setIsGroupsLoading] = useState(false);

  // Linked Notes
  const [linkedNotes, setLinkedNotes] = useState<Note[]>([]);
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false);

  // Initial loads
  useEffect(() => {
    if (isOpen) {
      if (groups.length === 0) fetchGroups(1);
      fetchLinkedNotes();
    }
  }, [isOpen]);

  // Refresh notes when tab changes or note modal closes
  useEffect(() => {
     if (activeTab === 'notes' && !isEditNoteModalOpen) {
         fetchLinkedNotes();
     }
  }, [activeTab, isEditNoteModalOpen]);

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

  const fetchLinkedNotes = async () => {
      try {
          setIsNotesLoading(true);
          const response = await getNotes({ request_uuid: request.uuid, limit: 50 });
          setLinkedNotes(response.notes || []);
      } catch (err) {
          console.error("Failed to load linked notes", err);
      } finally {
          setIsNotesLoading(false);
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
    initialNote?: InitialNoteData // Match the interface
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
      await updateRequest(request.id, {
        title: data.title,
        description: data.description || undefined,
        followup_link: data.followupLink || undefined,
        embedded_pic_list: embeddedPicList,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = () => {
      setEditingNote(null); // Create new
      setIsEditNoteModalOpen(true);
  };

  const handleEditNote = (note: Note) => {
      setEditingNote(note);
      setIsEditNoteModalOpen(true);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header with Tabs */}
        <div className="flex-shrink-0 px-6 pt-6 pb-0 bg-white border-b border-gray-100 z-10">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Manage Request</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                </button>
            </div>
            
            <div className="flex gap-6">
                <button 
                    onClick={() => setActiveTab('details')}
                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'details' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Request Details
                    {activeTab === 'details' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
                </button>
                <button 
                    onClick={() => setActiveTab('notes')}
                    className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'notes' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Notes & Updates
                    {linkedNotes?.length > 0 && <span className="ml-2 bg-gray-100 text-gray-600 text-xs py-0.5 px-2 rounded-full">{linkedNotes.length}</span>}
                     {activeTab === 'notes' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />}
                </button>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50/50">
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {activeTab === 'details' ? (
              <CreateRequestForm
                initialValues={{
                title: request.title,
                description: request.description,
                followupLink: request.followup_link || '',
                }}
                onSubmit={handleSubmit}
                onCancel={onClose}
                isLoading={isLoading}
                vendorGroups={groupOptions}
                onLoadMoreGroups={loadMoreGroups}
                hasMoreGroups={hasMore}
                isLoadingGroups={isGroupsLoading}
            />
          ) : (
             <div className="space-y-4 animate-fade-in">
                 {/* Empty State */}
                 {linkedNotes?.length === 0 && !isNotesLoading ? (
                     <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                         <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                             <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                             </svg>
                         </div>
                         <h3 className="text-sm font-medium text-gray-900">No notes yet</h3>
                         <p className="text-sm text-gray-500 mt-1 mb-4">Add internal notes or updates to this request.</p>
                         <button 
                            onClick={handleCreateNote}
                            className="px-4 py-2 bg-white border border-gray-200 hover:border-primary hover:text-primary text-gray-700 rounded-lg text-sm font-medium transition-all shadow-sm"
                         >
                             Add First Note
                         </button>
                     </div>
                 ) : (
                     <div className="space-y-3">
                         <div className="flex justify-between items-center mb-2">
                             <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Internal Notes</h3>
                             <button onClick={handleCreateNote} className="text-primary text-sm font-medium hover:underline">+ Add Note</button>
                         </div>
                         
                         {linkedNotes?.map(note => (
                             <div 
                                key={note.id} 
                                onClick={() => handleEditNote(note)}
                                className={`p-4 rounded-xl border border-transparent shadow-sm hover:shadow-md cursor-pointer transition-all bg-white relative group ${getNoteColor(note.background_color).class} ${getNoteColor(note.background_color).border}`}
                             >
                                 <div className="flex justify-between items-start mb-1">
                                     <h4 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{note.title}</h4>
                                     <span className="text-xs text-gray-400 whitespace-nowrap">{moment(note.updated_at).fromNow()}</span>
                                 </div>
                                 {note.tagline && <p className="text-xs text-gray-500 font-medium mb-2">{note.tagline}</p>}
                                 <div className="text-sm text-gray-600 line-clamp-2" dangerouslySetInnerHTML={{ __html: note.content }} />
                             </div>
                         ))}
                     </div>
                 )}
             </div>
          )}
        </div>
      </div>
      
      {/* Nested Modal for Notes */}
      <EditNoteModal
        isOpen={isEditNoteModalOpen}
        onClose={() => setIsEditNoteModalOpen(false)}
        note={editingNote}
        requestUUID={request.uuid}
        onSuccess={() => {
            fetchLinkedNotes();
            // Don't close parent modal
        }}
      />
    </div>
  );
}
