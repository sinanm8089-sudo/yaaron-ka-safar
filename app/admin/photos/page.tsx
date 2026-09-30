'use client';

import React, { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Textarea } from '@/components/ui/input';
import { Camera, Upload, Image as ImageIcon, MapPin, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PhotosPage() {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState<Array<{ id: string; storage_path: string; caption: string; created_at: string }>>([]);
  const [caption, setCaption] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });
    setPhotos(data ?? []);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);

    const supabase = createClient();
    const { data: trip } = await supabase.from('trips').select('id').single();
    if (!trip) { setUploading(false); return; }

    // Get location if available
    let latitude: number | undefined;
    let longitude: number | undefined;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    } catch {
      // GPS permission denied or unavailable — continue without location
    }

    for (const file of selectedFiles) {
      const fileName = `${Date.now()}-${file.name}`;
      const path = `trip-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('trip-photos')
        .upload(path, file);

      if (!uploadError) {
        await supabase.from('photos').insert({
          trip_id: trip.id,
          storage_path: path,
          caption: caption || null,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
        });
      }
    }

    setSelectedFiles([]);
    setPreviews([]);
    setCaption('');
    setUploading(false);
    fetchPhotos();
  };

  const removePreview = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
          Photos
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Upload and manage trip photos
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[var(--color-primary)]" />
            Upload Photos
          </CardTitle>
        </CardHeader>

        {/* File Drop Area */}
        <div
          className="border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 text-center hover:border-[var(--color-primary)]/50 transition-colors cursor-pointer mb-4"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2" />
          <p className="text-sm text-[var(--color-text-secondary)]">Click to select photos</p>
          <p className="text-xs text-[var(--color-text-muted)]">JPG, PNG, WEBP</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Previews */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-[var(--radius-md)] overflow-hidden group">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePreview(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {previews.length > 0 && (
          <>
            <Input
              label="Caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe these photos..."
            />
            <div className="mt-4">
              <Button
                onClick={handleUpload}
                loading={uploading}
                className="w-full"
                icon={<Upload className="w-4 h-4" />}
              >
                Upload {selectedFiles.length} Photo{selectedFiles.length > 1 ? 's' : ''}
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Photo Gallery */}
      <div>
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-3">
          Gallery ({photos.length})
        </h2>
        {photos.length === 0 ? (
          <Card className="text-center py-12">
            <ImageIcon className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--color-text-secondary)]">No photos uploaded yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo) => {
              const supabase = createClient();
              const { data: urlData } = supabase.storage
                .from('trip-photos')
                .getPublicUrl(photo.storage_path);

              return (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-elevated)]"
                >
                  <img
                    src={urlData.publicUrl}
                    alt={photo.caption || 'Trip photo'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-xs text-white line-clamp-2">{photo.caption}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
