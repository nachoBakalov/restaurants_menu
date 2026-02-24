import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-lg border bg-background p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold">Страницата не е намерена</h1>
        <p className="mt-2 text-sm text-muted-foreground">Провери адреса или се върни към входа.</p>
        <Link
          to="/admin/login"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-input px-4 text-sm font-medium"
        >
          Към вход
        </Link>
      </div>
    </main>
  );
}
