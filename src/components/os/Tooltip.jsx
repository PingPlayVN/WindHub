import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Tooltip({ content, side = 'top', children }) {
  const triggerRef = useRef(null);
  const timerRef = useRef(null);
  const [coords, setCoords] = useState(null);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (side === 'right') {
      setCoords({
        top: rect.top + rect.height / 2,
        left: rect.right + 10,
        transform: 'translateY(-50%)',
      });
    } else if (side === 'bottom') {
      setCoords({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
      });
    } else {
      setCoords({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, -100%)',
      });
    }
  }, [side]);

  const show = () => {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(updatePosition, 160);
  };

  const hide = () => {
    window.clearTimeout(timerRef.current);
    setCoords(null);
  };

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  if (!content) return children;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex"
      >
        {children}
      </span>
      {coords &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            role="tooltip"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              transform: coords.transform,
            }}
            className="pointer-events-none z-[var(--z-toast)] whitespace-nowrap rounded-[var(--radius-xs)] border border-[var(--os-border-default)] bg-[var(--os-surface-floating)] px-2.5 py-1 text-[11px] font-semibold text-[var(--os-text-primary)] shadow-[var(--os-shadow-md)] animate-in fade-in duration-100"
          >
            {content}
          </span>,
          document.body
        )}
    </>
  );
}
