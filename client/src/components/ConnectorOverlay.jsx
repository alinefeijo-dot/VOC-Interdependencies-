import React, { useEffect, useState, useCallback } from "react";

function findScrollAncestor(el) {
  let parent = el.parentElement;
  while (parent) {
    const style = getComputedStyle(parent);
    if (style.overflowY === "auto" || style.overflowY === "scroll") return parent;
    parent = parent.parentElement;
  }
  return null;
}

function visibleRect(el) {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  if (rect.bottom < 0 || rect.top > window.innerHeight) return null;
  if (rect.right < 0 || rect.left > window.innerWidth) return null;
  const scrollAncestor = findScrollAncestor(el);
  if (scrollAncestor) {
    const pRect = scrollAncestor.getBoundingClientRect();
    if (rect.bottom <= pRect.top || rect.top >= pRect.bottom) return null;
    if (rect.right <= pRect.left || rect.left >= pRect.right) return null;
  }
  return rect;
}

export default function ConnectorOverlay({ spotlightId, relatedLinks, onOffscreen }) {
  const [lines, setLines] = useState([]);

  const recompute = useCallback(() => {
    if (!spotlightId) {
      setLines([]);
      onOffscreen?.([]);
      return;
    }
    const selfEl = document.querySelector(`[data-issue-id="${CSS.escape(spotlightId)}"]`);
    const selfRect = selfEl ? visibleRect(selfEl) : null;

    const nextLines = [];
    const offscreen = [];
    for (const link of relatedLinks) {
      const otherId = link.fromId === spotlightId ? link.toId : link.fromId;
      const otherEl = document.querySelector(`[data-issue-id="${CSS.escape(otherId)}"]`);
      const otherRect = otherEl ? visibleRect(otherEl) : null;
      if (!selfRect || !otherRect) {
        offscreen.push({ ...link, otherId });
        continue;
      }
      nextLines.push({
        id: link.id,
        type: link.type,
        x1: selfRect.left + selfRect.width / 2,
        y1: selfRect.top + selfRect.height / 2,
        x2: otherRect.left + otherRect.width / 2,
        y2: otherRect.top + otherRect.height / 2,
      });
    }
    setLines(nextLines);
    onOffscreen?.(offscreen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotlightId, relatedLinks]);

  useEffect(() => {
    recompute();
    const raf = requestAnimationFrame(recompute);
    window.addEventListener("scroll", recompute, true);
    window.addEventListener("resize", recompute);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", recompute, true);
      window.removeEventListener("resize", recompute);
    };
  }, [recompute]);

  if (lines.length === 0) return null;

  return (
    <svg className="connector-overlay">
      <defs>
        <marker id="arrow-blocks" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#d3455b" />
        </marker>
      </defs>
      {lines.map((l) => (
        <line
          key={l.id}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          className={`connector-line connector-${l.type}`}
          markerEnd={l.type === "blocks" ? "url(#arrow-blocks)" : undefined}
        />
      ))}
    </svg>
  );
}
