import { ChevronDown, ChevronUp } from "lucide-react";
import { useRef } from "react";

import type { FieldDefinition } from "../../lib/schemas";

type IntegerField = Extract<FieldDefinition, { type: "INT" }>;

type Props = {
    field: IntegerField;
};

export default function IntegerInput({ field }: Props) {
    const inputRef = useRef<HTMLInputElement>(null);

    const stepBy = (amount: number) => {
        const input = inputRef.current;
        if (input === null) return;

        const currentValue = input.valueAsNumber;
        let nextValue = currentValue + amount;
        if (Number.isNaN(currentValue)) nextValue = amount > 0 ? 1 : 0;
        input.value = String(nextValue);
    };

    return (
        <label className="text-heading flex flex-col gap-2 text-sm font-medium">
            <span className="text-heading text-sm font-medium">{field.name}</span>
            <span className="relative block w-full">
                <input
                    className="border-border bg-base text-heading focus:border-primary focus:ring-primary/20 mt-0 block w-full rounded-xl border px-4 py-3 pr-12 transition outline-none [-moz-appearance:textfield] focus:ring-2 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
                    type="number"
                    ref={inputRef}
                    name={field.id}
                    step={1}
                    required
                    min={field.min}
                    max={field.max}
                    defaultValue={field.defaultValue}
                />
                <span className="border-border absolute inset-y-0 right-0 flex w-6 flex-col overflow-hidden rounded-r-xl border-l">
                    <button
                        className="text-body hover:bg-primary/10 hover:text-primary focus-visible:bg-primary/10 focus-visible:text-primary grid flex-1 place-items-center transition-colors focus-visible:outline-none"
                        type="button"
                        onClick={() => stepBy(1)}
                    >
                        <ChevronUp className="size-3" />
                    </button>
                    <button
                        className="text-body border-border hover:bg-primary/10 hover:text-primary focus-visible:bg-primary/10 focus-visible:text-primary grid flex-1 place-items-center border-t transition-colors focus-visible:outline-none"
                        type="button"
                        onClick={() => stepBy(-1)}
                    >
                        <ChevronDown className="size-3" />
                    </button>
                </span>
            </span>
        </label>
    );
}
