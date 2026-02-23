import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from './auth.context';
import { useT } from '../i18n/useT';
import { LanguageSwitcher } from '../shared/components/LanguageSwitcher';
import { ApiErrorAlert } from '../shared/components/ApiErrorAlert';
import { Button } from '../shared/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../shared/ui/card';
import { Input } from '../shared/ui/input';
import { Label } from '../shared/ui/label';

export function RegisterPage() {
  const { isAuthenticated, registerOwner } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useT();
  const [submitError, setSubmitError] = useState<unknown>(null);
  const nextParam = searchParams.get('next');
  const nextPath = nextParam && nextParam.startsWith('/admin') ? nextParam : '/admin';

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t('auth.validation.email')),
        password: z.string().min(6, t('auth.validation.passwordMin')),
        restaurantName: z.string().min(1, t('auth.validation.required')),
        slug: z
          .string()
          .min(1, t('auth.validation.required'))
          .regex(/^[a-z0-9-]+$/, t('auth.validation.slugPattern')),
      }),
    [t],
  );

  type RegisterFormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      restaurantName: '',
      slug: '',
    },
  });

  if (isAuthenticated) {
    return <Navigate to={nextPath} replace />;
  }

  const onSubmit = async (values: RegisterFormValues) => {
    setSubmitError(null);
    try {
      await registerOwner(values);
      navigate(nextPath, { replace: true });
    } catch (error) {
      setSubmitError(error);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('auth.registerTitle')}</CardTitle>
          <CardDescription>{t('auth.registerDescription')}</CardDescription>
          <ApiErrorAlert error={submitError} />
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="register-email">
                {t('auth.email')}
              </Label>
              <Input
                id="register-email"
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                {...register('email')}
              />
              {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">
                {t('auth.password')}
              </Label>
              <Input
                id="register-password"
                type="password"
                placeholder={t('auth.passwordPlaceholder')}
                {...register('password')}
              />
              {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurant-name">
                {t('auth.restaurantName')}
              </Label>
              <Input
                id="restaurant-name"
                type="text"
                placeholder={t('auth.restaurantNamePlaceholder')}
                {...register('restaurantName')}
              />
              {errors.restaurantName ? <p className="text-xs text-destructive">{errors.restaurantName.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurant-slug">
                {t('auth.slug')}
              </Label>
              <Input
                id="restaurant-slug"
                type="text"
                placeholder={t('auth.slugPlaceholder')}
                {...register('slug')}
              />
              <p className="text-xs text-muted-foreground">{t('auth.slugHelper')}</p>
              {errors.slug ? <p className="text-xs text-destructive">{errors.slug.message}</p> : null}
            </div>

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('auth.loading') : t('auth.registerButton')}
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
