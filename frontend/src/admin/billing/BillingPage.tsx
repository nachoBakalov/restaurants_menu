import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n/useT';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card';

export function BillingPage() {
  const { t } = useT();
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.pageTitles.billing')}</CardTitle>
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
