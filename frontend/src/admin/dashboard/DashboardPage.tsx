import { useNavigate } from 'react-router-dom';
import { useT } from '../../i18n/useT';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card';

export function DashboardPage() {
  const { t } = useT();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t('admin.pageTitles.dashboard')}</h2>
        <p className="text-sm text-muted-foreground">{t('admin.dashboardDescription')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.nav.menu')}</CardTitle>
            <CardDescription>{t('admin.placeholderText')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={() => navigate('/admin/menu')}>
              {t('admin.nav.menu')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.nav.orders')}</CardTitle>
            <CardDescription>{t('admin.placeholderText')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={() => navigate('/admin/orders')}>
              {t('admin.nav.orders')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.nav.billing')}</CardTitle>
            <CardDescription>{t('admin.placeholderText')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={() => navigate('/admin/billing')}>
              {t('admin.nav.billing')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.pageTitles.dashboard')}</CardTitle>
            <CardDescription>{t('admin.comingSoon')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/admin')}>
              {t('admin.nav.dashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
