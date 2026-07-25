'use client';

import {
  UnstyledOpenInCodeSandboxButton,
  useSandpack,
  useSandpackConsole,
  useSandpackNavigation,
} from '@codesandbox/sandpack-react';
import {
  Delete02Icon,
  Layers01Icon,
  PlayIcon,
  RefreshIcon,
  SourceCodeIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

const toolbarButton =
  'grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.08] hover:text-foreground focus-visible:bg-foreground/[0.08] focus-visible:text-foreground focus-visible:outline-none';

// Centered play overlay, shown until the bundler is running.
export function RunButton() {
  const { sandpack } = useSandpack();
  if (sandpack.status === 'running') return null;
  return (
    <button
      type="button"
      aria-label="Run"
      title="Run"
      onClick={sandpack.runSandpack}
      className="pointer-events-auto grid size-11 place-items-center rounded-full border border-[var(--code-border)] bg-[var(--code-bg)] text-foreground shadow-md transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <HugeiconsIcon icon={PlayIcon} size={20} strokeWidth={2} />
    </button>
  );
}

export function RefreshButton() {
  const { refresh } = useSandpackNavigation();
  return (
    <button type="button" aria-label="Refresh pane" title="Refresh pane" onClick={refresh} className={toolbarButton}>
      <HugeiconsIcon icon={RefreshIcon} size={16} strokeWidth={2} />
    </button>
  );
}

export function OpenInCodeSandboxButton() {
  return (
    <UnstyledOpenInCodeSandboxButton
      title="Open in CodeSandbox"
      aria-label="Open in CodeSandbox"
      className={toolbarButton}
    >
      <HugeiconsIcon icon={Layers01Icon} size={16} strokeWidth={2} />
    </UnstyledOpenInCodeSandboxButton>
  );
}

export function ToggleCodeButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" aria-label="Toggle code" title="Toggle code" onClick={onClick} className={toolbarButton}>
      <HugeiconsIcon icon={SourceCodeIcon} size={16} strokeWidth={2} />
    </button>
  );
}

export function ClearConsoleButton({ onClear }: { onClear: () => void }) {
  const { reset } = useSandpackConsole({ resetOnPreviewRestart: true });
  return (
    <button
      type="button"
      aria-label="Clear console"
      title="Clear console"
      onClick={() => {
        reset();
        onClear();
      }}
      className={toolbarButton}
    >
      <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />
    </button>
  );
}

export { toolbarButton };
