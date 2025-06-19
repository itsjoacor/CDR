// components/LoadingSpinner.tsx
export const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);