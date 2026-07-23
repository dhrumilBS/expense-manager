import { ReactNode, useRef, useState } from 'react';

interface SwipeAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  className: string;
}

const ACTION_WIDTH = 64;

/**
 * Wraps a row/card so it reveals action buttons on a left swipe (touch only).
 * Mouse/pointer input is left alone so desktop keeps its existing hover affordance.
 */
export default function SwipeToReveal({
  children, actions, className = '',
}: { children: ReactNode; actions: SwipeAction[]; className?: string }) {
  const [offset, setOffset] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const maxOffset = actions.length * ACTION_WIDTH;

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    dragging.current = true;
    startX.current = e.clientX;
    startOffset.current = offset;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const delta = e.clientX - startX.current;
    setOffset(Math.max(-maxOffset, Math.min(0, startOffset.current + delta)));
  };

  const endDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    setOffset((o) => (o < -maxOffset / 2 ? -maxOffset : 0));
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-y-0 right-0 flex" style={{ width: maxOffset }}>
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={() => { a.onClick(); setOffset(0); }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${a.className}`}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
      <div
        className="relative bg-surface"
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging.current ? 'none' : 'transform 200ms ease-out',
          touchAction: 'pan-y',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {children}
      </div>
    </div>
  );
}
