export type FeatureKey = 'ORDERING' | string;

export type FeatureFlag = {
  key: FeatureKey;
  enabled: boolean;
};
