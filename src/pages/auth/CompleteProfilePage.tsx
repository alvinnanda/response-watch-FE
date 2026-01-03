import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, Card } from '../../components/ui';

export function CompleteProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [organization, setOrganization] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill values if available
  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
    if (user?.organization) {
      setOrganization(user.organization);
    }
    if (user?.is_public !== undefined) {
      setIsPublic(user.is_public);
    }
    if (user?.notify_email !== undefined) {
      setNotifyEmail(user.notify_email);
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
        await updateProfile({ username, organization, is_public: isPublic, notify_email: notifyEmail });
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

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="is_public"
                  name="is_public"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="is_public" className="font-medium text-gray-700">
                  Public Profile
                </label>
                <p className="text-gray-500">Allow anyone to view your public request monitoring page.</p>
              </div>
            </div>

            {/* Email Notification Toggle */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="notify_email"
                  name="notify_email"
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="notify_email" className="font-medium text-gray-700">
                  Email Notifications
                </label>
                <p className="text-gray-500">Receive email notifications when request status changes.</p>
              </div>
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
        <div className="mt-12 text-center pb-8">
          <Link to="/" className="text-xs font-bold text-gray-300 tracking-widest uppercase hover:text-gray-400 transition-colors">
            ResponseWatch
          </Link>
        </div>
      </div>
    </div>
  );
}
