import type { FieldDefinition } from "../../lib/schemas";

type DoubleField = Extract<FieldDefinition, { type: "DOUBLE" }>;

type Props = {
    field: DoubleField;
};

export default function DoubleInput({ field }: Props) {
    return (
        <label className="text-heading flex flex-col gap-2 text-sm font-medium">
            <span className="text-heading text-sm font-medium">{field.name}</span>
            <input
                className="border-border bg-base text-heading focus:border-primary focus:ring-primary/20 block w-full rounded-xl border px-4 py-3 transition outline-none [-moz-appearance:textfield] focus:ring-2 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                type="number"
                name={field.id}
                step="any"
                required
                min={field.min}
                max={field.max}
                defaultValue={field.defaultValue}
            />
        </label>
    );
}
