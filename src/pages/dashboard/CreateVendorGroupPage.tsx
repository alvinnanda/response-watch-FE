import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateVendorGroupForm } from '../../components/vendor/CreateVendorGroupForm';

export function CreateVendorGroupPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: { groupName: string; picNames: string[] }) => {
    setIsLoading(true);
    // TODO: Implement create vendor group logic (API call)
    console.log('Creating vendor group:', data);
    
    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard'); // Or back to list
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
          Create Vendor Group
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Define a team and its members (PICs) for easier assignment.
        </p>
      </div>

      <CreateVendorGroupForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/dashboard')}
        isLoading={isLoading}
      />
    </div>
  );
}
