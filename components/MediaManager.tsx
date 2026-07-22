'use client';

import { useRef, useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, Film, Image as ImageIcon, UploadCloud, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export interface MediaItem {
  id?: string;
  url: string;
  type: 'image' | 'video';
  isMain: boolean;
  altText?: string | null;
  sortOrder: number;
}

export default function MediaManager({
  media = [],
  onChange,
  folder = 'products',
}: {
  media: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  folder?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const reindex = (items: MediaItem[]) => items.map((item, i) => ({ ...item, sortOrder: i }));

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append('files', file));
      const data = await api.post<{ files: { url: string }[] }>(`/uploads/multiple?folder=${folder}`, formData);
      const uploaded: MediaItem[] = data.files.map((f, i) => ({
        url: f.url,
        type: files[i]?.type.startsWith('video/') ? 'video' : 'image',
        isMain: media.length === 0 && i === 0,
        sortOrder: media.length + i,
      }));
      onChange(reindex([...media, ...uploaded]));
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const remove = (i: number) => {
    const wasMain = media[i].isMain;
    const next = media.filter((_, idx) => idx !== i);
    if (wasMain && next.length > 0) next[0] = { ...next[0], isMain: true };
    onChange(reindex(next));
  };

  const toggleMain = (i: number) => {
    const makingMain = !media[i].isMain;
    onChange(media.map((m, idx) => ({ ...m, isMain: makingMain ? idx === i : m.isMain && idx !== i })));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= media.length) return;
    const next = [...media];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(reindex(next));
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className="rounded-2xl border border-dashed border-beige-200 bg-beige-50/60 p-4 text-center"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          id="media-upload"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <label
          htmlFor="media-upload"
          className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-burgundy-200 bg-white px-4 py-2.5 text-sm font-sans font-semibold text-burgundy-700 shadow-sm transition hover:bg-burgundy-50 ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
          {uploading ? 'Uploading…' : 'Upload images or videos'}
        </label>
        <p className="mt-2 text-[11px] text-muted-foreground font-sans">Drag & drop or click to upload. Multiple files supported.</p>
        {error && <p className="mt-2 text-[11px] text-red-600 font-sans">{error}</p>}
      </div>

      {media.length === 0 ? (
        <div className="border border-dashed border-beige-200 rounded-lg p-6 text-center text-xs text-muted-foreground font-sans">
          No media yet. Upload images or videos above.
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {media.map((item, i) => (
            <div key={item.id || item.url} className="flex items-center gap-2 p-2 rounded-lg border border-beige-100 bg-white group hover:border-beige-200 transition-colors">
              <div className="flex flex-col">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="text-beige-300 hover:text-foreground disabled:opacity-30 p-0.5">
                  <ChevronUp size={14} />
                </button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i === media.length - 1} className="text-beige-300 hover:text-foreground disabled:opacity-30 p-0.5">
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-beige-50 flex-shrink-0">
                {item.type === 'video' ? (
                  <video src={item.url} muted className="w-full h-full object-cover pointer-events-none" />
                ) : (
                  <img src={item.url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-sans text-foreground truncate">{item.url}</p>
                <div className="flex gap-2 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans inline-flex items-center gap-1 ${item.type === 'video' ? 'bg-purple-50 text-purple-700' : 'bg-sky-50 text-sky-700'}`}>
                    {item.type === 'video' ? <Film size={10} /> : <ImageIcon size={10} />}
                    {item.type}
                  </span>
                  {item.isMain && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-50 text-gold-700 font-sans">Main</span>}
                </div>
              </div>
              <label className="flex items-center gap-1.5 text-[10px] font-sans text-muted-foreground cursor-pointer select-none">
                <input type="checkbox" checked={item.isMain} onChange={() => toggleMain(i)} className="rounded border-gray-300 text-burgundy-700 focus:ring-burgundy-700 w-3.5 h-3.5" />
                Main
              </label>
              <button type="button" onClick={() => remove(i)} className="text-beige-300 hover:text-red-500 transition-colors p-1">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
