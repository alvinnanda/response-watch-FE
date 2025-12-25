import { useState } from 'react';
import { Button, Input, Card } from '../ui';
import { InfiniteSelect } from '../ui/InfiniteSelect';

interface VendorGroupOption {
  value: string;
  label: string;
  subLabel?: string;
}

interface CreateRequestFormProps {
  onSubmit: (data: { title: string; description: string; followupLink: string; vendorGroupId?: string }) => Promise<void>;
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
    vendorGroupId?: string; // Note: In update mode, we might not have group ID easily unless stored
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
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [followupLink, setFollowupLink] = useState(initialValues?.followupLink || '');
  const [selectedGroupId, setSelectedGroupId] = useState(initialValues?.vendorGroupId || '');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ 
      title, 
      description, 
      followupLink,
      vendorGroupId: selectedGroupId || undefined
    });
  };

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Judul"
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

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
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
            Generate Link
          </Button>
        </div>
      </form>
    </Card>
  );
}
