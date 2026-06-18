"use client";
import { useEffect, useState } from "react";
import { store } from "../lib/storage";

// Paints the floodlit stadium stage only when the user has turned it on in Settings.
// Default is matte black (renders nothing), so server-rendered pages stay matte until
// the client reads the saved preference. Decorative + aria-hidden, never content.
export default function StageBackdrop() {
  const [on, setOn] = useState(false);
  useEffect(() => { try { setOn(!!store.load().stadiumLight); } catch {} }, []);
  if (!on) return null;
  return (
    <>
      <div className="cv-stage" aria-hidden="true" />
      <div className="cv-grain" aria-hidden="true" />
    </>
  );
}
