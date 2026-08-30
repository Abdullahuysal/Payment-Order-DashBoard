import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from '@/components/ui';
import i18n from '@/i18n';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class AppShellErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[app] uncaught render error', error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="mx-auto mt-10 max-w-md rounded-lg border border-status-down/30 bg-surface p-5 text-center">
        <p className="text-sm font-semibold text-status-down">
          {i18n.t('common:errorBoundary.title')}
        </p>
        <p className="mt-1 text-xs text-fg-muted">{error.message}</p>
        <Button className="mt-4" onClick={() => this.setState({ error: null })}>
          {i18n.t('common:errorBoundary.retry')}
        </Button>
      </div>
    );
  }
}
