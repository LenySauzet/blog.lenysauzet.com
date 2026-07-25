'use client';

import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  type SandpackFiles,
  type SandpackPredefinedTemplate,
} from '@codesandbox/sandpack-react';
import { useState } from 'react';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { cn } from '@/lib/utils';

import { RunButton } from './buttons';
import { reactSetupFiles } from './setup-files';
import { sandpackTheme } from './theme';
import { Toolbar, type Tab } from './Toolbar';

const EDITOR_HEIGHT = 560;
const TOOLBAR_HEIGHT = 48;

const setupByTemplate: Partial<Record<SandpackPredefinedTemplate, SandpackFiles>> = {
  react: reactSetupFiles,
};

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
  const isMobile = useIsMobile();
  const [selectedTab, setSelectedTab] = useState<Tab>(defaultTab);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // null = follow the viewport (editor hidden on mobile); a boolean once the
  // user toggles it explicitly. Derived, so no setState-in-effect is needed.
  const [codeOverride, setCodeOverride] = useState<boolean | null>(null);
  // Bumping the key remounts the console, which is how Sandpack clears it.
  const [consoleKey, setConsoleKey] = useState(0);

  const displayCode = codeOverride ?? !isMobile;
  const shouldAutorun = autorun && !isMobile;

  const toggleFullscreen = () =>
    setIsFullscreen((prev) => {
      document.body.style.overflow = prev ? '' : 'hidden';
      return !prev;
    });

  const paneHeight = isFullscreen ? '100dvh' : `${EDITOR_HEIGHT}px`;
  const bodyHeight = `calc(${paneHeight} - ${TOOLBAR_HEIGHT}px)`;

  return (
    <div className={cn('sandpack-root not-prose my-6', isFullscreen && 'sandpack-fullscreen')}>
      <SandpackProvider
        template={template}
        theme={sandpackTheme}
        files={{ ...files, ...setupByTemplate[template] }}
        customSetup={{ dependencies: dependencies ?? {} }}
        options={{ autorun: shouldAutorun }}
      >
        <SandpackLayout>
          {displayCode ? (
            <SandpackCodeEditor showRunButton={false} showTabs showLineNumbers style={{ height: paneHeight }} />
          ) : null}
          <div
            className="relative flex flex-1 flex-col overflow-hidden bg-[var(--code-bg)]"
            style={{ height: paneHeight }}
          >
            <div className="pointer-events-none absolute inset-0 z-[1] grid place-items-center">
              <RunButton />
            </div>
            <Toolbar
              selectedTab={selectedTab}
              onTabSelect={setSelectedTab}
              onToggleCode={() => setCodeOverride(!displayCode)}
              onFullscreen={toggleFullscreen}
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
  );
}
