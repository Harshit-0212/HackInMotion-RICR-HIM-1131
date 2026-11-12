import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ProfilePhotoUploadProps {
  photoUrl?: string;
  shape?: 'circle' | 'rounded' | 'square';
  onChange: (photoUrl: string) => void;
  onShapeChange: (shape: 'circle' | 'rounded' | 'square') => void;
  onRemove: () => void;
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({
  photoUrl,
  shape = 'circle',
  onChange,
  onShapeChange,
  onRemove,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Client-side crop & resize to square 400x400 max using HTML Canvas
        const canvas = document.createElement('canvas');
        const size = Math.min(img.width, img.height);
        const targetDim = Math.min(size, 400);
        canvas.width = targetDim;
        canvas.height = targetDim;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Center crop
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;
        ctx.drawImage(img, startX, startY, size, size, 0, 0, targetDim, targetDim);

        // Compress under 200KB via JPEG quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onChange(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  const shapeClass = shape === 'square' ? 'rounded-none' : shape === 'rounded' ? 'rounded-2xl' : 'rounded-full';

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          Profile Photo
        </label>
        {photoUrl && (
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => onShapeChange('circle')}
              className={`px-2 py-0.5 rounded text-xs font-medium ${shape === 'circle' ? 'bg-[#6542C5] text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'}`}
            >
              Circle
            </button>
            <button
              type="button"
              onClick={() => onShapeChange('rounded')}
              className={`px-2 py-0.5 rounded text-xs font-medium ${shape === 'rounded' ? 'bg-[#6542C5] text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'}`}
            >
              Rounded
            </button>
            <button
              type="button"
              onClick={() => onShapeChange('square')}
              className={`px-2 py-0.5 rounded text-xs font-medium ${shape === 'square' ? 'bg-[#6542C5] text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'}`}
            >
              Square
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {photoUrl ? (
          <div className="relative group">
            <img
              src={photoUrl}
              alt="Profile"
              className={`w-20 h-20 object-cover border-2 border-[#6542C5] shadow-xs ${shapeClass}`}
            />
            <button
              type="button"
              onClick={onRemove}
              className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full shadow hover:bg-red-600"
              title="Remove photo"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-[#6542C5] flex flex-col items-center justify-center cursor-pointer transition-colors text-zinc-400 hover:text-[#6542C5]"
          >
            <ImageIcon size={20} />
            <span className="text-[10px] mt-1 font-medium">Add Photo</span>
          </div>
        )}

        <div className="flex-1 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
          <p className="font-medium text-zinc-700 dark:text-zinc-200">
            {photoUrl ? 'Photo loaded & ready' : 'Upload professional headshot'}
          </p>
          <p className="text-[11px]">Square cropped automatically (max 400x400, compressed). Supported templates will render your photo.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
          {!photoUrl && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:border-[#6542C5]"
            >
              <Upload size={12} /> Choose Image
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

