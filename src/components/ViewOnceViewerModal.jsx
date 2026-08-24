import React, { useState } from 'react';
import { Flame, X, CheckCircle, ShieldAlert } from 'lucide-react';
import useChat from '../hooks/useChat';

const ViewOnceViewerModal = ({ message, onClose }) => {
  const { openViewOnceMedia } = useChat();
  const [opening, setOpening] = useState(false);

  const mediaUrl = message.imageUrl || message.fileData?.url;

  const handleClose = async () => {
    setOpening(true);
    await openViewOnceMedia(message._id);
    setOpening(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="relative max-w-2xl w-full flex flex-col items-center justify-center">
        {/* Header bar */}
        <div className="w-full flex items-center justify-between p-3 bg-black/40 backdrop-blur-md rounded-full mb-4 text-white">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs px-3">
            <Flame className="w-4 h-4 fill-amber-400 animate-pulse" />
            <span>View Once Media</span>
          </div>

          <button
            onClick={handleClose}
            disabled={opening}
            className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <X className="w-4 h-4" /> Done & Close
          </button>
        </div>

        {/* Media Content */}
        <div className="w-full max-h-[75vh] flex items-center justify-center rounded-3xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl">
          {message.type === 'video' || (message.fileData?.mimeType && message.fileData.mimeType.startsWith('video/')) ? (
            <video
              src={mediaUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[70vh] w-full object-contain"
            />
          ) : mediaUrl ? (
            <img
              src={mediaUrl}
              alt="View once photo"
              className="max-h-[70vh] w-full object-contain select-none"
            />
          ) : (
            <div className="p-12 text-center text-slate-400">
              <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-2" />
              <p className="font-bold">Media Unavailable or Expired</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-white/60 mt-3 font-medium">
          🔥 This media will be permanently closed and deleted from viewing after you exit.
        </p>
      </div>
    </div>
  );
};

export default ViewOnceViewerModal;
