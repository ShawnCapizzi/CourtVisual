"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

type LaserMode = "loop" | "hover" | "once";

interface LaserFrameProps {
  children: ReactNode;
  /** loop: always on (no. 1 card, live). hover: CTA desktop. once: single pass on scroll-into-view. */
  mode?: LaserMode;
  /** Must match the host element's border-radius in px so the trace hugs the corner. */
  radius?: number;
  /** Preset class, e.g. "cv-laser-live". Token overrides go through style. */
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
}

/**
 * Wraps any block and traces its perimeter with the laser.
 * Renders the rect in real pixel coordinates (ResizeObserver) so the
 * corner radius is true, while pathLength={100} keeps the animation
 * normalized — same dash math at every size.
 *
 * Discipline rules (see README): one loop-mode laser per screen, ever.
 */
export default function LaserFrame({
  children,
  mode = "loop",
  radius = 12,
  className = "",
  style,
  as: Tag = "div",
}: LaserFrameProps) {
  const hostRef = useRef<HTMLElement | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDims({ w: width, h: height });
    });
    ro.observe(host);

    let io: IntersectionObserver | undefined;
    if (mode === "once") {
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            io?.disconnect();
          }
        },
        { threshold: 0.6 }
      );
      io.observe(host);
    }

    return () => {
      ro.disconnect();
      io?.disconnect();
    };
  }, [mode]);

  const stroke = 2;
  const inset = stroke / 2;
  const ready = dims.w > 0 && dims.h > 0;

  return (
    <Tag
      ref={hostRef}
      className={`cv-laser-${mode} ${inView ? "is-inview" : ""} ${className}`.trim()}
      style={{ position: "relative", ...style }}
    >
      {children}
      {ready && (
        <svg
          className="cv-frame"
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          aria-hidden="true"
        >
          <rect
            className="base"
            x={inset}
            y={inset}
            width={dims.w - stroke}
            height={dims.h - stroke}
            rx={radius}
            pathLength={100}
          />
          <rect
            className="laser"
            x={inset}
            y={inset}
            width={dims.w - stroke}
            height={dims.h - stroke}
            rx={radius}
            pathLength={100}
          />
        </svg>
      )}
    </Tag>
  );
}
