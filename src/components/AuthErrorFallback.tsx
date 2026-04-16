import COPY from '@/lib/copy';

export interface AuthErrorFallbackProps {
  error?: { message?: string; type?: string } | null;
}

/**
 * Full-screen error surface rendered by `AuthenticatedApp` when the app fails
 * to bootstrap for a reason that isn't `auth_required` or `user_not_registered`.
 * Separate from `UserNotRegisteredError` so we don't mask unknown startup
 * failures as an "access restricted" state.
 */
const AuthErrorFallback = ({ error }: AuthErrorFallbackProps) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
    <h1 className="text-2xl font-semibold text-slate-900 mb-2">{COPY.authError.heading}</h1>
    <p className="text-slate-600 max-w-md">{error?.message || COPY.authError.defaultMessage}</p>
  </div>
);

export default AuthErrorFallback;
