import type { DisplayDefinition, InputsPayload } from "../../lib/schemas";
import DisplaySplit from "../display/displaySplit";
import FieldInput from "../inputs/FieldInput";

export type Props = InputsPayload & {
    display?: DisplayDefinition;
    onSubmit: (inputs: Record<string, unknown>) => void;
};

function InputFields({ fields, onSubmit }: Pick<Props, "fields" | "onSubmit">) {
    return (
        <form
            className="scrollbar-minimal -my-4 -mr-4 flex flex-col gap-6 overflow-y-auto py-4 pr-2"
            onSubmit={(event) => {
                event.preventDefault();

                const formData = new FormData(event.currentTarget);
                const values: Record<string, unknown> = {};

                for (const field of fields) {
                    const value = formData.get(field.id);
                    if (field.type === "INT" || field.type === "DOUBLE") {
                        values[field.id] = Number(value);
                    } else if (field.type === "BOOLEAN") {
                        values[field.id] = value === "true";
                    } else {
                        values[field.id] = value;
                    }
                }

                onSubmit(values);
            }}
        >
            {fields.map((field) => (
                <FieldInput key={field.id} field={field} />
            ))}
            <button
                className="bg-primary text-accent-foreground focus-visible:ring-primary focus-visible:ring-offset-base w-full cursor-pointer rounded-full px-4 py-3 font-semibold transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-offset-2"
                type="submit"
            >
                Submit
            </button>
        </form>
    );
}

export default function Inputs({ name, description, fields, display, onSubmit }: Props) {
    if (!display) {
        return (
            <main className="min-h-0 grow py-10">
                <div className="mx-auto flex h-full w-full max-w-xl flex-col">
                    <h2 className="text-heading text-center text-5xl font-bold">{name}</h2>
                    <p className="text-body mt-4 text-center">{description}</p>

                    <div className="border-border bg-base/70 mt-10 flex min-h-0 grow flex-col rounded-3xl border p-8 shadow-sm">
                        <InputFields fields={fields} onSubmit={onSubmit} />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <DisplaySplit display={display}>
            <div className="flex h-full min-h-0 flex-col">
                <h2 className="text-heading text-4xl font-bold">{name}</h2>
                <p className="text-body mt-3">{description}</p>

                <div className="mt-8 flex min-h-0 grow flex-col">
                    <InputFields fields={fields} onSubmit={onSubmit} />
                </div>
            </div>
        </DisplaySplit>
    );
}
