"use client";
import { useState } from "react";

// Toggles every <details data-faq> on the page open/closed. The FAQ items are native
// server-rendered <details> (SEO-safe, content always in the DOM); this only flips them.
export default function ExpandAllButton() {
  const [allOpen, setAllOpen] = useState(false);
  const toggle = () => {
    const next = !allOpen;
    if (typeof document !== "undefined") {
      document.querySelectorAll("details[data-faq]").forEach((d) => { d.open = next; });
    }
    setAllOpen(next);
  };
  return (
    <button
      onClick={toggle}
      style={{ flexShrink: 0, fontFamily: "'Archivo',sans-serif", fontSize: 12.5, fontWeight: 700, color: "#ECE7DB", background: "rgba(236,231,219,0.08)", border: "1px solid rgba(236,231,219,0.16)", borderRadius: 999, padding: "8px 15px", cursor: "pointer" }}
    >
      {allOpen ? "Collapse all" : "Expand all"}
    </button>
  );
}
