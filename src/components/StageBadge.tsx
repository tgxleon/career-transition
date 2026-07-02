import { Stage, STAGE_LABELS } from "@/lib/types";

const STYLES: Record<Stage, string> = {
  saved: "bg-gray-100 text-gray-700 border-gray-200",
  applied: "bg-blue-50 text-blue-800 border-blue-200",
  interview: "bg-amber-50 text-amber-800 border-amber-200",
  offer: "bg-emerald-50 text-emerald-800 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  withdrawn: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[stage]}`}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}
