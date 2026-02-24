import { useFeatures } from '../../billing/useFeatures';
import { useT } from '../../i18n/useT';
import { Badge } from '../../shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card';
import { Skeleton } from '../../shared/ui/skeleton';

export function BillingPage() {
  const { t } = useT();
  const { isLoading, error, features, isEnabled } = useFeatures();

  const orderingEnabled = isEnabled('ORDERING');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.billing.title')}</CardTitle>
        <CardDescription>{t('admin.features.title')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : null}

        {!isLoading && error ? <p className="text-sm text-destructive">{t('admin.common.errorLoading')}</p> : null}

        {!isLoading && !error ? (
          <div className="rounded-md border">
            <div className="flex items-center justify-between border-b px-4 py-3 text-sm">
              <span>{t('admin.features.ordering')}</span>
              <Badge variant={orderingEnabled ? 'default' : 'secondary'}>
                {orderingEnabled ? t('admin.features.enabled') : t('admin.features.disabled')}
              </Badge>
            </div>

            {features
              .filter((feature) => feature.key !== 'ORDERING')
              .map((feature) => (
                <div key={feature.key} className="flex items-center justify-between border-b px-4 py-3 text-sm last:border-b-0">
                  <span>{feature.key}</span>
                  <Badge variant={feature.enabled ? 'default' : 'secondary'}>
                    {feature.enabled ? t('admin.features.enabled') : t('admin.features.disabled')}
                  </Badge>
                </div>
              ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
