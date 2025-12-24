import { useState } from 'react';
import { Button, Input, Card } from '../ui';
import { createGroup } from '../../api/groups';

interface CreateGroupModalProps {
  onCheck: () => void;
  onCancel: () => void;
}

export function CreateGroupModal({ onCheck, onCancel }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [picNames, setPicNames] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddPic = () => {
    setPicNames([...picNames, '']);
  };

  const handlePicChange = (index: number, value: string) => {
    const newPics = [...picNames];
    newPics[index] = value;
    setPicNames(newPics);
  };

  const handleRemovePic = (index: number) => {
    if (picNames.length === 1) return;
    const newPics = picNames.filter((_, i) => i !== index);
    setPicNames(newPics);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName) return;

    // Filter empty pics
    const validPics = picNames.filter(name => name.trim() !== '');
    if (validPics.length === 0) {
      setError('At least one PIC name is required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await createGroup({ 
        group_name: groupName, 
        pic_names: validPics 
      });
      onCheck(); // Refresh list / Close modal
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md" padding="lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Create Vendor Group</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Group Name"
            placeholder="e.g. Network Team"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Person In Charge (PIC) Names
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {picNames.map((pic, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`PIC Name #${index + 1}`}
                    value={pic}
                    onChange={(e) => handlePicChange(index, e.target.value)}
                    className="flex-1"
                  />
                  {picNames.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePic(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                      title="Remove PIC"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddPic}
              className="mt-2 w-full border-dashed border-gray-300 text-gray-500 hover:text-primary hover:border-primary"
            >
              + Add Another PIC
            </Button>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onCancel}
            >
              Cancel
            </Button>
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
    </div>
  );
}
