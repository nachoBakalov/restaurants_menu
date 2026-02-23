import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from './auth.context';
import { t } from '../i18n/i18n';
import { Button } from '../shared/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../shared/ui/card';

export function LoginPage() {
  const { isAuthenticated, loginPlaceholder } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!email || !password) {
      return;
    }

    loginPlaceholder();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('auth.loginTitle')}</CardTitle>
          <CardDescription>{t('auth.loginDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                {t('auth.email')}
              </label>
              <input
                id="email"
                type="email"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="master@local.test"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <Button className="w-full" type="submit">
              {t('auth.loginButton')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          <span>{t('auth.noAccount')}</span>
          <Link className="ml-1 font-medium text-foreground underline" to="/admin/register">
            {t('auth.toRegister')}
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
