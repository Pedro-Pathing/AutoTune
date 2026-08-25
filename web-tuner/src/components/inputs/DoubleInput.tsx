import { useEffect, useState } from "react";

import type { FieldDefinition } from "../../lib/schemas";

type DoubleField = Extract<FieldDefinition, { type: "DOUBLE" }>;

type Props = {
    field: DoubleField;
    onChange: (value: number | "") => void;
};

export default function DoubleInput({ field, onChange }: Props) {
    const [value, setValue] = useState<number | "">(field.defaultValue ?? "");

    useEffect(() => {
        if (value === "") return;
        if (field.min !== undefined && value < field.min) setValue(field.min);
        else if (field.max !== undefined && value > field.max) setValue(field.max);
    }, [field.max, field.min, value]);

    useEffect(() => {
        onChange(value);
    }, [value, onChange]);

    return (
        <label className="text-heading flex flex-col gap-2 text-sm font-medium">
            <span className="text-heading text-sm font-medium">{field.name}</span>
            <input
                className="border-border bg-base text-heading focus:border-primary focus:ring-primary/20 block w-full rounded-xl border px-4 py-3 transition outline-none [-moz-appearance:textfield] focus:ring-2 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                type="number"
                step="any"
                required={field.required || field.defaultValue !== undefined}
                min={field.min}
                max={field.max}
                value={value}
                onChange={(event) =>
                    setValue(event.target.value === "" ? "" : Number(event.target.value))
                }
            />
        </label>
    );
}
