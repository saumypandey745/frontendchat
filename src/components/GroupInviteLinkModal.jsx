import React, { useState, useEffect } from 'react';
import { Link, Copy, RefreshCw, XCircle, Check, X, ShieldCheck } from 'lucide-react';
import api from '../lib/axios';

const GroupInviteLinkModal = ({ groupId, groupName, isAdmin, onClose }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [inviteRevoked, setInviteRevoked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const fetchLink = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/groups/${groupId}/invite-link`);
      if (res.data.success) {
        setInviteCode(res.data.inviteCode);
        setInviteRevoked(res.data.inviteRevoked);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch invite link');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLink();
  }, [groupId]);

  const fullUrl = inviteCode ? `${window.location.origin}/join/${inviteCode}` : '';

  const handleCopy = () => {
    if (!fullUrl) return;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = async () => {
    if (!confirm('Resetting will invalidate the previous invite link. Continue?')) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/groups/${groupId}/invite-link/reset`);
      if (res.data.success) {
        setInviteCode(res.data.inviteCode);
        setInviteRevoked(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Reset failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm('Revoking will disable joining via this invite link. Continue?')) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/groups/${groupId}/invite-link/revoke`);
      if (res.data.success) {
        setInviteRevoked(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Revoke failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-pop-in">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Link className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Group Invite Link</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Anyone on ChatWave can use this link to join <strong className="text-slate-800 dark:text-slate-200">{groupName}</strong>. Share it only with people you trust.
          </p>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading invite link...</div>
          ) : error ? (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-2xl text-xs font-semibold">
              {error}
            </div>
          ) : inviteRevoked ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-amber-600 dark:text-amber-400 text-xs font-semibold text-center">
              ⚠️ This invite link has been revoked by a group admin.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate select-all">
                  {fullUrl}
                </span>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Admin Controls */}
          {isAdmin && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Admin Actions</p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleReset}
                  disabled={actionLoading}
                  className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${actionLoading ? 'animate-spin' : ''}`} />
                  <span>Reset Link</span>
                </button>

                <button
                  onClick={handleRevoke}
                  disabled={actionLoading || inviteRevoked}
                  className="py-2.5 px-3 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Revoke Link</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupInviteLinkModal;
