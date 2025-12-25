import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreateRequestForm } from '../../components/request/CreateRequestForm';
import { Card, Button } from '../../components/ui';
import { createPublicRequest } from '../../api/requests';
import { getDeviceFingerprint } from '../../utils/fingerprint';

export function PublicCreateRequestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [successToken, setSuccessToken] = useState<string | null>(null);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState<string>('');

  // Load fingerprint on mount
  useEffect(() => {
    getDeviceFingerprint().then(setFingerprint);
  }, []);



  const navigate = useNavigate();

  const handleSubmit = async (data: { title: string; description: string; followupLink: string; vendorGroupId?: string }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await createPublicRequest({
        title: data.title,
        description: data.description || undefined,
        followup_link: data.followupLink || undefined,
        fingerprint: fingerprint,
      });
      
      setSuccessToken(response.request.url_token);
      setRemainingQuota(response.remaining_quota);
    } catch (err: unknown) {
      const error = err as Error & { status?: number; remaining_quota?: number; reset_at?: string };
      if (error.status === 429) {
        navigate('/pricing?limit_reached=true');
      } else {
        setError(error.message || 'Failed to create request');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const Navbar = () => (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4 sm:px-0">
      <div className="bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-lg rounded-full px-6 py-3 mx-auto transition-all duration-300">
        <div className="flex justify-between items-center">
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <span className="text-sm font-bold text-gray-900 tracking-tight hidden sm:block">ResponseWatch</span>
          </div>
          
          <div className="hidden md:flex items-center gap-1">
             <a href="#features" className="px-4 py-2 rounded-full text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all">Features</a>
             <a href="#how-it-works" className="px-4 py-2 rounded-full text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all">How It Works</a>
             <Link to="/pricing" className="px-4 py-2 rounded-full text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all">Pricing</Link>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:block px-4 py-2 rounded-full text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all">
              Login
            </Link>
            <Link to="/login">
              <Button size="sm" className="rounded-full px-5">Get Started</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );

  const TrustedBy = () => (
    <div className="mt-8 pb-4 opacity-70">
        <p className="text-sm font-semibold text-gray-500 tracking-wide uppercase mb-4">Trusted by modern teams at</p>
        <div className="flex gap-6 items-center justify-center lg:justify-start flex-wrap grayscale opacity-60">
            {/* Mock Logos - In production use SVGs */}
            <div className="font-bold text-xl text-gray-600">ACME Corp</div>
            <div className="font-bold text-xl text-gray-600">GlobalTech</div>
            <div className="font-bold text-xl text-gray-600">Nebula</div>
            <div className="font-bold text-xl text-gray-600">Starlight</div>
        </div>
    </div>
  );

  const HeroSection = () => (
    <div className="relative min-h-screen flex items-center pt-24 pb-12 lg:pt-32 lg:pb-28 overflow-hidden bg-white">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="text-center md:max-w-2xl md:mx-auto lg:mx-0 lg:text-left">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-50 text-orange-700 text-sm font-medium mb-6 border border-orange-100">
                <span className="flex h-2 w-2 relative mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                New: Public Request Tracking
              </div>
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl leading-tight">
                <span className="block xl:inline">Vendor communication,</span>{' '}
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600 xl:inline">simplified.</span>
              </h1>
              <p className="mt-6 text-xl text-gray-500 sm:mt-8 sm:max-w-xl sm:mx-auto md:text-xl lg:mx-0 leading-relaxed">
                Create shareable tracking links dalam hitungan detik. Vendor kamu nggak perlu login. Dapatkan real-time updates dan stop chasing emails manual.
              </p>
              
              {/* <div className="mt-8 border-t border-gray-100 pt-8 hidden lg:block">
                 <TrustedBy />
              </div> */}
            </div>
          </div>
          
          <div className="mt-12 lg:mt-0 lg:col-span-5 relative z-10">
            {successToken ? (
               <Card padding="lg" className="w-full h-full flex flex-col items-center justify-center text-center p-10 bg-white border-green-100 shadow-xl ring-1 ring-black/5">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Created!</h3>
                <p className="text-gray-600 mb-4 max-w-xs mx-auto">
                  Tracking link kamu ready. Share langsung ke vendor atau stakeholders kamu.
                </p>
                {remainingQuota !== null && (
                  <p className="text-sm text-gray-500 mb-4">
                    {remainingQuota > 0 
                      ? `${remainingQuota} free requests left this month`
                      : 'Ini last free request kamu. Login for unlimited access.'}
                  </p>
                )}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 w-full mb-8 text-sm font-mono text-gray-800 break-all select-all flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/t/${successToken}`)}>
                  <span className="truncate mr-2">{window.location.origin}/t/{successToken}</span>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </div>
                <div className="space-y-3 w-full">
                    <Button 
                      onClick={() => setSuccessToken(null)}
                      fullWidth
                    >
                      Create Another
                    </Button>
                    <Link to="/login" className="block w-full">
                        <Button variant="outline" fullWidth>Login for Unlimited</Button>
                    </Link>
                </div>
               </Card>
            ) : error ? (
                <Card padding="lg" className="w-full h-full flex flex-col items-center justify-center text-center p-10 bg-white border-red-100 shadow-xl ring-1 ring-black/5">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Quota Exceeded</h3>
                  <p className="text-gray-600 mb-6 max-w-xs mx-auto">{error}</p>
                  <div className="space-y-3 w-full">
                    <Link to="/login" className="block w-full">
                      <Button fullWidth>Login for Unlimited Access</Button>
                    </Link>
                    <Button variant="outline" fullWidth onClick={() => setError(null)}>
                      Try Again
                    </Button>
                  </div>
                </Card>
            ) : (
                <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-20 transform rotate-1"></div>
                    <div className="relative bg-white rounded-xl shadow-2xl ring-1 ring-gray-900/5">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                            <h3 className="text-lg font-semibold text-gray-900">New Request</h3>
                            <p className="text-sm text-gray-500">Create new request in seconds</p>
                        </div>
                        <div className="p-6">
                            <CreateRequestForm 
                                onSubmit={handleSubmit}
                                isLoading={isLoading}
                            />
                        </div>
                    </div>
                </div>
            )}
          </div>
          
          <div className="mt-16 lg:hidden border-t border-gray-100 pt-8 text-center bg-white/50 backdrop-blur-sm -mx-4 px-4 pb-8">
             <TrustedBy />
          </div>
        </div>
      </div>
    </div>
  );

  const HowItWorks = () => (
      <div id="how-it-works" className="py-24 bg-gray-50/50 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
              <div className="text-center max-w-3xl mx-auto mb-20">
                  <h2 className="text-base font-semibold text-primary tracking-wide uppercase">Workflow</h2>
                  <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">How ResponseWatch Works</p>
                  <p className="mt-4 text-xl text-gray-500">3 easy steps to simplify komunikasi vendor kamu.</p>
              </div>
              
              <div className="relative">
                  {/* Connecting Line */}
                  <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-200" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                      {[
                          { step: '01', title: 'Create Request', desc: 'Isi form simple untuk track issues. Nggak perlu login untuk quick requests.' },
                          { step: '02', title: 'Share Link', desc: 'Kirim secure unique link ke vendor, mitra, atau team members lewat channel apa aja.' },
                          { step: '03', title: 'Track Status', desc: 'Vendor update status langsungtanpa bikin akun. Track Real-time di public page.' }
                      ].map((item, idx) => (
                          <div key={idx} className="relative bg-white md:bg-transparent p-6 md:p-0 rounded-xl shadow-sm md:shadow-none border md:border-none border-gray-100">
                              <div className="w-24 h-24 bg-white border-2 border-primary/10 rounded-full flex items-center justify-center mx-auto relative z-10 shadow-sm mb-6">
                                  <span className="text-3xl font-bold text-primary">{item.step}</span>
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 text-center mb-3">{item.title}</h3>
                              <p className="text-gray-500 text-center leading-relaxed">
                                  {item.desc}
                              </p>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
  );

  const FeatureSection = () => (
    <div id="features" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-16">
          <h2 className="text-base font-semibold text-primary tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to <span className="text-primary">stay in control</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Instant Links',
                desc: 'Generate unique secure link untuk setiap issue in one click. No complicated onboarding.',
                color: 'bg-blue-500', 
                icon: (
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                ),
              },
              {
                title: 'Real-time Updates',
                desc: 'Lihat status langsung di public page. Say goodbye to "just checking in" tasks forever.',
                 color: 'bg-green-500',
                icon: (
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                title: 'Audit Trails',
                desc: 'Setiap tindakan dicatat. Keep permanent records of siapa yang melakukan apa dan kapan.',
                 color: 'bg-indigo-500',
                icon: (
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                ),
              },
              {
                title: 'Public & Private',
                desc: 'Create public links for vendors or private requests for internal team tracking.',
                 color: 'bg-purple-500',
                icon: <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              },
              {
                title: 'Mobile Ready',
                desc: 'Fully responsive design works perfectly on desktop, tablet, and mobile devices.',
                 color: 'bg-pink-500',
                icon: <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              },
              {
                title: 'Secure',
                desc: 'Bank-grade security ensures your operational data stays private and protected.',
                 color: 'bg-orange-500',
                icon: <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              },
            ].map((feature, idx) => (
              <div key={idx} className="relative group p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className={`inline-flex items-center justify-center p-3 rounded-xl shadow-lg ${feature.color} mb-6 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const Footer = () => (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                <div className="col-span-2 md:col-span-1">
                    <span className="text-2xl font-bold text-white tracking-tight">ResponseWatch</span>
                    <p className="mt-4 text-sm text-gray-400">
                        Making vendor communication simple, transparent, and efficient for modern teams.
                    </p>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-100 tracking-wider uppercase mb-4">Product</h3>
                    <ul className="space-y-3 text-sm">
                        <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-100 tracking-wider uppercase mb-4">Company</h3>
                     <ul className="space-y-3 text-sm">
                        <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-100 tracking-wider uppercase mb-4">Legal</h3>
                     <ul className="space-y-3 text-sm">
                        <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">Terms & Conditions</a></li>
                    </ul>
                </div>
            </div>
            <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center bg-gray-900">
                <p className="text-xs text-gray-500">
                  &copy; {new Date().getFullYear()} ResponseWatch. All rights reserved.
                </p>
                <div className="flex space-x-6 mt-4 md:mt-0">
                    <a href="#" className="text-gray-400 hover:text-white">
                        <span className="sr-only">Twitter</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                    </a>
                    <a href="#" className="text-gray-400 hover:text-white">
                        <span className="sr-only">GitHub</span>
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                    </a>
                </div>
            </div>
        </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 scroll-smooth">
      <Navbar />
      <div className="bg-gradient-to-b from-gray-50 to-white">
          <HeroSection />
      </div>
      <HowItWorks />
      <FeatureSection />
      
      {/* Pre-footer CTA */}
      <div className="bg-primary py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
              <h2 className="text-3xl font-extrabold tracking-tight mb-4">Ready to start?</h2>
              <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">Join ribuan teams yang sudah leveling up waktu respon vendor mereka.</p>
              <Link to="/login">
                  <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-50 border-none">Create Free Account</Button>
              </Link>
          </div>
      </div>

      <Footer />
    </div>
  );
}
