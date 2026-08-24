import React, { useState, useEffect } from 'react';
import { Smile, Image, Film, Search, X, Loader2 } from 'lucide-react';

const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤟',
  '🤘', '👌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚',
  '🖐', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '❤️', '🧡',
  '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
  '💞', '💓', '💗', '💖', '💘', '💝', '🔥', '✨', '🌟', '💥',
];

// Bundled sticker pack SVG collection (WhatsApp transparent stickers)
const STICKER_PACK = [
  { id: 'stk_1', title: 'Happy Cat', url: 'https://cdn-icons-png.flaticon.com/512/616/616430.png' },
  { id: 'stk_2', title: 'Love Heart', url: 'https://cdn-icons-png.flaticon.com/512/2107/2107845.png' },
  { id: 'stk_3', title: 'Cool Dog', url: 'https://cdn-icons-png.flaticon.com/512/616/616408.png' },
  { id: 'stk_4', title: 'Party Time', url: 'https://cdn-icons-png.flaticon.com/512/4213/4213641.png' },
  { id: 'stk_5', title: 'Fire Flame', url: 'https://cdn-icons-png.flaticon.com/512/785/785116.png' },
  { id: 'stk_6', title: 'Star Sparkle', url: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png' },
  { id: 'stk_7', title: 'Thumbs Up', url: 'https://cdn-icons-png.flaticon.com/512/889/889221.png' },
  { id: 'stk_8', title: 'Coffee Cup', url: 'https://cdn-icons-png.flaticon.com/512/2935/2935413.png' },
  { id: 'stk_9', title: 'Rocket Ship', url: 'https://cdn-icons-png.flaticon.com/512/1356/1356479.png' },
  { id: 'stk_10', title: 'Mind Blown', url: 'https://cdn-icons-png.flaticon.com/512/924/924989.png' },
  { id: 'stk_11', title: 'Laughing Emoji', url: 'https://cdn-icons-png.flaticon.com/512/742/742751.png' },
  { id: 'stk_12', title: 'Panda Hug', url: 'https://cdn-icons-png.flaticon.com/512/616/616554.png' },
];

const StickerGifPicker = ({ isOpen, onClose, onSelectEmoji, onSendSticker, onSendGif }) => {
  const [activeTab, setActiveTab] = useState('emoji'); // 'emoji' | 'stickers' | 'gifs'
  const [emojiSearch, setEmojiSearch] = useState('');
  const [gifQuery, setGifQuery] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loadingGifs, setLoadingGifs] = useState(false);

  // Fetch Trending or Searched GIFs from GIPHY API
  const fetchGifs = async (query = '') => {
    setLoadingGifs(true);
    try {
      const apiKey = import.meta.env.VITE_GIPHY_API_KEY || 'dc6zaTOxFJmzC';
      const endpoint = query.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=20&rating=g`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=20&rating=g`;

      const res = await fetch(endpoint);
      const data = await res.json();
      if (data && data.data) {
        const formatted = data.data.map((item) => ({
          id: item.id,
          title: item.title,
          url: item.images?.fixed_height?.url || item.images?.original?.url,
          previewUrl: item.images?.fixed_height_small?.url || item.images?.fixed_height?.url,
        }));
        setGifs(formatted);
      }
    } catch (err) {
      console.error('Failed to fetch GIFs:', err);
    } finally {
      setLoadingGifs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'gifs' && gifs.length === 0) {
      fetchGifs();
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
                  <img src={stk.url} alt={stk.title} className="w-16 h-16 object-contain mx-auto group-hover:scale-110 transition-transform" />
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
                placeholder="Search GIFs via GIPHY..."
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
