import { useQuery } from '@tanstack/react-query';
import { fetchBillingFeatures } from './billing.api';
import type { FeatureFlag } from './billing.types';

export function useFeatures() {
  const query = useQuery({
    queryKey: ['billing-features'],
    queryFn: fetchBillingFeatures,
    staleTime: 60_000,
    retry: 1,
  });

  const features = query.data ?? [];

  const isEnabled = (key: string): boolean => {
    const found = features.find((feature: FeatureFlag) => feature.key === key);
    return Boolean(found?.enabled);
  };

  return {
    isLoading: query.isLoading,
    error: query.error,
    features,
    isEnabled,
  };
}
