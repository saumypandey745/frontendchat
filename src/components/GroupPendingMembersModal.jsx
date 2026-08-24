import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, X, Clock, ShieldCheck } from 'lucide-react';
import api from '../lib/axios';
import useChat from '../hooks/useChat';

const GroupPendingMembersModal = ({ groupId, onClose }) => {
  const { fetchContacts } = useChat();
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/groups/${groupId}/pending-members`);
      if (res.data.success) {
        setPendingMembers(res.data.pendingMembers || []);
      }
    } catch (err) {
      console.error('Fetch pending error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [groupId]);

  const handleAction = async (targetUserId, action) => {
    setActionLoadingId(targetUserId);
    try {
      const res = await api.post(`/groups/${groupId}/pending-members/${targetUserId}/action`, { action });
      if (res.data.success) {
        setPendingMembers((prev) => prev.filter((u) => u._id !== targetUserId));
        fetchContacts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-pop-in">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Pending Join Requests</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-3">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading pending requests...</div>
          ) : pendingMembers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-xs font-bold">No pending join requests</p>
            </div>
          ) : (
            pendingMembers.map((u) => (
              <div
                key={u._id}
                className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      u.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=6366f1&color=fff`
                    }
                    alt={u.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                  />
                  <div className="truncate">
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{u.name}</p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleAction(u._id, 'reject')}
                    disabled={actionLoadingId === u._id}
                    className="p-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 rounded-xl transition-colors"
                    title="Reject Request"
                  >
                    <UserX className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleAction(u._id, 'approve')}
                    disabled={actionLoadingId === u._id}
                    className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow transition-colors flex items-center gap-1 text-xs font-bold"
                  >
                    <UserCheck className="w-4 h-4" /> Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupPendingMembersModal;
