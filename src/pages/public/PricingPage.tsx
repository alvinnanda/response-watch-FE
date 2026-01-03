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
          <div className="text-center max-w-3xl mx-auto mb-12">
            {limitReached && (
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-50 text-red-700 text-sm font-medium mb-6 border border-red-100 animate-fade-in-up">
                    <span className="flex h-2 w-2 relative mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Monthly Request Limit Reached
                </div>
            )}
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Simple pricing, <br className="hidden sm:block" />
              <span className="text-primary">unlimited value.</span>
            </h1>
            <p className="mt-5 text-xl text-gray-500">
              Choose the right plan for your team. From individual monitoring to enterprise-grade control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:border-gray-300 transition-colors flex flex-col">
                <div>
                   <h3 className="text-lg font-semibold text-gray-900">Starter</h3>
                   <div className="mt-4 flex items-baseline text-gray-900">
                       <span className="text-3xl font-extrabold tracking-tight">Rp 0</span>
                       <span className="ml-1 text-sm font-medium text-gray-500">/mo</span>
                   </div>
                   <p className="mt-2 text-sm text-gray-500">Perfect for trying out ResponseWatch.</p>
                </div>
                
                <ul className="mt-6 space-y-3 flex-grow">
                    {[
                        '10 Requests / month', 
                        '3 Notes / request', 
                        '30-day History', 
                    ].map((feature, i) => (
                        <li key={i} className="flex items-start">
                            <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                    ))}
                </ul>

                <a href="https://alv.formonline.id/responsewatch" target="_blank" rel="noopener noreferrer" className="mt-8 block">
                    <Button fullWidth variant="outline" className="border-gray-300">Get Started</Button>
                </a>
            </div>

            {/* Basic Plan */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:border-gray-300 transition-colors flex flex-col">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Basic</h3>
                    <div className="mt-4 flex items-baseline text-gray-900">
                        <span className="text-3xl font-extrabold tracking-tight">Rp 42k</span>
                        <span className="ml-1 text-sm font-medium text-gray-500">/mo</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">For individuals who need more history.</p>
                </div>
                
                <ul className="mt-6 space-y-3 flex-grow">
                     <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">Unlimited Requests</span>
                    </li>
                    {[
                        '10 Notes / request', 
                        '90-day History', 
                        'Basic Dashboard',
                        'Public Monitoring'
                    ].map((feature, i) => (
                        <li key={i} className="flex items-start">
                            <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                    ))}
                </ul>

                <a href="https://alv.formonline.id/responsewatch" target="_blank" rel="noopener noreferrer" className="mt-8 block">
                    <Button fullWidth variant="outline" className="border-gray-300">Upgrade Basic</Button>
                </a>
            </div>

            {/* Pro Plan */}
            <div className="bg-black text-white rounded-2xl shadow-xl shadow-gray-200 border border-gray-800 p-6 relative overflow-hidden transform scale-105 z-10 flex flex-col">
                 <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-gray-800 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
                 <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white text-black">
                        Recommended
                    </span>
                 </div>
                 
                <div>
                    <h3 className="text-lg font-semibold text-white">Pro</h3>
                    <div className="mt-4 flex items-baseline text-white">
                        <span className="text-3xl font-extrabold tracking-tight">Rp 89k</span>
                        <span className="ml-1 text-sm font-medium text-gray-400">/mo</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-400">Power users & small teams.</p>
                </div>
                
                <ul className="mt-6 space-y-3 flex-grow z-10 relative">
                     <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium text-white">Everything in Basic</span>
                    </li>
                    {[
                         'Unlimited Notes',
                         '365-day History',
                         'Secure Description (PIN)',
                         'Reminders',
                         'Priority Support'
                    ].map((feature, i) => (
                        <li key={i} className="flex items-start">
                            <svg className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-300">{feature}</span>
                        </li>
                    ))}
                </ul>

                <a href="https://alv.formonline.id/responsewatch" target="_blank" rel="noopener noreferrer" className="mt-8 block z-10 relative">
                    <Button fullWidth variant="secondary" className="border-none w-full">Upgrade Pro</Button>
                </a>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:border-gray-300 transition-colors flex flex-col">
                <div>
                   <h3 className="text-lg font-semibold text-gray-900">Enterprise</h3>
                   <div className="mt-4 flex items-baseline text-gray-900">
                       <span className="text-3xl font-extrabold tracking-tight">Custom</span>
                   </div>
                   <p className="mt-2 text-sm text-gray-500">For organizations with unique needs.</p>
                </div>
                
                <ul className="mt-6 space-y-3 flex-grow">
                    <li className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium text-gray-900">Everything in Pro</span>
                    </li>
                    {[
                        'No Downtime',
                        'Team',
                        'Unlimited History',
                        'Custom Branding',
                        'API Access',
                        'Dedicated Support'
                    ].map((feature, i) => (
                        <li key={i} className="flex items-start">
                            <svg className="w-5 h-5 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                    ))}
                </ul>

                <a href="mailto:sales@responsewatch.com" className="mt-8 block">
                    <Button fullWidth variant="outline" className="border-gray-300">Contact Sales</Button>
                </a>
            </div>
          </div>

          <div className="mt-16 text-center">
             <p className="text-gray-500 text-sm">
                All prices in IDR. Cancel anytime. <a href="#" className="underline hover:text-gray-900">Terms apply.</a>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
