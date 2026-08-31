export type ProcessingStepStatus = "pending" | "active" | "done" | "error";

export interface ProcessingStepState {
  label: string;
  status: ProcessingStepStatus;
}

const ICON: Record<ProcessingStepStatus, string> = {
  pending: "○",
  active: "◐",
  done: "●",
  error: "✕",
};

export function ProcessingSteps({ steps }: { steps: ProcessingStepState[] }) {
  return (
    <ul className="mx-auto w-full max-w-sm space-y-3">
      {steps.map((step) => (
        <li key={step.label} className="flex items-center gap-3 text-sm">
          <span
            aria-hidden
            className={
              step.status === "error"
                ? "text-red-600 dark:text-red-400"
                : step.status === "done"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : step.status === "active"
                    ? "text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-300 dark:text-zinc-700"
            }
          >
            {ICON[step.status]}
          </span>
          <span
            className={
              step.status === "pending"
                ? "text-zinc-400 dark:text-zinc-600"
                : "text-zinc-800 dark:text-zinc-200"
            }
          >
            {step.label}
          </span>
        </li>
      ))}
    </ul>
  );
}
