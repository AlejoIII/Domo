import { useQuery } from '@tanstack/react-query';
import { fetchSignedUploadUrl, needsSignedUploadUrl } from '@/services/upload.service';

export function useUploadUrl(path?: string | null) {
  return useQuery({
    queryKey: ['upload-signed-url', path],
    queryFn: () => fetchSignedUploadUrl(path!),
    enabled: !!path && needsSignedUploadUrl(path),
    staleTime: 12 * 60_000,
    retry: 1,
  });
}
