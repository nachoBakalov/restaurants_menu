import axios from 'axios';
import { useT } from '../../i18n/useT';

type ApiErrorAlertProps = {
  error: unknown;
};

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | {
          error?: {
            code?: string;
            message?: string;
          };
          message?: string;
        }
      | undefined;

    const code = data?.error?.code;
    const message = data?.error?.message ?? data?.message;

    if (message && code) {
      return `${message} (${code})`;
    }

    if (message) {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function ApiErrorAlert({ error }: ApiErrorAlertProps) {
  const { t } = useT();

  if (!error) {
    return null;
  }

  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {extractErrorMessage(error, t('auth.error.generic'))}
    </div>
  );
}
