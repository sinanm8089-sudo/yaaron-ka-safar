'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Camera } from 'lucide-react';

export default function StudentPhotosPage() {
  const [photos, setPhotos] = useState<Array<{ id: string; storage_path: string; caption: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPhotos = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });
      setPhotos(data ?? []);
      setLoading(false);
    };
    fetchPhotos();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="aspect-square rounded-[var(--radius-lg)] bg-[var(--color-surface)] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold font-[var(--font-display)] text-[var(--color-text)]">
        Trip Photos
      </h1>

      {photos.length === 0 ? (
        <Card className="text-center py-12">
          <Camera className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--color-text-secondary)]">No photos yet. Stay tuned!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => {
            const supabase = createClient();
            const { data: urlData } = supabase.storage
              .from('trip-photos')
              .getPublicUrl(photo.storage_path);

            return (
              <div
                key={photo.id}
                className="relative aspect-square rounded-[var(--radius-lg)] overflow-hidden border border-[var(--color-border)] group"
              >
                <img
                  src={urlData.publicUrl}
                  alt={photo.caption || 'Trip photo'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-[11px] text-white line-clamp-2">{photo.caption}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
