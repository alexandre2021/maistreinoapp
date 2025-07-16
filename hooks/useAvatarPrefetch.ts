import { Image as ExpoImage } from 'expo-image';
import { useEffect } from 'react';

export function useAvatarPrefetch(uri?: string) {
  useEffect(() => {
    if (uri) {
      ExpoImage.prefetch(uri, 'memory-disk');
    }
  }, [uri]);
}
