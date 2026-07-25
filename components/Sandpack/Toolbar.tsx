'use client';

import { FullScreenIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { cn } from '@/lib/utils';

import {
  ClearConsoleButton,
  OpenInCodeSandboxButton,
  RefreshButton,
  ToggleCodeButton,
  toolbarButton,
} from './buttons';

export type Tab = 'preview' | 'console';

interface ToolbarProps {
  selectedTab: Tab;
  onTabSelect: (tab: Tab) => void;
  onToggleCode: () => void;
  onFullscreen: () => void;
  onClear: () => void;
}

export function Toolbar({
  selectedTab,
  onTabSelect,
  onToggleCode,
  onFullscreen,
  onClear,
}: ToolbarProps) {
  const tabButton = (tab: Tab, label: string) => (
    <button
      type="button"
      aria-pressed={selectedTab === tab}
      onClick={() => onTabSelect(tab)}
      className={cn(
        'rounded-lg border px-3 py-1 text-sm transition-colors',
        selectedTab === tab
          ? 'border-[var(--code-border)] bg-[var(--code-bg)] text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-12 w-full items-center justify-between gap-2 border-b border-[var(--code-border)] bg-background px-2">
      <div className="flex items-center gap-1">
        <ToggleCodeButton onClick={onToggleCode} />
        {tabButton('preview', 'Preview')}
        {tabButton('console', 'Console')}
      </div>
      <div className="flex items-center gap-0.5">
        {selectedTab === 'preview' ? (
          <>
            <button
              type="button"
              aria-label="Fullscreen"
              title="Fullscreen"
              onClick={onFullscreen}
              className={cn(toolbarButton, 'max-[750px]:hidden')}
            >
              <HugeiconsIcon icon={FullScreenIcon} size={16} strokeWidth={2} />
            </button>
            <RefreshButton />
            <OpenInCodeSandboxButton />
          </>
        ) : (
          <ClearConsoleButton onClear={onClear} />
        )}
      </div>
    </div>
  );
}
