'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

type Media = {
  id: string;
  name: string;
  url: string;
};

export default function MediaGallery({ onSelect }: { onSelect: (url: string) => void }) {
  const [mediaList, setMediaList] = useState<Media[]>([]);

  useEffect(() => {
    const fetchMedia = async () => {
      const res = await fetch('/api/media');
      const data = await res.json();
      setMediaList(data);
    };

    fetchMedia();
  }, []);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {mediaList.map((media) => (
        <div
          key={media.id}
          style={{
            cursor: 'pointer',
            border: '1px solid #ccc',
            width: 100,
            height: 100,
            position: 'relative',
          }}
          onClick={() => onSelect(media.url)}
        >
          <Image
            src={media.url}
            alt={media.name}
            fill
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
        </div>
      ))}
    </div>
  );
}
