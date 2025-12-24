import { useState } from 'react';
import { Button, Input, Card } from '../ui';

interface CreateVendorGroupFormProps {
  onSubmit: (data: { groupName: string; picNames: string[] }) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function CreateVendorGroupForm({ onSubmit, onCancel, isLoading = false }: CreateVendorGroupFormProps) {
  const [groupName, setGroupName] = useState('');
  const [picNames, setPicNames] = useState<string[]>(['']);

  const handleAddPic = () => {
    setPicNames([...picNames, '']);
  };

  const handleRemovePic = (index: number) => {
    const newPicNames = picNames.filter((_, i) => i !== index);
    setPicNames(newPicNames);
  };

  const handlePicChange = (index: number, value: string) => {
    const newPicNames = [...picNames];
    newPicNames[index] = value;
    setPicNames(newPicNames);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty names
    const filteredPics = picNames.filter(name => name.trim() !== '');
    if (filteredPics.length === 0) {
      alert('Please add at least one PIC');
      return;
    }
    await onSubmit({ groupName, picNames: filteredPics });
  };

  return (
    <Card padding="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Group Details</h3>
          <Input
            label="Group Name"
            placeholder="e.g., Network Team, Database Admins"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              PIC Members (Person In Charge)
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddPic}
              className="text-xs"
            >
              + Add Member
            </Button>
          </div>
          
          <div className="space-y-3">
            {picNames.map((name, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder={`Member Name #${index + 1}`}
                    value={name}
                    onChange={(e) => handlePicChange(index, e.target.value)}
                    required={index === 0} // Only first one is strictly required by HTML validation
                  />
                </div>
                {picNames.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRemovePic(index)}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            These names will be available for selection by the vendor when they start the task.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
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
            Create Group
          </Button>
        </div>
      </form>
    </Card>
  );
}
