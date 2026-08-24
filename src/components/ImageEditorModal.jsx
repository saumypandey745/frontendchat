import React, { useRef, useState, useEffect } from 'react';
import { X, Edit3, Type, Crop, RotateCcw, Send, Check, Undo, Palette } from 'lucide-react';

const COLOR_PALETTE = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#ffffff', '#000000', '#ec4899'];

const ImageEditorModal = ({ isOpen, onClose, imageDataUrl, onSendEditedImage }) => {
  const canvasRef = useRef(null);
  const [activeTool, setActiveTool] = useState('doodle'); // 'doodle' | 'text' | 'crop'
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [lineWidth, setLineWidth] = useState(4);

  const [overlayText, setOverlayText] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);

  // Load image onto canvas on open
  useEffect(() => {
    if (isOpen && imageDataUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageDataUrl;
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        saveState();
      };
    }
  }, [isOpen, imageDataUrl]);

  if (!isOpen || !imageDataUrl) return null;

  const saveState = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const data = canvas.toDataURL();
      setHistory((prev) => [...prev.slice(-10), data]);
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const prevHistory = [...history];
    prevHistory.pop();
    const lastState = prevHistory[prevHistory.length - 1];
    setHistory(prevHistory);

    const img = new Image();
    img.src = lastState;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  };

  // Drawing Handlers
  const startDrawing = (e) => {
    if (activeTool !== 'doodle') return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e) => {
    if (!isDrawing || activeTool !== 'doodle') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  // Add Text Overlay onto Canvas
  const handleAddText = () => {
    if (!overlayText.trim()) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillStyle = drawColor;
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 6;
    ctx.fillText(overlayText, 30, canvas.height - 40);

    setOverlayText('');
    saveState();
  };

  // Crop Preset Handler
  const handleCropPreset = (aspectRatio) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let targetW = canvas.width;
    let targetH = canvas.height;

    if (aspectRatio === '1:1') {
      const minDim = Math.min(canvas.width, canvas.height);
      targetW = minDim;
      targetH = minDim;
    } else if (aspectRatio === '4:3') {
      targetH = Math.round((canvas.width * 3) / 4);
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetW;
    tempCanvas.height = targetH;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0, targetW, targetH, 0, 0, targetW, targetH);

    canvas.width = targetW;
    canvas.height = targetH;
    ctx.drawImage(tempCanvas, 0, 0);
    saveState();
  };

  // Export edited canvas to File and submit
  const handleSend = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      const editedFile = new File([blob], `edited_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      onSendEditedImage(editedFile);
      onClose();
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Top Header Controls */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTool('doodle')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeTool === 'doodle' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Doodle</span>
            </button>

            <button
              onClick={() => setActiveTool('text')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeTool === 'text' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Text</span>
            </button>

            <button
              onClick={() => setActiveTool('crop')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                activeTool === 'crop' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Crop className="w-4 h-4" />
              <span>Crop</span>
            </button>

            <button
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 disabled:opacity-40"
              title="Undo"
            >
              <Undo className="w-4 h-4" />
            </button>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Color Palette Bar */}
        <div className="flex items-center gap-2 px-5 py-2 bg-slate-950 border-b border-slate-800 overflow-x-auto">
          <Palette className="w-4 h-4 text-slate-500 flex-shrink-0" />
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setDrawColor(c)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                drawColor === c ? 'scale-125 border-white ring-2 ring-brand-500' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Canvas Display Viewport */}
        <div className="relative flex-1 bg-black flex items-center justify-center p-4 min-h-[320px] max-h-[480px] overflow-hidden select-none">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={(e) => startDrawing(e.touches[0])}
            onTouchMove={(e) => draw(e.touches[0])}
            onTouchEnd={stopDrawing}
            className="max-w-full max-h-full object-contain rounded-2xl cursor-crosshair shadow-2xl"
          />
        </div>

        {/* Tool Settings Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          {activeTool === 'text' && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type text overlay..."
                value={overlayText}
                onChange={(e) => setOverlayText(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                onClick={handleAddText}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl"
              >
                Add Text
              </button>
            </div>
          )}

          {activeTool === 'crop' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-bold">Crop Presets:</span>
              <button
                onClick={() => handleCropPreset('1:1')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold"
              >
                Square (1:1)
              </button>
              <button
                onClick={() => handleCropPreset('4:3')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold"
              >
                Standard (4:3)
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">
              Cancel
            </button>
            <button
              onClick={handleSend}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-600/30"
            >
              <Send className="w-4 h-4" /> Send Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorModal;
