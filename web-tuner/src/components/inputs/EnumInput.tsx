import { ChevronDown } from "lucide-react";

import type { FieldDefinition } from "../../lib/schemas";

type EnumField = Extract<FieldDefinition, { type: "ENUM" }>;

type Props = {
    field: EnumField;
};

export default function EnumInput({ field }: Props) {
    return (
        <label className="text-heading flex flex-col gap-2 text-sm font-medium">
            <span className="text-heading text-sm font-medium">{field.name}</span>
            <span className="relative block w-full">
                <select
                    className="border-border bg-base text-heading focus:border-primary focus:ring-primary/20 block w-full appearance-none rounded-xl border px-4 py-3 pr-10 transition outline-none focus:ring-2"
                    name={field.id}
                    required
                    defaultValue={field.defaultValue ?? ""}
                >
                    <option value="" disabled>
                        Select an option
                    </option>
                    {field.options.map(({ name, displayName }) => (
                        <option key={name} value={name}>
                            {displayName}
                        </option>
                    ))}
                </select>
                <ChevronDown className="text-body pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2" />
            </span>
        </label>
    );
}
