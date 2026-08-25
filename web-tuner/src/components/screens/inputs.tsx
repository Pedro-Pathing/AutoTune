import { useMemo } from "react";

import type { InputsPayload } from "../../lib/schemas";
import FieldInput from "../inputs/FieldInput";

export type Props = InputsPayload & {
    onSubmit: (inputs: Record<string, unknown>) => void;
};

export default function Inputs({ name, description, fields, onSubmit }: Props) {
    const results = useMemo<Record<string, unknown>>(() => {
        const initialValues: Record<string, unknown> = {};

        for (const field of fields) {
            if (field.defaultValue !== undefined) {
                initialValues[field.id] = field.defaultValue;
            } else if (field.type === "BOOLEAN") {
                initialValues[field.id] = false;
            } else if (field.type === "ENUM" && field.options[0] !== undefined) {
                initialValues[field.id] = field.options[0];
            }
        }

        return initialValues;
    }, [fields]);

    return (
        <main className="min-h-0 grow py-10">
            <div className="mx-auto flex h-full w-full max-w-xl flex-col">
                <h2 className="text-heading text-center text-5xl font-bold">{name}</h2>
                <p className="text-body mt-4 text-center">{description}</p>

                <div className="border-border bg-base/70 mt-10 flex min-h-0 grow flex-col rounded-3xl border p-8 shadow-sm">
                    <form
                        className="scrollbar-minimal -my-4 -mr-4 flex flex-col gap-6 overflow-y-auto py-4 pr-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            onSubmit({ ...results });
                        }}
                    >
                        {fields.map((field) => (
                            <FieldInput
                                key={field.id}
                                field={field}
                                onChange={(value) => {
                                    results[field.id] = value;
                                }}
                            />
                        ))}
                        <button
                            className="bg-primary text-accent-foreground focus-visible:ring-primary focus-visible:ring-offset-base w-full cursor-pointer rounded-full px-4 py-3 font-semibold transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-offset-2"
                            type="submit"
                        >
                            Submit
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
