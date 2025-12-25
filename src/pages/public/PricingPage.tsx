import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui';

export function PricingPage() {
  const [searchParams] = useSearchParams();
  const limitReached = searchParams.get('limit_reached') === 'true';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navbar (Simplified) */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-4 sm:px-0">
        <div className="bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-lg rounded-full px-6 py-3 mx-auto transition-all duration-300 flex justify-between items-center">
             <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <span className="text-sm font-bold text-gray-900 tracking-tight">ResponseWatch</span>
             </Link>
             <div className="flex items-center gap-2">
                 <Link to="/login">
                   <Button size="sm" variant="ghost" className="rounded-full">Log in</Button>
                 </Link>
             </div>
        </div>
      </nav>

      <div className="flex-grow pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            {limitReached && (
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-50 text-red-700 text-sm font-medium mb-6 border border-red-100 animate-fade-in-up">
                    <span className="flex h-2 w-2 relative mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Monthly Request Limit Reached (10/10)
                </div>
            )}
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Simple pricing, <br className="hidden sm:block" />
              <span className="text-primary">unlimited value.</span>
            </h1>
            <p className="mt-5 text-xl text-gray-500">
              Choose the plan that fits your team. Upgrade to remove limits and unlock powerful features.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:border-gray-200 transition-colors relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gray-50 rounded-full blur-2xl opacity-50"></div>
                <h3 className="text-lg font-semibold text-gray-900 uppercase tracking-wide">Starter</h3>
                <div className="mt-4 flex items-baseline text-gray-900">
                    <span className="text-4xl font-extrabold tracking-tight">Rp. 0</span>
                    <span className="ml-1 text-xl font-medium text-gray-500">/bulan</span>
                </div>
                <p className="mt-4 text-gray-500">Perfect for trying out ResponseWatch.</p>
                
                <ul className="mt-8 space-y-4">
                    <li className="flex items-center">
                        <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-600">
                           <span className="line-through text-gray-400 mr-2">50 Public Requests</span> 
                           <span className="font-semibold text-gray-900">Unlimited*</span>
                        </span>
                    </li>
                    {['Basic Dashboard', 'Public Monitoring', '90-day History'].map((feature, i) => (
                        <li key={i} className="flex items-center">
                            <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-600">{feature}</span>
                        </li>
                    ))}
                </ul>

                <div className="mt-8">
                     <Link to="/register">
                        <Button fullWidth variant="outline" className="border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors">Get Unlimited Access</Button>
                     </Link>
                     <p className="mt-2 text-xs text-gray-400 italic">* Syarat & Ketentuan berlaku</p>
                </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-black rounded-3xl shadow-xl shadow-gray-200 border border-gray-900 p-8 relative overflow-hidden transform scale-105 z-10">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-gray-800 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                <div className="absolute top-4 right-8 inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-white text-black uppercase tracking-wide">
                    Recommended
                </div>
                
                <h3 className="text-lg font-semibold text-white uppercase tracking-wide">Pro</h3>
                <div className="mt-4 flex items-baseline text-white">
                    <span className="text-5xl font-extrabold tracking-tight">Rp. 59.000</span>
                    <span className="ml-1 text-xl font-medium text-gray-400">/bulan</span>
                </div>
                <p className="mt-4 text-gray-400">Unlimited power for growing teams.</p>
                
                <ul className="mt-8 space-y-4">
                    {['All Starter Features','Unlimited Requests', 'No Spin Down','Advanced Analytics', 'Priority Support', 'Custom Branding', 'Multiple Team Members'].map((feature, i) => (
                        <li key={i} className="flex items-center">
                            <svg className="w-5 h-5 text-green-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-100">{feature}</span>
                        </li>
                    ))}
                </ul>

                <div className="mt-8">
                     <Link to="/register">
                        <Button fullWidth variant="secondary" className="border-none">Available Soon</Button>
                     </Link>
                     <p className="text-xs text-center text-gray-500 mt-3">No credit card required for trial</p>
                </div>
            </div>
          </div>

          {/* Enterprise CTA */}
          <div className="mt-16 text-center">
              <p className="text-gray-500">
                  Need custom solutions? <a href="mailto:alvinnandad1@gmail.com" className="text-black font-semibold underline">Contact Sales</a>
              </p>
          </div>
        </div>
      </div>
    </div>
  );
}
