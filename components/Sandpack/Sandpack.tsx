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
// Scroll distance over which an edge fade ramps from clear to full.
const FADE = 40;

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

  // Drive the editor's horizontal-overflow fades from the scroll position. The
  // scroll listener is capture-phase on the wrapper (it survives CodeMirror
  // recreating its scroller on file switch), and a MutationObserver re-measures
  // once the scroller first mounts and whenever it's rebuilt — the init step the
  // wrapper's own ResizeObserver can't see, since the wrapper never resizes.
  useEffect(() => {
    const wrap = editorWrap.current;
    if (!wrap) return;
    const clamp = (v: number) => Math.min(Math.max(v, 0), 1);
    let scroller: HTMLElement | null = null;

    const update = () => {
      if (!scroller?.isConnected) scroller = wrap.querySelector<HTMLElement>('.cm-scroller');
      if (!scroller) return;
      const wrapTop = wrap.getBoundingClientRect().top;
      const rect = scroller.getBoundingClientRect();
      // Fades cover only the code area (below the tabs) and stop above the
      // horizontal scrollbar, both measured live rather than assumed.
      wrap.style.setProperty('--code-top', `${rect.top - wrapTop}px`);
      wrap.style.setProperty('--scrollbar-h', `${scroller.offsetHeight - scroller.clientHeight}px`);
      wrap.style.setProperty('--scrollbar-w', `${scroller.offsetWidth - scroller.clientWidth}px`);
      const max = scroller.scrollWidth - scroller.clientWidth;
      wrap.style.setProperty('--edge-left', String(max <= 1 ? 0 : clamp(scroller.scrollLeft / FADE)));
      wrap.style.setProperty('--edge-right', String(max <= 1 ? 0 : clamp((max - scroller.scrollLeft) / FADE)));
    };

    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    update();
    wrap.addEventListener('scroll', update, { capture: true, passive: true });
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(wrap);
    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(wrap, { childList: true, subtree: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      wrap.removeEventListener('scroll', update, { capture: true });
      resizeObserver.disconnect();
      mutationObserver.disconnect();
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
                {/* Right edge fade: an overlay anchored to the wrapper's right
                    edge, stopping before both scrollbars. The LEFT fade is not
                    here — it lives on `.cm-gutters::after` in CSS so it stays
                    glued to the sticky line-number column through overscroll. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute z-[3] w-12 bg-gradient-to-l from-[var(--code-bg)] to-transparent transition-opacity duration-150"
                  style={{ top: 'var(--code-top, 0px)', bottom: 'var(--scrollbar-h, 0px)', right: 'var(--scrollbar-w, 0px)', opacity: 'var(--edge-right, 0)' }}
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
