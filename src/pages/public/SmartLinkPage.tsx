import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button, Card } from '../../components/ui';
import { getPublicRequest, startPublicRequest, finishPublicRequest, verifyDescriptionPin, type PublicRequest } from '../../api/requests';
import moment from 'moment';

type RequestStatus = 'waiting' | 'in_progress' | 'done' | 'scheduled';

import { RichTextViewer } from '../../components/ui/RichTextViewer';

const ShareButton = () => {
  const { token } = useParams<{ token: string }>();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      // Use configured VITE_SHARE_URL for static page
      const shareBaseUrl = import.meta.env.VITE_SHARE_URL || 'https://responsewatch.onrender.com';
      const shareUrl = `${shareBaseUrl}/share/${token}`;
      
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 800);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 rounded-full transition-all"
      title="Salin Tautan"
    >
      {copied ? (
        <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full whitespace-nowrap shadow-sm border border-green-100">
          Tersalin!
        </span>
      ) : null}
      {copied ? (
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      )}
    </button>
  );
};

export function SmartLinkPage() {
  const { token } = useParams<{ token: string }>();
  const [request, setRequest] = useState<PublicRequest | null>(null);
  const [status, setStatus] = useState<RequestStatus>('waiting');
  const [selectedPic, setSelectedPic] = useState('');
  const [showPicSelect, setShowPicSelect] = useState(false);
  const [showDescModal, setShowDescModal] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);

  // PIN verification state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [unlockedDescription, setUnlockedDescription] = useState<string | null>(null);

  // Finish request state
  const [checkboxIssueMismatch, setCheckboxIssueMismatch] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch request on mount
  useEffect(() => {
    if (!token) return;
    
    const fetchRequest = async () => {
      try {
        setIsLoading(true);
        const data = await getPublicRequest(token);
        setRequest(data);
        setStatus(data.status);
        
        // If already in progress, calculate elapsed time and start timer
        if (data.status === 'in_progress' && data.started_at) {
          const startedAt = moment(data.started_at);
          const elapsed = moment().diff(startedAt, 'seconds');
          setElapsedTime(elapsed);
          startTimer();
        }
        
        // If done, show final elapsed time
        if (data.status === 'done' && data.duration_seconds) {
          setElapsedTime(data.duration_seconds);
        }
        
        if (data.start_pic) setSelectedPic(data.start_pic);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load request');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRequest();
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [token]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  const handleStartResponse = async () => {
    if (!token) return;
    
    if (request?.embedded_pic_list && request.embedded_pic_list.length > 0 && !selectedPic) {
      setShowPicSelect(true);
      return;
    }
    
    try {
      setActionLoading(true);
      const updated = await startPublicRequest(token, selectedPic || undefined);
      setRequest(updated);
      setStatus('in_progress');
      startTimer();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!token) return;
    
    try {
      setActionLoading(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const updated = await finishPublicRequest(
        token, 
        selectedPic || undefined,
        checkboxIssueMismatch,
        resolutionNotes || undefined
      );
      setRequest(updated);
      setStatus('done');
      if (updated.duration_seconds) setElapsedTime(updated.duration_seconds);
      
      // Reset state
      setCheckboxIssueMismatch(false);
      setResolutionNotes('');
      setShowFinishConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finish');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    return moment.utc(seconds * 1000).format('HH:mm:ss');
  };

  const formatDurationHuman = (totalSeconds: number) => {
    if (totalSeconds < 60) return `${totalSeconds} detik`;
    
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const days = Math.floor(totalSeconds / 86400);

    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;

    const parts = [];
    if (weeks > 0) parts.push(`${weeks} minggu`);
    if (remainingDays > 0) parts.push(`${remainingDays} hari`);
    if (hours > 0) parts.push(`${hours} jam`);
    if (minutes > 0) parts.push(`${minutes} menit`);

    return parts.join(' ');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <Card padding="sm" className="max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Permintaan Tidak Ditemukan</h2>
          <p className="text-gray-600">{error || 'Tautan pelacakan ini tidak valid atau telah kedaluwarsa.'}</p>
        </Card>
      </div>
    );
  }

  const RequestHeader = () => {
    // We can't easily truncate HTML string safely without a parser.
    // CSS line-clamping or max-height is best for visual truncation.
    const displayDescription = unlockedDescription || request.description;
    const isLong = displayDescription && displayDescription.length > 150; // simple heuristic for button visibility
    const isSecured = request.is_description_secure && !pinVerified;

    return (
      <>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-4">{request.title}</h1>
        
        {/* Secured Description - Show Lock */}
        {isSecured && (
          <div className="relative mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Deskripsi Dilindungi PIN</p>
                <p className="text-xs text-gray-500 mt-0.5">Masukkan PIN untuk melihat deskripsi</p>
              </div>
              <button
                onClick={() => setShowPinModal(true)}
                className="mt-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Masukkan PIN
              </button>
            </div>
          </div>
        )}

        {/* Normal Description Display */}
        {!isSecured && displayDescription && (
          <div className="relative mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100 text-left group">
             {/* Preview: Limited Height + RichText */}
            <div className={`relative ${!showDescModal ? 'max-h-[120px] overflow-hidden mask-image-bottom' : ''}`}>
                 <RichTextViewer content={displayDescription || ''} className="text-sm text-gray-600" />
                 {/* Gradient Overlay for truncated view */}
                 <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none" />
            </div>

             <button 
                onClick={() => setShowDescModal(true)}
                className="mt-2 text-primary text-xs font-semibold hover:underline bg-gray-50 inline-flex items-center gap-0.5"
              >
                {isLong ? 'Baca selengkapnya' : 'Lihat Detail'}
              </button>
          </div>
        )}
        {!isSecured && !displayDescription && (
             <button 
                onClick={() => setShowDescModal(true)}
                className="mt-2 text-primary text-sm font-medium hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                Lihat Detail
              </button>
        )}

        {request.followup_link && (
          <div className="mt-4">
             <a 
              href={request.followup_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm text-sm font-medium text-primary hover:bg-gray-50 hover:border-primary/30 transition-all group"
            >
              <span>Follow-up Link</span>
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </>
    );
  };



  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        
        {/* State A: WAITING */}
        {status === 'waiting' && (
          <Card padding="lg" shadow="lg" className="border-t-4">
            <div className="text-center space-y-6 relative">
              <ShareButton />
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-50 text-orange-700 text-sm font-medium mb-6 border border-orange-100">
                <span className="flex h-2 w-2 relative mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                New: Request
              </div>
              
              <RequestHeader />

              <div className="pt-2">
                <Button 
                  color='black' 
                  fullWidth 
                  onClick={handleStartResponse} 
                  size="lg" 
                  className="h-12 text-base shadow-xl shadow-indigo-500/20"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Memulai...' : 'Mulai Pengerjaan'}
                </Button>
                <p className="text-xs text-gray-400 mt-4">
                  Klik tombol di atas saat mulai bekerja (termasuk persiapan & perjalanan).
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* State B: IN PROGRESS */}
        {status === 'in_progress' && (
          <Card padding="lg" shadow="lg" className="border-t-4 border-blue-500">
            <div className="text-center space-y-6 relative">
              <ShareButton />
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-700/10 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                In Progress
              </div>
              
              <RequestHeader />
              
              {/* Timer */}
              <div className="py-8 bg-gray-50/50 rounded-2xl border border-gray-100">
                <p className="text-6xl font-mono font-bold text-gray-900 tracking-tighter tabular-nums">
                  {formatDuration(elapsedTime)}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                  <span>Sedang ditangani oleh</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-md border border-gray-200 shadow-sm font-medium text-gray-800">
                    <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                       {(selectedPic || request.start_pic || 'Anda').charAt(0)}
                    </div>
                    {selectedPic || request.start_pic || 'Anda'}
                  </div>
                </div>
              </div>

              <Button 
                fullWidth 
                onClick={() => setShowFinishConfirm(true)} 
                className="h-12 text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                disabled={actionLoading}
              >
                {actionLoading ? 'Menyelesaikan...' : 'Selesai'}
              </Button>
            </div>
          </Card>
        )}

        {/* State C: DONE */}
        {status === 'done' && (
          <Card padding="lg" shadow="lg" className="border-t-4 border-green-100">
            <div className="text-center space-y-6 relative">
              <ShareButton />
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 ring-1 ring-green-600/20 text-sm font-medium">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                 </svg>
                Selesai
              </div>
              
              <RequestHeader />
              
              {/* Timeline */}
              <div className="text-left bg-gray-50 rounded-xl p-6 space-y-0 mt-6 border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-8 bottom-0 w-0.5 bg-gray-200/60 z-0"></div>
                
                <div className="relative z-10 flex gap-4 pb-8">
                  <div className="w-4 h-4 mt-1 rounded-full bg-gray-300 ring-4 ring-white shadow-sm shrink-0"></div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Permintaan Dibuat</p>
                    <p className="text-xs text-gray-500 mt-0.5">{moment(request.created_at).format('D MMM YYYY, HH:mm')}</p>
                  </div>
                </div>
                
                <div className="relative z-10 flex gap-4 pb-8">
                  <div className="w-4 h-4 mt-1 rounded-full bg-blue-500 ring-4 ring-white shadow-sm shadow-blue-500/30 shrink-0"></div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Tanggapan Dimulai</p>
                    <div className="flex gap-2 mt-1 flex-col">
                      <span className="text-xs text-gray-500">Oleh {request.start_pic || selectedPic || 'PIC'}.</span>
                      {request.response_time_seconds && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Waktu Respons: <span className="text-gray-700 font-medium">{formatDurationHuman(request.response_time_seconds)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex gap-4">
                  <div className="w-4 h-4 mt-1 rounded-full bg-green-500 ring-4 ring-white shadow-sm shadow-green-500/30 shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">Masalah Teratasi</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Total durasi: <span className="text-gray-700 font-medium">{formatDurationHuman(elapsedTime)}</span>
                    </p>
                    
                    {/* Resolution notes */}
                    {request.resolution_notes && (
                      <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Catatan Penyelesaian:</p>
                        <p className="text-xs text-gray-600 whitespace-pre-wrap">{request.resolution_notes}</p>
                      </div>
                    )}
                    
                    {/* Checkbox issue mismatch */}
                    {request.checkbox_issue_mismatch && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Instruksi/Judul tidak sesuai dengan kondisi aktual</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* State D: SCHEDULED */}
        {status === 'scheduled' && (
          <Card padding="lg" shadow="lg" className="border-t-4 border-gray-500">
            <div className="text-center space-y-6 relative">
              <ShareButton />
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 ring-1 ring-gray-700/10 text-sm font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Dijadwalkan
              </div>
              
              <RequestHeader />

              {/* Scheduled time display */}
              <div className="py-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                <p className="text-sm text-gray-600 font-medium mb-2">Waktu Dijadwalkan</p>
                <p className="text-2xl font-bold text-gray-900">
                  {moment(request.scheduled_time).format('D MMM YYYY, HH:mm')}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {moment(request.scheduled_time).fromNow()}
                </p>
              </div>

              {/* Add to Calendar button */}
              <button
                onClick={() => {
                  if (!request.scheduled_time) return;
                  const startTime = moment(request.scheduled_time).format('YYYYMMDDTHHmmss');
                  const endTime = moment(request.scheduled_time).add(1, 'hour').format('YYYYMMDDTHHmmss');
                  const title = encodeURIComponent(request.title);
                  const description = encodeURIComponent(`Request: ${request.title}\nLink: ${window.location.href}`);
                  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${description}`;
                  window.open(googleCalUrl, '_blank');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Tambah ke Kalender
              </button>

              {/* Disabled start button */}
              <Button 
                fullWidth 
                onClick={() => {
                  if (!request.scheduled_time) return;
                  alert(`Request ini dijadwalkan untuk ${moment(request.scheduled_time).format('D MMM YYYY, HH:mm')}. Tombol akan aktif pada jam tersebut.`);
                }}
                className="h-12 text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                disabled
              >
                Mulai Pengerjaan (Terjadwal)
              </Button>
              <p className="text-xs text-gray-400">
                Tombol akan aktif pada waktu yang dijadwalkan
              </p>
            </div>
          </Card>
        )}

        {/* PIC Selection Modal */}
        {showPicSelect && request.embedded_pic_list && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50 transition-all">
            <Card className="w-full max-w-sm" padding="lg">
              <h3 className="font-bold text-gray-900 mb-1">Siapa yang menangani ini?</h3>
              <p className="text-gray-500 text-sm mb-5">Pilih nama Anda untuk memulai penghitung waktu.</p>
              
              <div className="space-y-2">
                {request.embedded_pic_list.map((pic) => (
                  <button
                    key={pic}
                    onClick={async () => {
                      setSelectedPic(pic);
                      setShowPicSelect(false);
                      try {
                        setActionLoading(true);
                        const updated = await startPublicRequest(token!, pic);
                        setRequest(updated);
                        setStatus('in_progress');
                        startTimer();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Failed to start');
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                    className="w-full p-4 text-left rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all flex items-center justify-between group"
                  >
                    <span className="font-medium text-gray-700 group-hover:text-indigo-700">{pic}</span>
                    <span className="opacity-0 group-hover:opacity-100 text-indigo-500">→</span>
                  </button>
                ))}
              </div>
              <Button
                variant="ghost"
                fullWidth
                className="mt-4"
                onClick={() => setShowPicSelect(false)}
              >
                Batal
              </Button>
            </Card>
          </div>
        )}

        {/* Description Modal */}
        {showDescModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 z-50 transition-all">
            <Card className="w-full max-w-sm md:max-w-2xl max-h-[80vh] flex flex-col relative" padding="sm">
               <button 
                  onClick={() => setShowDescModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 bg-white rounded-full z-10"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

              <div className="mb-4 pr-6 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">Detail Permintaan</h3>
                {status === 'waiting' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-mono font-medium border border-yellow-200">
                    Menunggu
                  </span>
                )}
                {status === 'in_progress' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-mono font-medium border border-blue-200">
                    {formatDuration(elapsedTime)}
                  </span>
                )}
                {status === 'done' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-mono font-medium border border-green-200">
                    {formatDuration(elapsedTime)}
                  </span>
                )}
              </div>
              
              <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
                <div className="text-gray-600 text-sm leading-relaxed">
                  <RichTextViewer content={unlockedDescription || request.description || ''} />
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Dibuat Pada</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {moment(request.created_at).format('D MMM, HH:mm')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Token</p>
                    <p className="text-sm font-mono text-gray-900 mt-1 bg-gray-50 inline-block px-2 py-0.5 rounded border border-gray-100">
                      {request.url_token}
                    </p>
                  </div>
                  {request.followup_link && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Tautan Tindak Lanjut</p>
                      <a 
                        href={request.followup_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        Buka Tautan
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2 pt-2">
                <Button fullWidth onClick={() => setShowDescModal(false)}>
                  Tutup
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Confirmation Modal */}
        {showFinishConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all">
            <Card className="w-full max-w-md" padding="lg">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h3 className="font-bold text-gray-900 text-lg mb-2 text-center">Selesaikan Permintaan?</h3>
              <p className="text-gray-500 text-sm mb-4 text-center">
                Apakah Anda yakin ingin menyelesaikan permintaan ini? Waktu pengerjaan akan dihentikan.
              </p>
              
              {/* Resolution notes textarea */}
              <div className="mb-4 text-left">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catatan Penyelesaian (opsional)
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Tambahkan catatan tentang penyelesaian request ini..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Checkbox for issue mismatch */}
              <div className="mb-6 text-left">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkboxIssueMismatch}
                    onChange={(e) => setCheckboxIssueMismatch(e.target.checked)}
                    className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Instruksi/Judul tidak sesuai kondisi aktual</span>
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowFinishConfirm(false);
                    setCheckboxIssueMismatch(false);
                    setResolutionNotes('');
                  }}
                  disabled={actionLoading}
                >
                  Batal
                </Button>
                <Button 
                  onClick={handleFinish}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white border-transparent"
                >
                  {actionLoading ? 'Menyimpan...' : 'Ya, Selesai'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* PIN Verification Modal */}
        {showPinModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all">
            <Card className="w-full max-w-sm text-center" padding="lg">
              <button 
                onClick={() => {
                  setShowPinModal(false);
                  setEnteredPin('');
                  setPinError('');
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              
              <h3 className="font-bold text-gray-900 text-lg mb-2">Masukkan PIN</h3>
              <p className="text-gray-500 text-sm mb-6">
                Deskripsi ini dilindungi PIN. Masukkan PIN untuk melihatnya.
              </p>
              
              <div className="mb-4">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={enteredPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setEnteredPin(val);
                    setPinError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && enteredPin.length >= 4) {
                      // Trigger verification
                      const verifyBtn = document.getElementById('verify-pin-btn');
                      verifyBtn?.click();
                    }
                  }}
                  placeholder="••••"
                  className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  autoFocus
                />
                {pinError && (
                  <p className="text-sm text-red-500 mt-2">{pinError}</p>
                )}
              </div>
              
              <Button 
                id="verify-pin-btn"
                fullWidth
                onClick={async () => {
                  if (!token || !enteredPin) return;
                  
                  setPinLoading(true);
                  setPinError('');
                  
                  try {
                    const result = await verifyDescriptionPin(token, enteredPin);
                    if (result.success && result.description) {
                      setUnlockedDescription(result.description);
                      setPinVerified(true);
                      setShowPinModal(false);
                      setEnteredPin('');
                    } else {
                      setPinError('PIN salah. Silakan coba lagi.');
                    }
                  } catch {
                    setPinError('PIN salah. Silakan coba lagi.');
                  } finally {
                    setPinLoading(false);
                  }
                }}
                disabled={pinLoading || enteredPin.length < 4}
                className="bg-primary hover:bg-primary/90"
              >
                {pinLoading ? 'Memverifikasi...' : 'Verifikasi'}
              </Button>
            </Card>
          </div>
        )}

        {/* Simple Footer */}
        <div className="mt-12 text-center pb-8">
          <Link to="/" className="text-xs font-bold text-gray-300 tracking-widest uppercase hover:text-gray-400 transition-colors">
            ResponseWatch
          </Link>
        </div>
      </div>
    </div>
  );
}
