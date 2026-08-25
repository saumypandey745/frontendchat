import React, { useState } from 'react';
import { X, Camera, Loader2, User as UserIcon, Copy, Check, Hash, QrCode, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import useAuth from '../hooks/useAuth';

const EditProfileModal = ({ isOpen, onClose, onOpenQrModal }) => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const appOrigin =
    typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
      ? window.location.origin
      : (import.meta.env.VITE_APP_URL || 'https://frontendchat-pied.vercel.app');
  const qrUrl = user?.chatwaveId ? `${appOrigin}/add/${user.chatwaveId}` : `${appOrigin}/add/0000000000`;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSaving(true);
    setError('');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('bio', bio);
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    const result = await updateProfile(formData);
    setSaving(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.message || 'Failed to update profile');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-brand-500" />
            Edit Profile
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-sm rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer">
              <img
                src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}`}
                alt="Avatar Preview"
                className="w-24 h-24 rounded-full object-cover border-4 border-brand-100 dark:border-brand-900 shadow-md"
              />
              <label
                htmlFor="avatar-input"
                className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
              >
                <Camera className="w-7 h-7" />
              </label>
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click photo to change avatar
            </p>
          </div>

          {/* ChatWave ID Display Card */}
          <div className="p-3.5 bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-900/50 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-brand-500" />
                <span>Your ChatWave ID</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (user?.chatwaveId) {
                    navigator.clipboard.writeText(user.chatwaveId);
                    setCopiedId(true);
                    setTimeout(() => setCopiedId(false), 2000);
                  }
                }}
                className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-base font-mono font-extrabold text-brand-600 dark:text-brand-400 tracking-wider">
                {user?.chatwaveId ? user.chatwaveId.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3') : 'Generating...'}
              </span>
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
              >
                <QrCode className="w-4 h-4 text-purple-500" />
                <span>{showQr ? 'Hide QR' : 'My QR'}</span>
              </button>
            </div>

            {showQr && user?.chatwaveId && (
              <div className="pt-3 border-t border-brand-200/50 dark:border-brand-900/40 text-center animate-fade-in space-y-2">
                <div className="p-3 bg-white rounded-2xl inline-block shadow-md">
                  <QRCodeSVG
                    value={qrUrl}
                    size={140}
                    level="H"
                    marginSize={2}
                    fgColor="#0f172a"
                    bgColor="#ffffff"
                    className="mx-auto rounded-lg"
                  />
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Scan with ChatWave to add as contact
                </p>
                {onOpenQrModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenQrModal('my_code');
                    }}
                    className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center justify-center gap-1 mx-auto pt-1"
                  >
                    <span>Open Full QR Card & Scanner</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm"
              placeholder="Your full name"
              required
            />
          </div>

          {/* Bio / Status */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Bio / About
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={150}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all text-sm resize-none"
              placeholder="What's on your mind?"
            />
            <span className="text-[11px] text-slate-400 dark:text-slate-500 float-right">
              {bio.length}/150
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
