
import { useState } from 'react';
import { Button, Input, Card } from '../ui';
import { InfiniteSelect } from '../ui/InfiniteSelect';
import { NoteEditor, type NoteEditorData } from '../note/NoteEditor';

interface VendorGroupOption {
  value: string;
  label: string;
  subLabel?: string;
}

// Re-export this for CreateRequestPage
export type { NoteEditorData as InitialNoteData };

interface CreateRequestFormProps {
  onSubmit: (data: { 
      title: string; 
      description: string; 
      followupLink: string; 
      vendorGroupId?: string; 
      initialNote?: NoteEditorData 
  }) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  // Vendor Group Fetching Props
  vendorGroups?: VendorGroupOption[];
  onLoadMoreGroups?: () => void;
  hasMoreGroups?: boolean;
  isLoadingGroups?: boolean;
  initialValues?: {
    title: string;
    description?: string;
    followupLink?: string;
    vendorGroupId?: string; 
  };
}

export function CreateRequestForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false,
  vendorGroups,
  onLoadMoreGroups,
  hasMoreGroups = false,
  isLoadingGroups = false,
  initialValues
}: CreateRequestFormProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'note'>('details');
  
  // Request State
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [followupLink, setFollowupLink] = useState(initialValues?.followupLink || '');
  const [selectedGroupId, setSelectedGroupId] = useState(initialValues?.vendorGroupId || '');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Note State using Editor Data
  const [noteData, setNoteData] = useState<NoteEditorData>({
      title: '',
      content: '',
      tagline: '',
      background_color: 'white'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only pass note data if content exists
    const initialNoteData: NoteEditorData | undefined = noteData.content.trim() ? noteData : undefined;

    await onSubmit({ 
      title, 
      description, 
      followupLink,
      vendorGroupId: selectedGroupId || undefined,
      initialNote: initialNoteData
    });
  };

  return (
    <Card padding="none" className="overflow-hidden">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Header Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/50">
            <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
                    activeTab === 'details' 
                    ? 'border-primary text-primary bg-white' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
                Request Details
            </button>
            <button
                type="button"
                onClick={() => setActiveTab('note')}
                className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'note' 
                    ? 'border-primary text-primary bg-white' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
            >
                Initial Note
                {noteData.content && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
            </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
            {activeTab === 'details' ? (
                <div className="space-y-5 animate-in fade-in duration-200">
                    <Input
                        label="Judul Request"
                        placeholder="e.g., Server Down Issue"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    
                    <div className="w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Deskripsi (Optional)
                        </label>
                        <textarea
                            placeholder="Additional details about the issue..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            className="
                            w-full px-3 py-2
                            text-gray-800 placeholder-gray-400
                            bg-white border border-gray-300 rounded-md
                            transition-colors duration-150
                            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                            resize-none
                            "
                        />
                    </div>

                    <div className="flex">
                        <button
                            type="button"
                            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                            className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors focus:outline-none"
                        >
                            {isAdvancedOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polyline points="18 15 12 9 6 15"></polyline></svg>
                            ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            )}
                            More Options
                        </button>
                    </div>

                    {isAdvancedOpen && (
                        <div className="space-y-5 pl-2 border-l-2 border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
                            <Input
                            label="Followup Link (Optional)"
                            placeholder="e.g. Jira Ticket, Asana Task, Docs URL..."
                            value={followupLink}
                            onChange={(e) => setFollowupLink(e.target.value)}
                            helperText="Add a link to your project management tool for tracking."
                            />

                            {onLoadMoreGroups && (
                            <div className="w-full">
                                <InfiniteSelect
                                label="Group (Optional)"
                                placeholder="Select a vendor group..."
                                options={vendorGroups || []}
                                value={selectedGroupId}
                                onChange={setSelectedGroupId}
                                onLoadMore={onLoadMoreGroups}
                                hasMore={hasMoreGroups}
                                isLoading={isLoadingGroups}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                Jika dipilih, link akan memungkinkan vendor memilih nama mereka dari grup ini.
                                </p>
                            </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-[400px]">
                    <NoteEditor 
                        initialData={noteData}
                        onChange={setNoteData}
                        hideReminder={true} // Hide reminder options for initial creation
                        className="h-full border-gray-200 shadow-sm"
                    />
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            fullWidth 
            isLoading={isLoading}
          >
            {activeTab === 'note' && !title ? 'Isi Judul Request Dulu' : 'Generate Link'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
