import { apiClient } from '../api/apiClient';
import type { FeatureFlag } from './billing.types';

type FeaturesEnvelope = {
  features?: unknown;
  items?: unknown;
};

type RawFeature = {
  key?: unknown;
  enabled?: unknown;
};

function isFeatureArray(value: unknown): value is RawFeature[] {
  return Array.isArray(value);
}

function normalizeFeature(feature: RawFeature): FeatureFlag | null {
  if (typeof feature.key !== 'string') {
    return null;
  }

  return {
    key: feature.key,
    enabled: Boolean(feature.enabled),
  };
}

function normalizeFeaturesPayload(payload: unknown): FeatureFlag[] {
  const maybeEnvelope = payload as FeaturesEnvelope;
  const rawList = isFeatureArray(maybeEnvelope?.features)
    ? maybeEnvelope.features
    : isFeatureArray(maybeEnvelope?.items)
      ? maybeEnvelope.items
    : isFeatureArray(payload)
      ? payload
      : [];

  return rawList
    .map((item) => normalizeFeature(item as RawFeature))
    .filter((item): item is FeatureFlag => item !== null);
}

export async function fetchBillingFeatures(): Promise<FeatureFlag[]> {
  const { data } = await apiClient.get('/admin/billing/features');
  return normalizeFeaturesPayload(data);
}
