import React, { useState } from 'react';
import {
  X,
  Settings,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  HardDrive,
  Globe,
  HelpCircle,
  Share2,
  QrCode,
  Volume2,
  Type,
  Wifi,
  Trash2,
  Check,
  Copy,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuth from '../hooks/useAuth';
import useChat from '../hooks/useChat';
import StatusPrivacyModal from './StatusPrivacyModal';

const AccountSettingsModal = ({ isOpen, onClose, onOpenEditProfile }) => {
  const { t, i18n } = useTranslation();
  const { user, updateSettings } = useAuth();
  const { contacts, groups } = useChat();

  const [activeTab, setActiveTab] = useState('privacy'); // 'privacy' | 'storage' | 'appearance' | 'language' | 'help' | 'invite'
  const [isStatusPrivacyOpen, setIsStatusPrivacyOpen] = useState(false);

  // Account / Privacy
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [hideOnlineStatus, setHideOnlineStatus] = useState(user?.hideOnlineStatus || false);

  // Storage & Network
  const [lowDataMode, setLowDataMode] = useState(user?.lowDataMode || false);
  const [autoDownload, setAutoDownload] = useState(user?.autoDownload || 'wifi'); // 'wifi' | 'always' | 'never'

  // Appearance & Notification
  const [fontSize, setFontSize] = useState(user?.fontSize || 'medium'); // 'small' | 'medium' | 'large'
  const [notificationTone, setNotificationTone] = useState(user?.notificationTone || 'chime');

  // FAQ Accordion
  const [openFaqIdx, setOpenFaqIdx] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('chatwave_lang', langCode);
    updateSettings({ language: langCode });
  };

  const handleShareInvite = async () => {
    const inviteUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on ChatWave',
          text: 'Connect with me on ChatWave for fast, secure end-to-end messaging!',
          url: inviteUrl,
        });
      } catch (e) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword) {
      if (newPassword !== confirmNewPassword) {
        setError('New passwords do not match');
        return;
      }
      if (!currentPassword) {
        setError('Current password is required to change password');
        return;
      }
    }

    setSaving(true);

    const settingsData = {
      hideOnlineStatus,
      lowDataMode,
      autoDownload,
      fontSize,
      notificationTone,
    };
    if (newPassword) {
      settingsData.currentPassword = currentPassword;
      settingsData.newPassword = newPassword;
    }

    const result = await updateSettings(settingsData);
    setSaving(false);

    if (result.success) {
      setSuccess('Settings updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1200);
    } else {
      setError(result.message || 'Failed to update settings');
    }
  };

  const isGoogleUser = user?.authProvider === 'google' && !user?.hasPassword;

  const faqItems = [
    {
      q: 'How do I add a new contact?',
      a: 'Click the "+" user icon at the top of your chat list, enter their 10-digit ChatWave ID, and click Add Contact.',
    },
    {
      q: 'Is live location sharing continuous?',
      a: 'Live location updates automatically in real-time until your selected duration (15m / 1h / 8h) expires or you tap "Stop sharing".',
    },
    {
      q: 'How does Disappearing Messages work?',
      a: 'When turned on, new messages sent in that chat automatically self-destruct after 24 hours, 7 days, or 90 days.',
    },
    {
      q: 'What is Low Data Mode for calls?',
      a: 'Enabling Low Data Mode caps video resolution and audio bitrate during WebRTC calls to save mobile bandwidth.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-500" />
            {t('settings')}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar + Main Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-48 bg-slate-50 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 p-2 space-y-1 overflow-y-auto">
            {[
              { id: 'privacy', label: t('privacy'), icon: Lock },
              { id: 'storage', label: t('storage'), icon: HardDrive },
              { id: 'appearance', label: t('appearance'), icon: Type },
              { id: 'language', label: t('language'), icon: Globe },
              { id: 'help', label: t('help'), icon: HelpCircle },
              { id: 'invite', label: t('invite_friend'), icon: Share2 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                    activeTab === tab.id
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}

            {/* Direct My QR Code Button */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenEditProfile) onOpenEditProfile();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900 hover:bg-brand-100 transition-all"
              >
                <QrCode className="w-4 h-4" />
                <span>{t('my_qr')}</span>
              </button>
            </div>
          </div>

          {/* Tab Content Panel */}
          <form onSubmit={handleSubmit} className="flex-1 p-6 overflow-y-auto space-y-5 custom-scrollbar">
            {error && (
              <div className="p-3 text-xs rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-xs rounded-xl bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800/50 text-green-600 dark:text-green-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {success}
              </div>
            )}

            {/* TAB 1: PRIVACY & ACCOUNT */}
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-brand-500" />
                  {t('privacy')}
                </h4>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {t('status_privacy_title')}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {t('status_privacy_desc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStatusPrivacyOpen(true)}
                    className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {t('configure')}
                  </button>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {t('hide_online_status')}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {t('hide_online_desc')}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hideOnlineStatus}
                        onChange={(e) => setHideOnlineStatus(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600" />
                    </label>
                  </div>
                </div>

                {!isGoogleUser ? (
                  <div className="space-y-3 pt-2">
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('change_password')}</h5>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">{t('current_password')}</label>
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">{t('new_password')}</label>
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 p-3 bg-slate-100 dark:bg-slate-800/40 rounded-xl">
                    {t('managed_by_google')}
                  </p>
                )}
              </div>
            )}

            {/* TAB 2: STORAGE & DATA */}
            {activeTab === 'storage' && (
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-brand-500" />
                  {t('storage_breakdown')}
                </h4>

                {/* Media Breakdown Bar */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{t('total_media_storage')}</span>
                    <span className="text-brand-600 dark:text-brand-400">71.5 MB</span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
                    <div className="h-full bg-blue-500 w-[20%]" title={`${t('photos')}: 14.2 MB`} />
                    <div className="h-full bg-purple-500 w-[64%]" title={`${t('videos')}: 45.8 MB`} />
                    <div className="h-full bg-emerald-500 w-[11%]" title={`${t('documents')}: 8.4 MB`} />
                    <div className="h-full bg-amber-500 w-[5%]" title={`${t('voice')}: 3.1 MB`} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> {t('photos')}: 14.2 MB</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> {t('videos')}: 45.8 MB</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {t('documents')}: 8.4 MB</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> {t('voice')}: 3.1 MB</div>
                  </div>
                </div>

                {/* Network & Low Data Mode */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {t('low_data')}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {t('low_data_desc')}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={lowDataMode}
                        onChange={(e) => setLowDataMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600" />
                    </label>
                  </div>
                </div>

                {/* Auto Download Policy */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('auto_download')}
                  </label>
                  <select
                    value={autoDownload}
                    onChange={(e) => setAutoDownload(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="wifi">{t('wifi_only')}</option>
                    <option value="always">{t('always')}</option>
                    <option value="never">{t('never')}</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 3: APPEARANCE & TONE */}
            {activeTab === 'appearance' && (
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Type className="w-4 h-4 text-brand-500" />
                  {t('appearance')}
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('font_size')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['small', 'medium', 'large'].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setFontSize(size)}
                        className={`py-2 text-xs font-bold rounded-xl border capitalize transition-all ${
                          fontSize === size
                            ? 'bg-brand-600 text-white border-brand-600 shadow'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {t(size)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('custom_tone')}
                  </label>
                  <select
                    value={notificationTone}
                    onChange={(e) => setNotificationTone(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="chime">🔔 Chime</option>
                    <option value="pulse">⚡ Pulse</option>
                    <option value="synth">🎶 Synth</option>
                    <option value="classic">📞 Classic Bell</option>
                    <option value="silent">🔇 Silent</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 4: LANGUAGE */}
            {activeTab === 'language' && (
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-brand-500" />
                  {t('language')}
                </h4>

                <div className="space-y-2">
                  {[
                    { code: 'en', name: 'English (US)', flag: '🇺🇸' },
                    { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
                    { code: 'hi', name: 'हिंदी (Hindi)', flag: '🇮🇳' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all ${
                        i18n.language === lang.code
                          ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 font-bold text-brand-600 dark:text-brand-400'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-xs">{lang.name}</span>
                      </div>
                      {i18n.language === lang.code && <Check className="w-4 h-4 text-brand-500" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: HELP & FAQ */}
            {activeTab === 'help' && (
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-brand-500" />
                  {t('faq')}
                </h4>

                <div className="space-y-2">
                  {faqItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIdx(openFaqIdx === idx ? null : idx)}
                        className="w-full px-4 py-3 text-left text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between"
                      >
                        <span>{item.q}</span>
                        {openFaqIdx === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {openFaqIdx === idx && (
                        <div className="px-4 pb-3 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 pt-2">
                          {item.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center space-y-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('about')}</p>
                  <p className="text-[10px] text-slate-500">ChatWave v1.4.0 (Production Build 2026.08)</p>
                </div>
              </div>
            )}

            {/* TAB 6: INVITE FRIEND */}
            {activeTab === 'invite' && (
              <div className="space-y-4 text-center py-4">
                <Share2 className="w-12 h-12 text-brand-500 mx-auto animate-bounce" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Invite your friends to ChatWave
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Share the ChatWave app link so your friends can start messaging with zero friction!
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleShareInvite}
                    className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 mx-auto shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Share / Copy Invite Link'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('save_settings')}
              </button>
            </div>
          </form>
        </div>
      </div>
      <StatusPrivacyModal
        isOpen={isStatusPrivacyOpen}
        onClose={() => setIsStatusPrivacyOpen(false)}
      />
    </div>
  );
};

export default AccountSettingsModal;
