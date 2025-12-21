export function humanUploadError(err: unknown, kind: 'image' | 'video') {
  const fallback =
    kind === 'image'
      ? 'Please upload an image file (JPG, PNG, WEBP).'
      : 'Please upload a video file (MP4, MOV, WEBM).';

  if (!(err instanceof Error)) return fallback;

  const msg = err.message.toLowerCase();

  if (msg.includes('invalid file type')) {
    return fallback;
  }

  if (msg.includes('file size')) {
    return kind === 'image'
      ? 'Image is too large. Max size is 16MB.'
      : 'Video is too large. Max size is 128MB.';
  }

  return err.message || fallback;
}
