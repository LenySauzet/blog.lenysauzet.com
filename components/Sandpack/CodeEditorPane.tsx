'use client';

import { SandpackCodeEditor, useSandpack } from '@codesandbox/sandpack-react';
import { useEffect, useRef } from 'react';

import { FADE } from './constants';

export function CodeEditorPane({ height }: { height: string }) {
  const { sandpack } = useSandpack();
  const activeFile = sandpack.activeFile;
  const wrapRef = useRef<HTMLDivElement>(null);

  // Sandpack rebuilds CodeMirror per file: hence `activeFile` and the rAF awaiting the mount.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const clamp = (v: number) => Math.min(Math.max(v, 0), 1);

    let scroller: HTMLElement | null = null;
    const getScroller = () => {
      if (!scroller?.isConnected) scroller = wrap.querySelector<HTMLElement>('.cm-scroller');
      return scroller;
    };

    const measureGeometry = () => {
      const el = getScroller();
      if (!el) return;
      wrap.style.setProperty('--code-top', `${el.getBoundingClientRect().top - wrap.getBoundingClientRect().top}px`);
      wrap.style.setProperty('--scrollbar-h', `${el.offsetHeight - el.clientHeight}px`);
      wrap.style.setProperty('--scrollbar-w', `${el.offsetWidth - el.clientWidth}px`);
    };
    const updateEdges = () => {
      const el = getScroller();
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      wrap.style.setProperty('--edge-left', String(max <= 1 ? 0 : clamp(el.scrollLeft / FADE)));
      wrap.style.setProperty('--edge-right', String(max <= 1 ? 0 : clamp((max - el.scrollLeft) / FADE)));
    };

    let geometryFrame = 0;
    let edgeFrame = 0;
    let mountFrame = 0;
    let cancelled = false;
    let observer: ResizeObserver | null = null;

    const scheduleGeometry = () => {
      if (geometryFrame) return;
      geometryFrame = requestAnimationFrame(() => {
        geometryFrame = 0;
        measureGeometry();
        updateEdges();
      });
    };
    const scheduleEdges = () => {
      if (edgeFrame) return;
      edgeFrame = requestAnimationFrame(() => {
        edgeFrame = 0;
        updateEdges();
      });
    };

    const attach = () => {
      if (cancelled) return;
      const el = getScroller();
      const content = wrap.querySelector<HTMLElement>('.cm-content');
      if (!el || !content) {
        mountFrame = requestAnimationFrame(attach);
        return;
      }
      observer = new ResizeObserver(scheduleGeometry);
      observer.observe(el);
      observer.observe(content);
    };
    attach();
    // Capture: scroll does not bubble, and the wrapper outlives the scroller on file switch.
    wrap.addEventListener('scroll', scheduleEdges, { capture: true, passive: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(geometryFrame);
      cancelAnimationFrame(edgeFrame);
      cancelAnimationFrame(mountFrame);
      observer?.disconnect();
      wrap.removeEventListener('scroll', scheduleEdges, { capture: true });
    };
  }, [activeFile]);

  return (
    <div
      ref={wrapRef}
      className="sp-editor-wrap relative flex min-w-0 flex-1 overflow-hidden rounded-frame-xl border border-[var(--code-border)]"
      style={{ height }}
    >
      <SandpackCodeEditor showRunButton={false} showTabs showLineNumbers style={{ height: '100%' }} />
      {/* Keyed on the file, so it replays its fade over CodeMirror's remount reflow. */}
      <div
        key={activeFile}
        aria-hidden="true"
        className="sp-switch-mask pointer-events-none absolute inset-x-0 z-[4] bg-[var(--code-bg)]"
        style={{ top: 'var(--code-top, 3rem)', bottom: 0 }}
      />
      {/* The left fade is `.cm-gutters::after`, glued to the sticky gutter through overscroll. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute z-[3] w-12 bg-gradient-to-l from-[var(--code-bg)] to-transparent transition-opacity duration-150"
        style={{
          top: 'var(--code-top, 0px)',
          bottom: 'var(--scrollbar-h, 0px)',
          right: 'var(--scrollbar-w, 0px)',
          opacity: 'var(--edge-right, 0)',
        }}
      />
    </div>
  );
}
