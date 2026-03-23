import PublicDocumentViewer from './PublicDocumentViewer';

// Wrapper to allow public access to document viewer without auth
export default function PublicDocumentViewerWrapper() {
  return <PublicDocumentViewer />;
}
