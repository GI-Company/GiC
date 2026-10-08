'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Code2, FileText, GripVertical, Plus } from 'lucide-react';

export type WorkbenchTab = {
  id: string;
  name: string;
  kind: 'report' | 'applet';
};

type Props = {
  windows: WorkbenchTab[];
  canCreate: boolean;
  canCreateApplet: boolean;
  visible: boolean;
  onOpen: (id: string) => void;
  onCreate: (kind: 'report' | 'applet') => void;
};

export default function WorkbenchDock({ windows, canCreate, canCreateApplet, visible, onOpen, onCreate }: Props) {
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const dockRef = useRef<HTMLElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    initialX: number;
    initialY: number;
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  function handleDragStart(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const rect = dockRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = {
      pointerId: event.pointerId,
      initialX: event.clientX,
      initialY: event.clientY,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function handleDragMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    setPosition({
      left: Math.max(12, Math.min(
        drag.left + event.clientX - drag.initialX,
        Math.max(12, window.innerWidth - drag.width - 12),
      )),
      top: Math.max(12, Math.min(
        drag.top + event.clientY - drag.initialY,
        Math.max(12, window.innerHeight - drag.height - 12),
      )),
    });
  }

  function handleDragEnd(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  useEffect(() => {
    function keepDockOnScreen() {
      const rect = dockRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition((current) => current ? ({
        left: Math.max(12, Math.min(current.left, Math.max(12, window.innerWidth - rect.width - 12))),
        top: Math.max(12, Math.min(current.top, Math.max(12, window.innerHeight - rect.height - 12))),
      }) : null);
    }
    window.addEventListener('resize', keepDockOnScreen);
    return () => window.removeEventListener('resize', keepDockOnScreen);
  }, []);

  return (
    <aside
      ref={dockRef}
      aria-label="Minimized workbenches"
      className="fixed z-[90] flex max-h-[min(65dvh,450px)] w-[min(350px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-[0_20px_65px_rgba(15,23,42,0.25)]"
      style={position ? { left: position.left, top: position.top, display: visible ? undefined : 'none' } : { right: 12, top: 'max(88px, calc(env(safe-area-inset-top) + 72px))', display: visible ? undefined : 'none' }}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-blue-50 px-2 py-2">
        <button
          type="button"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          className="flex h-10 w-9 shrink-0 touch-none cursor-grab items-center justify-center rounded-xl text-blue-700 hover:bg-blue-100 active:cursor-grabbing"
          aria-label="Drag Workbench dock"
          title="Drag Workbench dock"
        >
          <GripVertical size={19} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">Workbenches · {windows.length}</p>
          <p className="text-[11px] text-slate-600">Chat stays open · tap a name to edit</p>
        </div>
      </div>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-2" role="list" aria-label="Open Workbench windows">
        {windows.map((windowItem) => (
          <div role="listitem" key={windowItem.id}>
            <button
              type="button"
              onClick={() => onOpen(windowItem.id)}
              className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-left text-sm text-slate-700 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title={'Restore ' + windowItem.name}
            >
              {windowItem.kind === 'report' ? <FileText size={16} className="shrink-0 text-blue-700" /> : <Code2 size={16} className="shrink-0 text-blue-700" />}
              <span className="min-w-0 flex-1 truncate font-medium">{windowItem.name || 'Untitled Workbench'}</span>
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-slate-400">{windowItem.kind}</span>
            </button>
          </div>
        ))}
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-slate-200 p-2">
        <button
          type="button"
          disabled={!canCreate}
          onClick={() => onCreate('report')}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={14} /> New report
        </button>
        <button
          type="button"
          disabled={!canCreate || !canCreateApplet}
          onClick={() => onCreate('applet')}
          title={!canCreateApplet ? 'Applets require Enhanced Workspace' : 'New applet'}
          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-blue-200 px-2 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus size={14} /> New applet
        </button>
      </div>
    </aside>
  );
}
