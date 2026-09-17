"use client";

import { SegmentedChoiceField } from "@/components/dashboard/segmented-choice-field";
import { Eye, EyeOff } from "lucide-react";

/**
 * Segmented publish / hidden control used in dashboard create/edit dialogs.
 */
export function PublishStatusField({
  value,
  onChange,
  name = "publish-status",
  legend = "الظهور",
}: {
  value: boolean;
  onChange: (published: boolean) => void;
  name?: string;
  legend?: string;
}) {
  return (
    <SegmentedChoiceField
      legend={legend}
      name={name}
      value={value ? "published" : "hidden"}
      onChange={(next) => onChange(next === "published")}
      options={[
        {
          value: "published",
          label: "منشور",
          icon: <Eye />,
          activeClassName:
            "border-emerald-400/50 bg-emerald-50 text-emerald-900",
        },
        {
          value: "hidden",
          label: "مخفي",
          icon: <EyeOff />,
          activeClassName: "border-amber-400/50 bg-amber-50 text-amber-900",
        },
      ]}
    />
  );
}
