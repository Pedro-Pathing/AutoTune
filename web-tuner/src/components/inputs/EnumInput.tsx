import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import type { FieldDefinition } from "../../lib/schemas";

type EnumField = Extract<FieldDefinition, { type: "ENUM" }>;

type Props = {
    field: EnumField;
    onChange: (value: string) => void;
};

export default function EnumInput({ field, onChange }: Props) {
    const [value, setValue] = useState(field.defaultValue ?? field.options[0] ?? "");

    useEffect(() => {
        onChange(value);
    }, [value, onChange]);

    return (
        <label className="text-heading flex flex-col gap-2 text-sm font-medium">
            <span className="text-heading text-sm font-medium">{field.name}</span>
            <span className="relative block w-full">
                <select
                    className="border-border bg-base text-heading focus:border-primary focus:ring-primary/20 block w-full appearance-none rounded-xl border px-4 py-3 pr-10 transition outline-none focus:ring-2"
                    required={field.required || field.defaultValue !== undefined}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                >
                    {field.options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <ChevronDown
                    aria-hidden="true"
                    className="text-body pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2"
                />
            </span>
        </label>
    );
}
