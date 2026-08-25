import React, { useState, useEffect } from 'react';
import { Smile, Image, Film, Search, X, Loader2 } from 'lucide-react';

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '<ctrl42>', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤟',
  '🤘', '👌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚',
  '🖐', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '❤️', '🧡',
  '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
  '💞', '💓', '💗', '💖', '💘', '💝', '🔥', '✨', '🌟', '💥',
];

// Local transparent sticker assets (100% reliable)
const STICKER_PACK = [
  { id: 'stk_cat', title: 'Happy Cat', url: '/stickers/cat.svg' },
  { id: 'stk_heart', title: 'Love Heart', url: '/stickers/heart.svg' },
  { id: 'stk_fire', title: 'Fire Flame', url: '/stickers/fire.svg' },
  { id: 'stk_star', title: 'Golden Star', url: '/stickers/star.svg' },
  { id: 'stk_party', title: 'Party Time', url: '/stickers/party.svg' },
  { id: 'stk_thumbsup', title: 'Thumbs Up', url: '/stickers/thumbsup.svg' },
];

// Fallback GIF collection if API key is not specified
const FALLBACK_GIFS = [
  { id: 'gif_1', title: 'Happy Dance', url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3hveGJucWx2ZDVwYmptNmpnN2kxb3hqcTR4ZzUxeGptYTFydnEwdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/blSTtZehjAZ8I/giphy.gif', previewUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3hveGJucWx2ZDVwYmptNmpnN2kxb3hqcTR4ZzUxeGptYTFydnEwdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/blSTtZehjAZ8I/giphy.gif' },
  { id: 'gif_2', title: 'Thumbs Up', url: 'https://media.giphy.com/media/111ebonMs9234s/giphy.gif', previewUrl: 'https://media.giphy.com/media/111ebonMs9234s/giphy.gif' },
  { id: 'gif_3', title: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif', previewUrl: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { id: 'gif_4', title: 'Laughing Cat', url: 'https://media.giphy.com/media/BzytuYY0VWJgzxP1jp/giphy.gif', previewUrl: 'https://media.giphy.com/media/BzytuYY0VWJgzxP1jp/giphy.gif' },
  { id: 'gif_5', title: 'Celebration', url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif', previewUrl: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif' },
  { id: 'gif_6', title: 'Cool Shades', url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif', previewUrl: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif' }
];

const StickerGifPicker = ({ isOpen, onClose, onSelectEmoji, onSendSticker, onSendGif }) => {
  const [activeTab, setActiveTab] = useState('emoji'); // 'emoji' | 'stickers' | 'gifs'
  const [emojiSearch, setEmojiSearch] = useState('');
  const [gifQuery, setGifQuery] = useState('');
  const [gifs, setGifs] = useState(FALLBACK_GIFS);
  const [loadingGifs, setLoadingGifs] = useState(false);

  // Fetch Trending or Searched GIFs from GIPHY API with fallback
  const fetchGifs = async (query = '') => {
    const apiKey = import.meta.env.VITE_GIPHY_API_KEY;
    if (!apiKey) {
      if (query.trim()) {
        const filtered = FALLBACK_GIFS.filter((g) => g.title.toLowerCase().includes(query.toLowerCase()));
        setGifs(filtered);
      } else {
        setGifs(FALLBACK_GIFS);
      }
      return;
    }

    setLoadingGifs(true);
    try {
      const endpoint = query.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=20&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=20&rating=g`;

      const res = await fetch(endpoint);
      const data = await res.json();
      if (data && data.data && data.data.length > 0) {
        const formatted = data.data.map((item) => ({
          id: item.id,
          title: item.title,
          url: item.images?.fixed_height?.url || item.images?.original?.url,
          previewUrl: item.images?.fixed_height_small?.url || item.images?.fixed_height?.url,
        }));
        setGifs(formatted);
      } else {
        setGifs(FALLBACK_GIFS);
      }
    } catch (err) {
      console.error('Failed to fetch GIFs:', err);
      setGifs(FALLBACK_GIFS);
    } finally {
      setLoadingGifs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'gifs') {
      fetchGifs(gifQuery);
    }
  }, [activeTab]);

  if (!isOpen) return null;

  const filteredEmojis = EMOJI_LIST.filter((e) => !emojiSearch || e.includes(emojiSearch));

  return (
    <div className="absolute bottom-20 left-4 z-40 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-pop-in flex flex-col h-96">
      {/* Top Header Tabs */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('emoji')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'emoji'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Emoji</span>
          </button>

          <button
            onClick={() => setActiveTab('stickers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'stickers'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Stickers</span>
          </button>

          <button
            onClick={() => setActiveTab('gifs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              activeTab === 'gifs'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>GIFs</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {/* TAB 1: EMOJI */}
        {activeTab === 'emoji' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search emoji..."
                value={emojiSearch}
                onChange={(e) => setEmojiSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="grid grid-cols-8 gap-2 text-xl">
              {filteredEmojis.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectEmoji(emoji)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-transform active:scale-125 flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: STICKERS */}
        {activeTab === 'stickers' && (
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Default Sticker Pack
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {STICKER_PACK.map((stk) => (
                <button
                  key={stk.id}
                  onClick={() => {
                    onSendSticker(stk.url);
                    onClose();
                  }}
                  className="p-2 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-800 transition-all hover:scale-105 group"
                >
                  <img src={stk.url} alt={stk.title} className="w-14 h-14 object-contain mx-auto group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] text-slate-500 font-semibold block text-center truncate mt-1">
                    {stk.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: GIFS */}
        {activeTab === 'gifs' && (
          <div className="space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchGifs(gifQuery);
              }}
              className="relative"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search GIFs..."
                value={gifQuery}
                onChange={(e) => setGifQuery(e.target.value)}
                className="w-full pl-8 pr-12 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1 px-2.5 py-1 bg-brand-600 text-white rounded-lg text-[10px] font-bold"
              >
                Search
              </button>
            </form>

            {loadingGifs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
              </div>
            ) : gifs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No GIFs found.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    onClick={() => {
                      onSendGif(gif.url);
                      onClose();
                    }}
                    className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:opacity-90 hover:scale-[1.02] transition-all bg-slate-800 group h-28"
                  >
                    <img src={gif.previewUrl} alt={gif.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                      GIF
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StickerGifPicker;
