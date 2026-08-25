import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

import type { FieldDefinition } from "../../lib/schemas";

type IntegerField = Extract<FieldDefinition, { type: "INT" }>;

type Props = {
    field: IntegerField;
    onChange: (value: number | "") => void;
};

export default function IntegerInput({ field, onChange }: Props) {
    const [value, setValue] = useState<number | "">(field.defaultValue ?? "");

    useEffect(() => {
        if (value === "") return;
        if (!Number.isInteger(value)) setValue(Math.floor(value));
        else if (field.min !== undefined && value < field.min) setValue(field.min);
        else if (field.max !== undefined && value > field.max) setValue(field.max);
    }, [field.max, field.min, value]);

    useEffect(() => {
        onChange(value);
    }, [value, onChange]);

    return (
        <label className="text-heading flex flex-col gap-2 text-sm font-medium">
            <span className="text-heading text-sm font-medium">{field.name}</span>
            <span className="relative block w-full">
                <input
                    className="border-border bg-base text-heading focus:border-primary focus:ring-primary/20 mt-0 block w-full rounded-xl border px-4 py-3 pr-12 transition outline-none [-moz-appearance:textfield] focus:ring-2 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                    type="number"
                    step={1}
                    required={field.required || field.defaultValue !== undefined}
                    min={field.min}
                    max={field.max}
                    value={value}
                    onChange={(event) => {
                        setValue(event.target.value === "" ? "" : Number(event.target.value));
                    }}
                />
                <span className="border-border absolute inset-y-0 right-0 flex w-6 flex-col overflow-hidden rounded-r-xl border-l">
                    <button
                        aria-label="Increment"
                        className="text-body hover:bg-primary/10 hover:text-primary focus-visible:bg-primary/10 focus-visible:text-primary grid flex-1 place-items-center transition-colors focus-visible:outline-none"
                        type="button"
                        onClick={() =>
                            setValue((currentValue) => {
                                const nextValue = currentValue === "" ? 1 : currentValue + 1;
                                if (field.min !== undefined && nextValue < field.min) {
                                    return field.min;
                                }
                                if (field.max !== undefined && nextValue > field.max) {
                                    return field.max;
                                }
                                return nextValue;
                            })
                        }
                    >
                        <ChevronUp className="size-3" />
                    </button>
                    <button
                        aria-label="Decrement"
                        className="text-body border-border hover:bg-primary/10 hover:text-primary focus-visible:bg-primary/10 focus-visible:text-primary grid flex-1 place-items-center border-t transition-colors focus-visible:outline-none"
                        type="button"
                        onClick={() =>
                            setValue((currentValue) => {
                                const nextValue = currentValue === "" ? 0 : currentValue - 1;
                                if (field.min !== undefined && nextValue < field.min) {
                                    return field.min;
                                }
                                if (field.max !== undefined && nextValue > field.max) {
                                    return field.max;
                                }
                                return nextValue;
                            })
                        }
                    >
                        <ChevronDown className="size-3" />
                    </button>
                </span>
            </span>
        </label>
    );
}
