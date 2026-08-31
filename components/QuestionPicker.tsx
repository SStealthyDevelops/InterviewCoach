"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTION_BANK } from "@/lib/data/questionBank";
import type { Question } from "@/lib/types";

const CATEGORIES: { value: Question["category"] | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "behavioral", label: "Behavioral" },
  { value: "general", label: "General" },
  { value: "technical-general", label: "Technical" },
  { value: "curveball", label: "Curveball" },
];

export function QuestionPicker() {
  const router = useRouter();
  const [category, setCategory] = useState<Question["category"] | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");

  const questions = useMemo(
    () =>
      category === "all"
        ? QUESTION_BANK
        : QUESTION_BANK.filter((q) => q.category === category),
    [category]
  );

  const canStart = selectedId !== null || customText.trim().length > 0;

  function handleStart() {
    if (customText.trim().length > 0) {
      router.push(`/record?custom=${encodeURIComponent(customText.trim())}`);
      return;
    }
    if (selectedId) {
      router.push(`/record?questionId=${encodeURIComponent(selectedId)}`);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Pick a question to practice
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Choose from the question bank, or write your own below.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => {
              setCategory(c.value);
              setSelectedId(null);
            }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              category === c.value
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-800 dark:hover:bg-zinc-900"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <ul className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
        {questions.map((q) => (
          <li key={q.id}>
            <button
              type="button"
              onClick={() => {
                setSelectedId(q.id);
                setCustomText("");
              }}
              className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                selectedId === q.id
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
                  : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900/50"
              }`}
            >
              {q.text}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <label
          htmlFor="customQuestion"
          className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
        >
          Or write your own question
        </label>
        <textarea
          id="customQuestion"
          rows={2}
          value={customText}
          onChange={(e) => {
            setCustomText(e.target.value);
            setSelectedId(null);
          }}
          placeholder="e.g. Why should we hire you for this specific role?"
          className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <button
        type="button"
        disabled={!canStart}
        onClick={handleStart}
        className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 sm:w-auto"
      >
        Start Practice
      </button>
    </div>
  );
}
