"use client";

/**
 * FieldToggle lets patients control disclosure granularity locally.
 */
export function FieldToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border border-white/20 bg-black/20"
      />
      {label}
    </label>
  );
}
