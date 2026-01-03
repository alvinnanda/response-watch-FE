
import { useState } from 'react';
import { Button, Input, Card } from '../ui';
import { InfiniteSelect } from '../ui/InfiniteSelect';
import { type NoteEditorData } from '../note/NoteEditor';
import { RichTextEditor } from '../ui/RichTextEditor';
import { EditNoteModal } from '../note/EditNoteModal';

interface VendorGroupOption {
  value: string;
  label: string;
  subLabel?: string;
  picNames?: string[];
}

// Re-export this for CreateRequestPage
export type { NoteEditorData as InitialNoteData };


interface CreateRequestFormProps {
  onSubmit: (data: { 
      title: string; 
      description: string; 
      followupLink: string; 
      vendorGroupId?: string; 
      specificPic?: string;
      initialNote?: NoteEditorData;
      isDescriptionSecure?: boolean;
      descriptionPin?: string;
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
  hideInitialNote?: boolean;
}

export function CreateRequestForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false,
  vendorGroups,
  onLoadMoreGroups,
  hasMoreGroups = false,
  isLoadingGroups = false,
  initialValues,
  hideInitialNote = false
}: CreateRequestFormProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'note'>('details');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  
  // Request State
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [followupLink, setFollowupLink] = useState(initialValues?.followupLink || '');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Assignment State
  const [assignmentMode, setAssignmentMode] = useState<'group' | 'pic'>('group');
  const [selectedGroupId, setSelectedGroupId] = useState(initialValues?.vendorGroupId || '');
  const [selectedPic, setSelectedPic] = useState('');

  // Note State using Editor Data
  const [noteData, setNoteData] = useState<NoteEditorData>({
      title: '',
      content: '',
      tagline: '',
      background_color: 'white'
  });

  // Security State
  const [isDescriptionSecure, setIsDescriptionSecure] = useState(false);
  const [descriptionPin, setDescriptionPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate PIN if secure description is enabled
    if (isDescriptionSecure) {
      if (!descriptionPin || descriptionPin.length < 4) {
        setPinError('PIN harus minimal 4 digit');
        return;
      }
      if (descriptionPin !== confirmPin) {
        setPinError('PIN tidak cocok');
        return;
      }
    }
    setPinError('');
    
    // Only pass note data if content exists and feature is enabled
    const initialNoteData: NoteEditorData | undefined = 
      (!hideInitialNote && noteData.content.trim()) ? noteData : undefined;

    await onSubmit({ 
      title, 
      description, 
      followupLink,
      vendorGroupId: selectedGroupId || undefined,
      specificPic: (assignmentMode === 'pic' && selectedPic) ? selectedPic : undefined,
      initialNote: initialNoteData,
      isDescriptionSecure: isDescriptionSecure || undefined,
      descriptionPin: (isDescriptionSecure && descriptionPin) ? descriptionPin : undefined,
    });
  };

  const selectedGroup = vendorGroups?.find(g => g.value === selectedGroupId);
  const picOptions = selectedGroup?.picNames?.map(name => ({ value: name, label: name })) || [];

  return (
    <>
    <Card padding="none" className="overflow-hidden">
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Header Tabs */}
        {!hideInitialNote && (
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
                    Note & Pengingat
                    {noteData.content && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                </button>
            </div>
        )}

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
                            <div className="h-[300px]">
                                <RichTextEditor
                                    value={description}
                                    onChange={setDescription}
                                    placeholder="Additional details about the issue..."
                                    className="h-full border-gray-300 shadow-sm"
                                />
                            </div>
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
                            <div className="w-full space-y-3">
                                <div className="flex gap-4 mb-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="assignmentMode" 
                                            value="group" 
                                            checked={assignmentMode === 'group'}
                                            onChange={() => setAssignmentMode('group')}
                                            className="accent-black h-4 w-4" 
                                        />
                                        Assign to Group
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                                        <input 
                                            type="radio" 
                                            name="assignmentMode" 
                                            value="pic" 
                                            checked={assignmentMode === 'pic'}
                                            onChange={() => setAssignmentMode('pic')}
                                            className="accent-black h-4 w-4" 
                                        />
                                        Assign to PIC
                                    </label>
                                </div>

                                <InfiniteSelect
                                    label="Select Group"
                                    placeholder="Select a vendor group..."
                                    options={vendorGroups || []}
                                    value={selectedGroupId}
                                    onChange={(val) => {
                                        setSelectedGroupId(val);
                                        setSelectedPic(''); // Reset PIC when group changes
                                    }}
                                    onLoadMore={onLoadMoreGroups}
                                    hasMore={hasMoreGroups}
                                    isLoading={isLoadingGroups}
                                />

                                {assignmentMode === 'pic' && selectedGroupId && (
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Select PIC
                                        </label>
                                        <select
                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                            value={selectedPic}
                                            onChange={(e) => setSelectedPic(e.target.value)}
                                        >
                                            <option value="">Select a PIC...</option>
                                            {picOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                        {picOptions.length === 0 && (
                                            <p className="text-xs text-amber-600 mt-1">This group has no PICs listed.</p>
                                        )}
                                    </div>
                                )}

                                <p className="text-xs text-gray-500 mt-1">
                                    {assignmentMode === 'group' 
                                        ? "Request will be visible to all members of the group." 
                                        : "Request will be assigned directly to the selected PIC."}
                                </p>
                            </div>
                            )}

                            {/* Secure Description Toggle */}
                            <div className="pt-4 border-t border-gray-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                  </svg>
                                  <label className="text-sm font-medium text-gray-700">
                                    Deskripsi Aman (PIN)
                                  </label>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsDescriptionSecure(!isDescriptionSecure);
                                    if (!isDescriptionSecure) {
                                      setDescriptionPin('');
                                      setConfirmPin('');
                                      setPinError('');
                                    }
                                  }}
                                  className={`relative w-11 h-6 rounded-full transition-colors ${
                                    isDescriptionSecure ? 'bg-primary' : 'bg-gray-200'
                                  }`}
                                >
                                  <span
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                      isDescriptionSecure ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 ml-6">
                                Aktifkan untuk memproteksi deskripsi dengan PIN
                              </p>

                              {isDescriptionSecure && (
                                <div className="mt-4 space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">PIN (minimal 4 digit)</label>
                                    <input
                                      type="password"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      maxLength={6}
                                      value={descriptionPin}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setDescriptionPin(val);
                                        setPinError('');
                                      }}
                                      placeholder="••••"
                                      className="w-full px-3 py-2 text-center text-lg tracking-widest font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Konfirmasi PIN</label>
                                    <input
                                      type="password"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      maxLength={6}
                                      value={confirmPin}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        setConfirmPin(val);
                                        setPinError('');
                                      }}
                                      placeholder="••••"
                                      className="w-full px-3 py-2 text-center text-lg tracking-widest font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                  </div>
                                  {pinError && (
                                    <p className="text-xs text-red-500">{pinError}</p>
                                  )}
                                  <p className="text-xs text-amber-600 flex items-start gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                                      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
                                      <path d="M12 9v4"/>
                                      <path d="M12 17h.01"/>
                                    </svg>
                                    PIN tidak dapat dipulihkan. Simpan dengan aman!
                                  </p>
                                </div>
                              )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="min-h-[400px] flex items-start justify-center p-4">
                    {!noteData.content ? (
                         <div className="text-center w-full max-w-md mt-10 p-8 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 transition-colors">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Add Initial Note</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Add a note to start this request with context, instructions, or initial findings.
                            </p>
                            <Button
                                type="button"
                                onClick={() => setIsNoteModalOpen(true)}
                                variant="outline"
                            >
                                <span className="mr-2">+</span> Add Note
                            </Button>
                        </div>
                    ) : (
                        <div className="w-full max-w-2xl bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2">
                             <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <h4 className="font-semibold text-gray-900 truncate pr-4">
                                    {noteData.title || 'Untitled Note'}
                                </h4>
                                <div className="flex items-center gap-2">
                                     <button
                                        type="button"
                                        onClick={() => setIsNoteModalOpen(true)}
                                        className="p-2 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                        title="Edit"
                                     >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNoteData({ title: '', content: '', background_color: 'white' })}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                             </div>
                             <div className="p-4 bg-white prose prose-sm max-w-none text-gray-600 line-clamp-4">
                                <div dangerouslySetInnerHTML={{ __html: noteData.content }} />
                             </div>
                             {noteData.tagline && (
                                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 italic">
                                    "{noteData.tagline}"
                                </div>
                             )}
                        </div>
                    )}
                    
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
            disabled={assignmentMode === 'pic' && !selectedPic || !title}
          >
            Generate Link
          </Button>
        </div>
      </form>
    </Card>

    <EditNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSuccess={() => {/* Handled by onSave */}}
        initialData={noteData.content ? noteData : undefined}
        onSave={(data) => {
             setNoteData(data);
             setIsNoteModalOpen(false);
        }}
        note={null} 
    />
    </>
  );
}
