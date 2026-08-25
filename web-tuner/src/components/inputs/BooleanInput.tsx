import clsx from "clsx";
import { useEffect, useState } from "react";

import type { FieldDefinition } from "../../lib/schemas";

type BooleanField = Extract<FieldDefinition, { type: "BOOLEAN" }>;

type Props = {
    field: BooleanField;
    onChange: (value: boolean) => void;
};

export default function BooleanInput({ field, onChange }: Props) {
    const [value, setValue] = useState(Boolean(field.defaultValue));

    useEffect(() => {
        onChange(value);
    }, [value, onChange]);

    return (
        <label
            className={clsx(
                "hover:border-primary/50 flex w-full cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-colors",
                value ? "border-primary" : "border-border"
            )}
        >
            <span className="text-heading text-sm font-medium">{field.name}</span>
            <input
                className="peer sr-only"
                type="checkbox"
                checked={value}
                onChange={(event) => setValue(event.target.checked)}
            />
            <span
                aria-hidden="true"
                className="border-border bg-base peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-primary peer-focus-visible:ring-offset-base after:border-accent-foreground relative size-5 shrink-0 rounded-md border transition-colors peer-focus-visible:ring-2 after:absolute after:top-0.5 after:left-1.5 after:h-2.5 after:w-1.5 after:rotate-45 after:border-r-2 after:border-b-2 after:opacity-0 after:transition-opacity peer-checked:after:opacity-100"
            />
        </label>
    );
}
