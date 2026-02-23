import { useT } from '../../i18n/useT';
import { Button } from '../../shared/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../shared/ui/card';

export function DashboardPage() {
  const { t } = useT();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.dashboardTitle')}</CardTitle>
        <CardDescription>{t('admin.dashboardDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{t('admin.placeholderText')}</p>
      </CardContent>
      <CardFooter>
        <Button disabled>{t('admin.comingSoon')}</Button>
      </CardFooter>
    </Card>
  );
}
