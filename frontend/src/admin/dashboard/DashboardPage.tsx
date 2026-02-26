import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ApiErrorAlert } from '../../shared/components/ApiErrorAlert';
import { useT } from '../../i18n/useT';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/ui/card';
import { Skeleton } from '../../shared/ui/skeleton';
import { fetchMenuQrPng, fetchMenuQrSvg } from './qr.api';

export function DashboardPage() {
  const { t } = useT();
  const navigate = useNavigate();

  const qrSvgQuery = useQuery({
    queryKey: ['admin-qr-menu-svg'],
    queryFn: fetchMenuQrSvg,
  });

  const handleDownloadSvg = () => {
    if (!qrSvgQuery.data) {
      return;
    }

    const blob = new Blob([qrSvgQuery.data], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'menu-qr.svg';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = async () => {
    const blob = await fetchMenuQrPng();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'menu-qr.png';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.dashboard.qrTitle')}</CardTitle>
          <CardDescription>{t('admin.dashboard.qrDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {qrSvgQuery.isLoading ? (
            <div className="space-y-2">
              <div className="mx-auto w-full max-w-[220px]">
                <Skeleton className="h-[220px] w-full" />
              </div>
              <p className="text-center text-sm text-muted-foreground">{t('admin.dashboard.loadingQr')}</p>
            </div>
          ) : null}

          {qrSvgQuery.error ? <ApiErrorAlert error={qrSvgQuery.error} /> : null}

          {!qrSvgQuery.isLoading && !qrSvgQuery.error && qrSvgQuery.data ? (
            <div className="mx-auto w-full max-w-[220px]" dangerouslySetInnerHTML={{ __html: qrSvgQuery.data }} />
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={handleDownloadSvg} disabled={!qrSvgQuery.data || qrSvgQuery.isLoading}>
              {t('admin.dashboard.downloadSvg')}
            </Button>
            <Button type="button" variant="outline" onClick={() => void handleDownloadPng()} disabled={qrSvgQuery.isLoading}>
              {t('admin.dashboard.downloadPng')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
