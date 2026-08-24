import React, { useState, useEffect } from 'react';
import {
  Phone,
  Video,
  ArrowUpRight,
  ArrowDownLeft,
  PhoneOff,
  PhoneMissed,
  X,
  Clock,
  Calendar,
  Loader2,
} from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { useTranslation } from 'react-i18next';
import api from '../lib/axios';
import useAuth from '../hooks/useAuth';
import useSocket from '../hooks/useSocket';
import useCall from '../hooks/useCall';
import EmptyState from './EmptyState';
import Skeleton from './ui/Skeleton';
import Badge from './ui/Badge';
import Button from './ui/Button';

const CallsTab = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { startCall } = useCall();

  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState(null);

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const res = await api.get('/calls');
      if (res.data.success) {
        setCallLogs(res.data.calls);
      }
    } catch (e) {
      console.error('Failed to fetch call logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  // Real-time socket event listener for new call logs
  useEffect(() => {
    if (!socket) return;

    const handleNewCallLog = (newLog) => {
      setCallLogs((prev) => {
        // Prevent duplicate logs if already present
        const exists = prev.some((c) => c._id === newLog._id);
        if (exists) return prev;
        return [newLog, ...prev];
      });
    };

    socket.on('new-call-log', handleNewCallLog);
    return () => {
      socket.off('new-call-log', handleNewCallLog);
    };
  }, [socket]);

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const getCallTimeLabel = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return t('yesterday');
    return format(date, 'MMM d');
  };

  // Group call logs by date header ("Today", "Yesterday", "This Week", "Older")
  const groupCallsByDate = (calls) => {
    const groups = {};
    calls.forEach((call) => {
      const date = new Date(call.createdAt || call.startedAt || Date.now());
      let groupKey = t('older');
      if (isToday(date)) groupKey = t('today');
      else if (isYesterday(date)) groupKey = t('yesterday');
      else if (isThisWeek(date)) groupKey = t('this_week');
      else groupKey = format(date, 'MMMM d, yyyy');

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(call);
    });
    return groups;
  };

  const groupedLogs = groupCallsByDate(callLogs);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {t('call_history')}
        </h2>
        <span className="text-xs font-semibold text-slate-400">
          {callLogs.length} logs
        </span>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
          <div className="space-y-4 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-11 h-11 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-2.5 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : callLogs.length === 0 ? (
          <EmptyState type="chats" />
        ) : (
          Object.keys(groupedLogs).map((groupTitle) => (
            <div key={groupTitle} className="space-y-2">
              <p className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {groupTitle}
              </p>

              <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-800/40">
                {groupedLogs[groupTitle].map((call, idx) => {
                  const isCaller =
                    call.callerId?._id === user?._id || call.callerId === user?._id;
                  const contact = isCaller ? call.receiverId : call.callerId;
                  const isMissed =
                    call.status === 'missed' || (call.status === 'declined' && !isCaller);

                  return (
                    <div
                      key={call._id || idx}
                      onClick={() => setSelectedCall({ call, contact, isCaller, isMissed })}
                      style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                      className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100/60 dark:hover:bg-slate-800/40 cursor-pointer transition-all duration-150 active:scale-[0.99] animate-slide-up"
                    >
                      {/* Left: Avatar with overlap badge */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={contact?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact?.name || 'User')}`}
                            alt={contact?.name}
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-200/50 dark:ring-slate-800/50"
                          />
                          {/* Call Direction Badge */}
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 p-1 rounded-full text-white ring-2 ring-white dark:ring-slate-900 ${
                              isMissed
                                ? 'bg-red-500'
                                : isCaller
                                ? 'bg-brand-500'
                                : 'bg-emerald-500'
                            }`}
                          >
                            {isCaller ? (
                              <ArrowUpRight className="w-2.5 h-2.5" />
                            ) : (
                              <ArrowDownLeft className="w-2.5 h-2.5" />
                            )}
                          </span>
                        </div>

                        {/* Middle: Contact Name & Subtitle */}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {contact?.name || 'Unknown User'}
                          </h4>
                          <p
                            className={`text-[11px] font-medium truncate ${
                              isMissed
                                ? 'text-red-500 dark:text-red-400 font-semibold'
                                : 'text-slate-400'
                            }`}
                          >
                            {isCaller ? t('outgoing') : t('incoming')}{' '}
                            {call.type === 'video' ? t('video_call') : t('voice_call')} ·{' '}
                            {getCallTimeLabel(call.createdAt || call.startedAt)}
                          </p>
                        </div>
                      </div>

                      {/* Right: Hover Call-Back Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (contact) startCall(contact, call.type || 'voice');
                        }}
                        className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 rounded-xl transition-all opacity-80 group-hover:opacity-100"
                        title={`${t('call_back')} ${contact?.name || ''}`}
                      >
                        {call.type === 'video' ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <Phone className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lightweight Details Modal */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm glass-modal p-6 space-y-5 animate-pop-in">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {t('call_information')}
              </h3>
              <button
                onClick={() => setSelectedCall(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-2">
              <img
                src={selectedCall.contact?.avatarUrl}
                alt={selectedCall.contact?.name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-brand-500/20 shadow-md"
              />
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {selectedCall.contact?.name}
                </h4>
                <p className="text-xs text-slate-400">{selectedCall.contact?.email}</p>
              </div>

              <Badge
                variant={
                  selectedCall.call.status === 'busy'
                    ? 'warning'
                    : selectedCall.isMissed
                    ? 'danger'
                    : selectedCall.call.status === 'answered'
                    ? 'success'
                    : 'warning'
                }
              >
                {selectedCall.call.status === 'busy'
                  ? t('user_busy')
                  : selectedCall.isMissed
                  ? t('missed_call')
                  : selectedCall.call.status === 'answered'
                  ? t('answered_call')
                  : t('declined_call')}
              </Badge>
            </div>

            <div className="space-y-2 bg-slate-100/70 dark:bg-slate-800/50 p-3 rounded-2xl text-xs font-semibold">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" /> {t('date_time')}
                </span>
                <span>
                  {format(
                    new Date(selectedCall.call.createdAt || selectedCall.call.startedAt),
                    'MMM d, yyyy · HH:mm'
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5" /> {t('duration')}
                </span>
                <span>{formatDuration(selectedCall.call.duration)}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full"
              icon={selectedCall.call.type === 'video' ? Video : Phone}
              onClick={() => {
                const target = selectedCall.contact;
                const type = selectedCall.call.type || 'voice';
                setSelectedCall(null);
                startCall(target, type);
              }}
            >
              {t('call_back')} ({selectedCall.call.type === 'video' ? t('video_call') : t('voice_call')})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallsTab;
