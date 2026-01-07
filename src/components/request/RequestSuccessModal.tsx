import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Request } from '../../types/requests';

interface RequestSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: Request | null;
  onGoToDashboard: () => void;
  remainingQuota?: number;
}

export function RequestSuccessModal({ isOpen, onClose, request, onGoToDashboard, remainingQuota }: RequestSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  if (!request) return null;

  const requestLink = `${import.meta.env.VITE_SHARE_URL || window.location.origin}/share/${request.url_token}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(requestLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Halo, saya telah membuat request "${request.title}".\nSilakan cek di sini: ${requestLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Berhasil Dibuat" width="md">
      <div className="flex flex-col gap-6">
        <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 line-clamp-2">
                {request.title}
            </h4>
            <p className="text-gray-500 text-sm">
                Request Anda telah berhasil dibuat. Bagikan link di bawah ini kepada vendor atau PIC Anda.
            </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
             <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Link Request
             </label>
             <div className="flex gap-2">
                <input 
                    readOnly
                    value={requestLink}
                    className="flex-1 min-w-0 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    onClick={(e) => e.currentTarget.select()}
                />
                <button
                    onClick={handleCopy}
                    className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                        copied 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                    {copied ? (
                        <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Disalin
                        </>
                    ) : (
                        <>
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                           </svg>
                           Salin
                        </>
                    )}
                </button>
             </div>
        </div>

        {remainingQuota !== undefined && remainingQuota !== null && (
          <p className="text-xs text-center text-gray-500 bg-blue-50 py-2 rounded border border-blue-100">
             You have <span className="font-bold text-blue-700">{remainingQuota}</span> free requests remaining this month.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
            <Button
                onClick={handleWhatsAppShare}
                className="bg-[#25D366] hover:bg-[#128C7E] text-white border-none flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
            </Button>
            <Button
                onClick={onGoToDashboard}
                variant="outline"
            >
                Dashboard
            </Button>
        </div>
      </div>
    </Modal>
  );
}
