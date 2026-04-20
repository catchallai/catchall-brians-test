import './App.css';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import VisualEditAgent from '@/lib/VisualEditAgent';
import NavigationTracker from '@/lib/NavigationTracker';
import { pagesConfig } from './pages.config';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { NavigationGuardProvider } from '@/lib/NavigationGuardContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AuthErrorFallback from '@/components/AuthErrorFallback';

// Routes that should remain reachable without an authenticated session.
// These are landing pages, public share links, and signer/viewer flows that
// rely on room-level tokens or public-join settings rather than user auth.
// Any new public route must be added here explicitly.
const PUBLIC_ROUTES = [
  '/PublicCallJoin',
  '/PublicDataRoom',
  '/PublicDocumentViewer',
  '/PublicDocumentViewerWrapper',
  '/PublicLandingPage',
  '/PublicLandingPageWrapper',
  '/PublicLegalDocumentSigner',
];
// Precomputed lookup set so isPublicRoute is O(1) and doesn't lowercase per call.
const PUBLIC_ROUTES_NORMALIZED = new Set(PUBLIC_ROUTES.map((r) => r.toLowerCase()));
/**
 * Case-insensitive exact match against PUBLIC_ROUTES, tolerating a trailing slash.
 *
 * @param {string} pathname
 * @returns {boolean}
 */
const isPublicRoute = (pathname) =>
  PUBLIC_ROUTES_NORMALIZED.has(pathname.replace(/\/$/, '').toLowerCase());

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey && Pages[mainPageKey] ? Pages[mainPageKey] : () => <></>;

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated, navigateToLogin } =
    useAuth();
  const location = useLocation();
  const onPublicRoute = isPublicRoute(location.pathname);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required' && !onPublicRoute) {
      // Redirect to login automatically (preserves current URL as return target).
      navigateToLogin();
      return null;
    } else if (authError.type !== 'auth_required') {
      // Non-auth startup errors (e.g. 'unknown' from a failed public-settings
      // load) must not be swallowed by the login redirect — surface them so
      // they're diagnosable instead of masking a real failure as "not signed in".
      return <AuthErrorFallback error={authError} />;
    }
  }

  // If auth finished loading without an error but no user is signed in,
  // redirect to login on routes that require auth. Public pages (landing
  // pages, share links, signer flows) stay reachable without a session.
  // navigateToLogin preserves the current URL so email deep links round-trip
  // through the login flow and return to the target page.
  if (!isAuthenticated && !onPublicRoute) {
    navigateToLogin();
    return null;
  }

  // Render the main app
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        }
      />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationGuardProvider>
            <NavigationTracker />
            <AuthenticatedApp />
          </NavigationGuardProvider>
        </Router>
        <SonnerToaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
