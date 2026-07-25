'use client';

import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
  type SandpackFiles,
  type SandpackPredefinedTemplate,
} from '@codesandbox/sandpack-react';
import { useEffect, useRef, useState } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { RunButton } from './buttons';
import { reactSetupFiles } from './setup-files';
import { sandpackTheme } from './theme';
import { Toolbar, type Tab } from './Toolbar';

const EDITOR_HEIGHT = 560;
const TOOLBAR_HEIGHT = 48;
// Distance over which an edge fade reaches full opacity.
const FADE = 24;

const setupByTemplate: Partial<Record<SandpackPredefinedTemplate, SandpackFiles>> = {
  react: reactSetupFiles,
};

// Keyed on the active file, so it remounts and replays its fade-out each switch,
// hiding CodeMirror's reflow. No state — the animation lives in CSS.
function EditorSwitchMask() {
  const { sandpack } = useSandpack();
  return (
    <div
      key={sandpack.activeFile}
      aria-hidden="true"
      className="sp-switch-mask pointer-events-none absolute inset-x-0 z-[4] bg-[var(--code-bg)]"
      style={{ top: `${TOOLBAR_HEIGHT}px`, bottom: 0 }}
    />
  );
}

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
  // Bumping the key remounts the console, which is how Sandpack clears it.
  const [consoleKey, setConsoleKey] = useState(0);
  const editorWrap = useRef<HTMLDivElement>(null);

  // Fade the editor's horizontal-overflow shadows with the scroll position. The
  // listener is capture-phase on the wrapper, so it survives CodeMirror
  // re-creating its scroller on file switches.
  useEffect(() => {
    const wrap = editorWrap.current;
    if (!wrap) return;
    const clamp = (value: number) => Math.min(Math.max(value, 0), 1);
    const update = () => {
      const scroller = wrap.querySelector('.cm-scroller');
      if (!scroller) return;
      const gutter = wrap.querySelector('.cm-gutters');
      wrap.style.setProperty('--gutter-w', gutter ? `${gutter.getBoundingClientRect().width}px` : '0px');
      const max = scroller.scrollWidth - scroller.clientWidth;
      const left = max <= 1 ? 0 : clamp(scroller.scrollLeft / FADE);
      const right = max <= 1 ? 0 : clamp((max - scroller.scrollLeft) / FADE);
      wrap.style.setProperty('--edge-left', String(left));
      wrap.style.setProperty('--edge-right', String(right));
    };
    update();
    wrap.addEventListener('scroll', update, { capture: true, passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(wrap);
    return () => {
      wrap.removeEventListener('scroll', update, { capture: true });
      observer.disconnect();
    };
  }, [showCode]);

  const toggleFullscreen = () =>
    setIsFullscreen((prev) => {
      document.body.style.overflow = prev ? '' : 'hidden';
      return !prev;
    });

  const paneHeight = isFullscreen ? '100dvh' : `${EDITOR_HEIGHT}px`;
  const bodyHeight = `calc(${paneHeight} - ${TOOLBAR_HEIGHT}px)`;

  return (
    <TooltipProvider>
      <div className={cn('sandpack-root not-prose my-6', isFullscreen && 'sandpack-fullscreen')}>
        <SandpackProvider
          template={template}
          theme={sandpackTheme}
          files={{ ...files, ...setupByTemplate[template] }}
          customSetup={{ dependencies: dependencies ?? {} }}
          options={{ autorun }}
        >
          <SandpackLayout>
            {showCode ? (
              <div
                ref={editorWrap}
                className="sp-editor-wrap relative flex min-w-0 flex-1 overflow-hidden rounded-xl border border-[var(--code-border)]"
                style={{ height: paneHeight }}
              >
                <SandpackCodeEditor showRunButton={false} showTabs showLineNumbers style={{ height: '100%' }} />
                <EditorSwitchMask />
                {/* Edge fades track the code scroll; the sticky gutter (higher
                    z-index in CSS) hides the left fade over the line numbers, and
                    both stop above the horizontal scrollbar. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute z-[2] w-[56px] bg-gradient-to-r from-[var(--code-bg)] to-transparent transition-opacity duration-150"
                  style={{ top: `${TOOLBAR_HEIGHT}px`, bottom: '14px', left: 'var(--gutter-w, 0px)', opacity: 'var(--edge-left, 0)' }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute right-0 z-[2] w-[56px] bg-gradient-to-l from-[var(--code-bg)] to-transparent transition-opacity duration-150"
                  style={{ top: `${TOOLBAR_HEIGHT}px`, bottom: '14px', opacity: 'var(--edge-right, 0)' }}
                />
              </div>
            ) : null}
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
    </TooltipProvider>
  );
}
