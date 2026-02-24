import { useNavigate } from 'react-router-dom';
import { useFeatures } from '../../billing/useFeatures';
import { useT } from '../../i18n/useT';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card';

export function OrdersPage() {
  const { t } = useT();
  const { isEnabled, isLoading } = useFeatures();
  const navigate = useNavigate();

  const orderingEnabled = isEnabled('ORDERING');
  const isLocked = !isLoading && !orderingEnabled;

  if (isLocked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.locked.orders.title')}</CardTitle>
          <CardDescription>{t('admin.locked.orders.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/admin/billing')}>{t('admin.locked.goToBilling')}</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.pageTitles.orders')}</CardTitle>
        <CardDescription>{t('admin.comingSoon')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={() => navigate('/admin')}>
          {t('admin.nav.dashboard')}
        </Button>
      </CardContent>
    </Card>
  );
}
