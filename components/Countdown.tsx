"use client";

import { useEffect, useState } from "react";

export function Countdown({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count === 0) {
      onComplete();
      return;
    }
    const timeout = setTimeout(() => setCount((c) => c - 1), 800);
    return () => clearTimeout(timeout);
  }, [count, onComplete]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <span className="text-7xl font-bold text-zinc-900 dark:text-zinc-50">{count}</span>
    </div>
  );
}
