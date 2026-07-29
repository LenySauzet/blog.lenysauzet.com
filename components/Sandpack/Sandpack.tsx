'use client';

import {
  SandpackConsole,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  type SandpackFiles,
  type SandpackPredefinedTemplate,
} from '@codesandbox/sandpack-react';
import { useEffect, useState } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { RunButton } from './buttons';
import { CodeEditorPane } from './CodeEditorPane';
import { EDITOR_HEIGHT, TOOLBAR_HEIGHT } from './constants';
import { reactSetupFiles } from './setup-files';
import { sandpackTheme } from './theme';
import { Toolbar, type Tab } from './Toolbar';

export interface SandpackProps {
  template?: SandpackPredefinedTemplate;
  files: SandpackFiles;
  dependencies?: Record<string, string>;
  autorun?: boolean;
  defaultTab?: Tab;
}

export function Sandpack({
  template = 'react',
  files,
  dependencies,
  autorun = true,
  defaultTab = 'preview',
}: SandpackProps) {
  const [selectedTab, setSelectedTab] = useState<Tab>(defaultTab);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(true);
  // Remounting SandpackConsole is the only way to clear its logs; each
  // useSandpackConsole holds its own local state.
  const [consoleKey, setConsoleKey] = useState(0);

  // In an effect so the lock is released even if the editor unmounts on a route
  // change without exiting fullscreen.
  useEffect(() => {
    document.body.style.overflow = isFullscreen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const paneHeight = isFullscreen ? '100dvh' : `${EDITOR_HEIGHT}px`;
  const bodyHeight = `calc(${paneHeight} - ${TOOLBAR_HEIGHT}px)`;

  return (
    <TooltipProvider>
      <div className={cn('sandpack-root not-prose my-6', isFullscreen && 'sandpack-fullscreen')}>
        <SandpackProvider
          template={template}
          theme={sandpackTheme}
          files={{ ...files, ...(template === 'react' ? reactSetupFiles : {}) }}
          customSetup={{ dependencies: dependencies ?? {} }}
          options={{ autorun }}
        >
          <SandpackLayout>
            {showCode ? <CodeEditorPane height={paneHeight} /> : null}
            <div
              className="sp-preview-card relative flex flex-1 flex-col overflow-hidden rounded-xl border border-[var(--code-border)] bg-[var(--code-bg)]"
              style={{ height: paneHeight }}
            >
              <div className="pointer-events-none absolute inset-0 z-[1] grid place-items-center">
                <RunButton />
              </div>
              <Toolbar
                selectedTab={selectedTab}
                onTabSelect={setSelectedTab}
                onToggleCode={() => setShowCode((prev) => !prev)}
                onFullscreen={() => setIsFullscreen((prev) => !prev)}
                onClear={() => setConsoleKey((key) => key + 1)}
              />
              <SandpackConsole
                key={consoleKey}
                showHeader
                style={{ height: bodyHeight, display: selectedTab === 'console' ? 'flex' : 'none' }}
              />
              <SandpackPreview
                showRefreshButton={false}
                showOpenInCodeSandbox={false}
                style={{ height: bodyHeight, display: selectedTab === 'preview' ? 'flex' : 'none' }}
              />
            </div>
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </TooltipProvider>
  );
}
