import React, { useState } from 'react';
import { X, Search, UserPlus, Check } from 'lucide-react';
import useChat from '../hooks/useChat';
import api from '../lib/axios';
import Button from './ui/Button';

const AddMemberModal = ({ isOpen, onClose, group }) => {
  const { contacts, fetchContacts } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !group) return null;

  const existingMemberIds = (group.members || []).map((m) =>
    (m.userId?._id || m.userId || '').toString()
  );

  // Available contacts (not already in the group)
  const availableContacts = contacts.filter((c) => {
    const contactId = (c.user?._id || c.user || '').toString();
    return !existingMemberIds.includes(contactId);
  });

  const filteredContacts = availableContacts.filter((c) =>
    c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (userId) => {
    if (selectedIds.includes(userId)) {
      setSelectedIds(selectedIds.filter((id) => id !== userId));
    } else {
      setSelectedIds([...selectedIds, userId]);
    }
  };

  const handleAddMembers = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post(`/groups/${group._id}/members`, {
        memberIds: selectedIds,
      });
      if (res.data.success) {
        fetchContacts();
        onClose();
        setSelectedIds([]);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add members');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Add Members</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts to add..."
            className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-100/70 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>

        {/* Contact List */}
        <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredContacts.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400">
              No contacts available to add.
            </p>
          ) : (
            filteredContacts.map((c) => {
              const isSelected = selectedIds.includes(c.user._id);
              return (
                <div
                  key={c.user._id}
                  onClick={() => toggleSelect(c.user._id)}
                  className="pt-2 flex items-center justify-between p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={c.user.avatarUrl}
                      alt={c.user.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {c.user.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{c.user.email}</p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="brand"
            size="sm"
            onClick={handleAddMembers}
            disabled={selectedIds.length === 0 || loading}
            loading={loading}
          >
            Add Selected ({selectedIds.length})
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
