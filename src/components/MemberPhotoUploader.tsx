import React, { useState, useRef } from 'react';
import { Camera, Upload, Link, User, RefreshCw, X, Check } from 'lucide-react';

interface MemberPhotoUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

const SAMPLE_AVATARS = [
  { label: 'Male Student', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300' },
  { label: 'Female Student', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300' },
  { label: 'Male Faculty', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300' },
  { label: 'Female Faculty', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300' },
  { label: 'Senior Scholar', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300' },
  { label: 'Librarian', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300' }
];

export const MemberPhotoUploader: React.FC<MemberPhotoUploaderProps> = ({
  value,
  onChange,
  label = 'Registered Person Photo / Picture'
}) => {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'WEBCAM' | 'SAMPLES' | 'URL'>('UPLOAD');
  const [urlInput, setUrlInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Start Webcam
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator?.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported by your browser environment. Please upload a photo file or enter an image URL.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400, facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Webcam notice:', err?.name || err?.message || err);
      setCameraError('Camera permission denied or camera not available. Please allow camera permissions or upload an image file below.');
    }
  };

  // Stop Webcam
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture Webcam Snapshot
  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 300;
      canvas.height = video.videoHeight || 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onChange(dataUrl);
        stopCamera();
      }
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
    }
  };

  return (
    <div className="space-y-3 p-3.5 rounded-2xl border border-[#27272a] bg-[#09090b]">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono font-bold uppercase text-[#a1a1aa] flex items-center space-x-1.5">
          <Camera className="h-3.5 w-3.5 text-emerald-400" />
          <span>{label}</span>
        </label>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              stopCamera();
            }}
            className="text-[10px] text-red-400 hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <X className="h-3 w-3" />
            <span>Remove Photo</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Photo Display Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-[#121214] flex items-center justify-center shadow-lg shadow-emerald-500/10">
            {value ? (
              <img src={value} alt="Registered Member" className="w-full h-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-emerald-500/40" />
            )}
          </div>
          {value && (
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-md">
              <Check className="h-3 w-3" />
            </span>
          )}
        </div>

        {/* Upload Methods Selector */}
        <div className="flex-1 w-full space-y-2">
          {/* Tabs */}
          <div className="flex space-x-1 bg-[#121214] p-1 rounded-xl border border-[#27272a] text-[11px]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('UPLOAD');
                stopCamera();
              }}
              className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                activeTab === 'UPLOAD' ? 'bg-emerald-600 text-white font-bold' : 'text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              <Upload className="h-3 w-3" />
              <span>Upload</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('WEBCAM');
                startCamera();
              }}
              className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                activeTab === 'WEBCAM' ? 'bg-emerald-600 text-white font-bold' : 'text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              <Camera className="h-3 w-3" />
              <span>Camera</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('SAMPLES');
                stopCamera();
              }}
              className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                activeTab === 'SAMPLES' ? 'bg-emerald-600 text-white font-bold' : 'text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              <User className="h-3 w-3" />
              <span>Presets</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('URL');
                stopCamera();
              }}
              className={`flex-1 py-1 px-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                activeTab === 'URL' ? 'bg-emerald-600 text-white font-bold' : 'text-[#a1a1aa] hover:text-[#fafafa]'
              }`}
            >
              <Link className="h-3 w-3" />
              <span>URL</span>
            </button>
          </div>

          {/* TAB 1: File Upload */}
          {activeTab === 'UPLOAD' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 text-xs font-semibold flex items-center justify-center space-x-2 cursor-pointer transition-all"
              >
                <Upload className="h-4 w-4" />
                <span>Choose Photo File from Device</span>
              </button>
            </div>
          )}

          {/* TAB 2: Live Webcam Stream */}
          {activeTab === 'WEBCAM' && (
            <div className="space-y-2">
              {cameraError ? (
                <div className="text-[11px] text-red-400 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  {cameraError}
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-black border border-[#27272a]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-32 object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2 px-2">
                    <button
                      type="button"
                      onClick={captureSnapshot}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer shadow-lg"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Take Photo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Sample Avatars */}
          {activeTab === 'SAMPLES' && (
            <div className="grid grid-cols-3 gap-1.5 max-h-28 overflow-y-auto pr-1">
              {SAMPLE_AVATARS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChange(item.url)}
                  className={`p-1 rounded-lg border text-left flex items-center space-x-1.5 transition-all cursor-pointer ${
                    value === item.url ? 'border-emerald-500 bg-emerald-500/20' : 'border-[#27272a] bg-[#121214] hover:border-emerald-500/50'
                  }`}
                >
                  <img src={item.url} alt={item.label} className="w-6 h-6 rounded-full object-cover shrink-0" />
                  <span className="text-[9px] text-[#fafafa] font-medium truncate">{item.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* TAB 4: Image URL */}
          {activeTab === 'URL' && (
            <form onSubmit={handleApplyUrl} className="flex space-x-2">
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 bg-[#121214] border border-[#27272a] rounded-xl px-3 py-1.5 text-xs text-[#fafafa] focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
              >
                Set
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
