import PublicLandingPage from './PublicLandingPage';

// This wrapper is needed because Base44 routing doesn't support dynamic route segments
// The actual landing page content is in PublicLandingPage component
export default function PublicLandingPageWrapper() {
  return <PublicLandingPage />;
}
