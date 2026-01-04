import { type ReactNode } from 'react';
import { Button } from '../ui/Button';

interface PremiumLockProps {
    children: ReactNode;
    isLocked: boolean;
    title?: string;
    description?: string;
}

export function PremiumLock({ 
    children, 
    isLocked,
    title = "Premium Feature",
    description = "Upgrade to Pro plan to unlock detailed analytics and insights."
}: PremiumLockProps) {
    if (!isLocked) {
        return <>{children}</>;
    }

    return (
        <div className="relative group">
            {/* Blurred Content */}
            <div className="filter blur-sm select-none pointer-events-none opacity-50 grayscale transition-all duration-500 overflow-hidden">
                {children}
            </div>

            {/* Lock Overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-indigo-100 max-w-sm w-full transform transition-all duration-300 hover:scale-105">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {title}
                    </h3>
                    
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        {description}
                    </p>
                    
                    <Button 
                        variant="primary" 
                        className="w-full justify-center shadow-lg shadow-indigo-200"
                        onClick={() => window.open('https://responsewatch.com/pricing', '_blank')}
                    >
                        Upgrade to Pro
                    </Button>
                </div>
            </div>
        </div>
    );
}
