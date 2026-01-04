import { useState } from 'react';
import { Button, Input, Card } from '../ui';
import { updateGroup, type PIC, type VendorGroup } from '../../api/groups';
import { formatPhoneNumber, getPhonePlaceholder } from '../../utils/phone';

interface EditGroupModalProps {
  group: VendorGroup;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditGroupModal({ group, onSuccess, onCancel }: EditGroupModalProps) {
  const [groupName, setGroupName] = useState(group.group_name);
  const [vendorPhone, setVendorPhone] = useState(group.vendor_phone || '');
  const [pics, setPics] = useState<PIC[]>(() => {
    // Initialize from pics or fallback to pic_names for backward compatibility
    if (group.pics && group.pics.length > 0) {
      return group.pics;
    }
    if (group.pic_names && group.pic_names.length > 0) {
      return group.pic_names.map(name => ({ name, phone: '' }));
    }
    return [{ name: '', phone: '' }];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddPic = () => {
    setPics([...pics, { name: '', phone: '' }]);
  };

  const handlePicChange = (index: number, field: keyof PIC, value: string) => {
    const newPics = [...pics];
    newPics[index] = { ...newPics[index], [field]: value };
    setPics(newPics);
  };

  const handleRemovePic = (index: number) => {
    if (pics.length === 1) return;
    const newPics = pics.filter((_, i) => i !== index);
    setPics(newPics);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName) return;

    // Filter empty pics (must have at least name) and format phone numbers
    const validPics = pics
      .filter(pic => pic.name.trim() !== '')
      .map(pic => ({
        name: pic.name.trim(),
        phone: pic.phone ? formatPhoneNumber(pic.phone) : undefined
      }));
      
    if (validPics.length === 0) {
      setError('At least one PIC name is required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await updateGroup(group.id, { 
        group_name: groupName, 
        vendor_phone: vendorPhone ? formatPhoneNumber(vendorPhone) : undefined,
        pics: validPics
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md" padding="lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit Vendor Group</h2>
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

          <Input
            label="Group Phone (Optional)"
            placeholder={getPhonePlaceholder()}
            value={vendorPhone}
            onChange={(e) => setVendorPhone(e.target.value)}
            onBlur={() => vendorPhone && setVendorPhone(formatPhoneNumber(vendorPhone))}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Person In Charge (PIC)
            </label>
            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {pics.map((pic, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder={`PIC Name #${index + 1}`}
                      value={pic.name}
                      onChange={(e) => handlePicChange(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    {pics.length > 1 && (
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
                  <Input
                    placeholder={getPhonePlaceholder()}
                    value={pic.phone || ''}
                    onChange={(e) => handlePicChange(index, 'phone', e.target.value)}
                    onBlur={() => pic.phone && handlePicChange(index, 'phone', formatPhoneNumber(pic.phone))}
                  />
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
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
