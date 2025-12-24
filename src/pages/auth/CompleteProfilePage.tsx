import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, Card } from '../../components/ui';

export function CompleteProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [organization, setOrganization] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill username if available, but allow editing
  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (username.length < 3 || username.length > 10) {
      setError('Username must be between 3 and 10 characters');
      return;
    }

    if (!organization.trim()) {
      setError('Organization name is required');
      return;
    }

    setIsLoading(true);

    try {
      if (updateProfile) {
        await updateProfile({ username, organization });
        // After successful update, user should have organization, so we can redirect to dashboard
        navigate('/dashboard');
      } else {
        throw new Error('Update profile function not available');
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4 py-12">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              One Last Step!
            </h1>
            <p className="mt-2 text-sm text-gray-600">
               Please complete your profile to continue to the dashboard.
            </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card padding="lg" shadow="md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}
            
            <div>
              <Input
                label="Username"
                type="text"
                placeholder="Unique username"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                helperText="3-10 characters. This will be your unique handle."
              />
            </div>

            <div>
              <Input
                label="Organization"
                type="text"
                placeholder="Your Company or Team Name"
                id="organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              fullWidth 
              isLoading={isLoading}
              variant="primary"
            >
              Complete Profile
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
