// Renders error text as plain React children (never innerHTML) so injected
// complaint/AI text can never execute — XSS safety rule from CLAUDE.md.
export default function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-4 rounded-md border border-danger bg-surface-high px-4 py-3 text-body-md text-danger"
    >
      <span className="whitespace-pre-wrap break-words">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 rounded-md border border-danger px-2.5 py-1 text-label-sm text-danger transition-colors duration-fast hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
        >
          Retry
        </button>
      )}
    </div>
  );
}
