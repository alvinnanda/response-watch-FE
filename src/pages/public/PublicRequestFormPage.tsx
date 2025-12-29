
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CreateRequestForm } from '../../components/request/CreateRequestForm';
import { Card, Button, Modal } from '../../components/ui';
import { createPublicRequestForUser } from '../../api/requests';
import { getDeviceFingerprint } from '../../utils/fingerprint';
import { Footer } from '../../components/public/Footer';
import { toast } from 'sonner';

export function PublicRequestFormPage() {
  const { username } = useParams<{ username: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [successToken, setSuccessToken] = useState<string | null>(null);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [fingerprint, setFingerprint] = useState<string>('');
  const [pageError, setPageError] = useState<string | null>(null);

  // Load fingerprint on mount
  useEffect(() => {
    getDeviceFingerprint().then(setFingerprint);
  }, []);

  const navigate = useNavigate();

  const handleSubmit = async (data: { title: string; description: string; followupLink: string; vendorGroupId?: string }) => {
    if (!username) return;

    setIsLoading(true);
    
    try {
      const response = await createPublicRequestForUser(username, {
        title: data.title,
        description: data.description || undefined,
        followup_link: data.followupLink || undefined,
        fingerprint: fingerprint,
      });
      
      setSuccessToken(response.request.url_token);
      setRemainingQuota(response.remaining_quota);
    } catch (err: unknown) {
      const error = err as Error & { status?: number; remaining_quota?: number; reset_at?: string; response?: { status: number } };
      // Check for 403 or 404 specifically
      if (error.response?.status === 404) {
          setPageError("User not found.");
      } else if (error.response?.status === 403) {
          setPageError("This user is not accepting public requests.");
      } else if (error.status === 429) {
        navigate('/pricing?limit_reached=true');
      } else {
        toast.error(error.message || 'Failed to create request');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (pageError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <Card padding="lg" className="w-full max-w-md text-center p-8">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                     </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
                <p className="text-gray-600 mb-6">{pageError}</p>
                <Link to="/">
                    <Button variant="outline">Go Home</Button>
                </Link>
            </Card>
        </div>
      );
  }

  const Navbar = () => (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4 sm:px-0">
      <div className="bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-lg rounded-full px-6 py-3 mx-auto transition-all duration-300">
        <div className="flex justify-between items-center">
          <div className="flex-shrink-0 flex items-center gap-2">
             <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <span className="text-sm font-bold text-gray-900 tracking-tight hidden sm:block">ResponseWatch</span>
            </Link>
          </div>
          
          <div className="text-sm font-medium text-gray-500">
              Submit Request to <span className="text-primary font-bold">{username}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:block px-4 py-2 rounded-full text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all">
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 scroll-smooth">
      <Navbar />
      
      <div className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden bg-gradient-to-b from-gray-50 to-white px-4">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="w-full max-w-lg relative z-10 mb-12">

            <div className={`transition-all duration-300 ${successToken ? 'blur-sm pointer-events-none' : ''}`}>
                <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary rounded-2xl blur opacity-20 transform rotate-1"></div>
                    <div className="relative bg-white rounded-xl shadow-lg ring-1 ring-gray-900/5">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-xl text-center">
                            <h3 className="text-lg font-semibold text-gray-900">New Request</h3>
                            {/* <p className="text-sm text-gray-500">Submit a request to <span className="font-medium text-primary">@{username}</span></p> */}
                        </div>
                        <div className="p-6">
                            <CreateRequestForm 
                                // Key forces component remount (reset) when successToken changes/clears
                                key={successToken ? 'submitted' : 'new'} 
                                onSubmit={handleSubmit}
                                isLoading={isLoading}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      <Footer />

       {/* Success Modal */}
       <Modal
          isOpen={!!successToken}
          onClose={() => setSuccessToken(null)}
          title="🎉 Request Sent!"
          width="md"
       >
         <div className="text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <p className="text-gray-600 mb-6 font-medium">
              Your request has been submitted to <span className="font-bold text-gray-800">{username}</span>.
              Here is your tracking link:
            </p>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 w-full mb-6 flex items-center justify-between group relative">
                <div className="text-sm font-mono text-gray-800 break-all text-left flex-1 mr-2 px-1">
                    {`${import.meta.env.VITE_SHARE_URL || window.location.origin}/t/${successToken}`}
                </div>
                <Button 
                    size="sm" 
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                        const shareUrl = `${import.meta.env.VITE_SHARE_URL || window.location.origin}/t/${successToken}`;
                        navigator.clipboard.writeText(shareUrl);
                        // Add toast or visual feedback here if needed, Button usually has ripple
                    }}
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy
                </Button>
            </div>

            {remainingQuota !== null && (
                 <p className="text-xs text-center text-gray-500 mb-6 bg-blue-50 py-2 rounded border border-blue-100">
                    You have <span className="font-bold text-blue-700">{remainingQuota}</span> free requests remaining this month.
                 </p>
            )}

            <div className="flex gap-3">
               <Button 
                   onClick={() => setSuccessToken(null)}
                   fullWidth
                   variant="outline"
               >
                   Close
               </Button>
               <Button 
                   onClick={() => {
                       const shareUrl = `${import.meta.env.VITE_SHARE_URL || window.location.origin}/t/${successToken}`;
                       window.open(shareUrl, '_blank');
                   }}
                   fullWidth
               >
                   Open Link
               </Button>
            </div>
         </div>
       </Modal>
    </div>
  );
}
