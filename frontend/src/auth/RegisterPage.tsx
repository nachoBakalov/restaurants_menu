import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from './auth.context';
import { t } from '../i18n/i18n';
import { Button } from '../shared/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../shared/ui/card';

export function RegisterPage() {
  const { isAuthenticated, loginPlaceholder } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [slug, setSlug] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!email || !password || !restaurantName || !slug) {
      return;
    }

    loginPlaceholder();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('auth.registerTitle')}</CardTitle>
          <CardDescription>{t('auth.registerDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="register-email">
                {t('auth.email')}
              </label>
              <input
                id="register-email"
                type="email"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="register-password">
                {t('auth.password')}
              </label>
              <input
                id="register-password"
                type="password"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="restaurant-name">
                {t('auth.restaurantName')}
              </label>
              <input
                id="restaurant-name"
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={restaurantName}
                onChange={(event) => setRestaurantName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="restaurant-slug">
                {t('auth.slug')}
              </label>
              <input
                id="restaurant-slug"
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
              />
            </div>

            <Button className="w-full" type="submit">
              {t('auth.registerButton')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center text-sm text-muted-foreground">
          <span>{t('auth.hasAccount')}</span>
          <Link className="ml-1 font-medium text-foreground underline" to="/admin/login">
            {t('auth.toLogin')}
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
