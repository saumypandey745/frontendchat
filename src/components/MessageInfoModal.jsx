import React, { useEffect, useState } from 'react';
import { X, Check, CheckCheck, Clock, ShieldCheck, User } from 'lucide-react';
import { format } from 'date-fns';
import useChat from '../hooks/useChat';

const MessageInfoModal = ({ messageId, onClose }) => {
  const { fetchMessageInfo } = useChat();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadInfo = async () => {
      setLoading(true);
      setError(null);
      const res = await fetchMessageInfo(messageId);
      if (isMounted) {
        if (res.success) {
          setInfo(res.messageInfo);
        } else {
          setError(res.message || 'Failed to load message info');
        }
        setLoading(false);
      }
    };
    if (messageId) loadInfo();
    return () => { isMounted = false; };
  }, [messageId, fetchMessageInfo]);

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy • h:mm a');
    } catch (e) {
      return '—';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-pop-in">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Message Info</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Clock className="w-8 h-8 animate-spin text-brand-500" />
              <p className="text-sm font-medium">Fetching delivery details...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-2xl text-xs font-semibold text-center">
              {error}
            </div>
          ) : info ? (
            <>
              {/* Target Message Preview */}
              <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/60 dark:border-slate-700/50">
                <p className="text-xs font-semibold text-slate-400 mb-1">Original Message</p>
                <p className="text-sm text-slate-800 dark:text-slate-100 font-medium whitespace-pre-wrap break-words">
                  {info.message.text || (info.message.isViewOnce ? '🔥 View Once Media' : '📷 Attachment')}
                </p>
                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Sent: {formatTimestamp(info.sentAt)}
                </p>
              </div>

              {/* Status Breakdown List */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recipient Status</h4>
                
                {info.recipients.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No recipients recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {info.recipients.map((rcp, idx) => (
                      <div
                        key={rcp.user?._id || idx}
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={
                              rcp.user?.avatarUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(rcp.user?.name || 'User')}&background=6366f1&color=fff`
                            }
                            alt={rcp.user?.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                          />
                          <div className="truncate">
                            <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                              {rcp.user?.name || 'Unknown User'}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{rcp.user?.email}</p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          {rcp.status === 'read' ? (
                            <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs justify-end">
                              <CheckCheck className="w-4 h-4" />
                              <span>Read</span>
                            </div>
                          ) : rcp.status === 'delivered' ? (
                            <div className="flex items-center gap-1 text-brand-500 font-bold text-xs justify-end">
                              <CheckCheck className="w-4 h-4" />
                              <span>Delivered</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-400 font-semibold text-xs justify-end">
                              <Check className="w-4 h-4" />
                              <span>Sent</span>
                            </div>
                          )}
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {rcp.status === 'read' ? formatTimestamp(rcp.readAt) : formatTimestamp(rcp.deliveredAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MessageInfoModal;
