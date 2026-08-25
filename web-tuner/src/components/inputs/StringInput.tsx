import type { FieldDefinition } from "../../lib/schemas";

type StringField = Extract<FieldDefinition, { type: "STRING" }>;

type Props = {
    field: StringField;
    onChange: (value: string) => void;
};

export default function StringInput({ field, onChange }: Props) {
    return (
        <label className="text-heading flex flex-col gap-2 text-sm font-medium">
            <span className="text-heading text-sm font-medium">{field.name}</span>
            <input
                className="border-border bg-base text-heading focus:border-primary focus:ring-primary/20 block w-full rounded-xl border px-4 py-3 transition outline-none focus:ring-2"
                type="text"
                required={field.required || field.defaultValue !== undefined}
                defaultValue={field.defaultValue}
                onChange={(event) => onChange(event.target.value)}
            />
        </label>
    );
}
