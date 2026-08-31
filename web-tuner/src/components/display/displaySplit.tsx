import type { ReactNode } from "react";

import type { DisplayDefinition } from "../../lib/schemas";
import Display from "./display";

type Props = {
    display: DisplayDefinition;
    children: ReactNode;
};

export default function DisplaySplit({ display, children }: Props) {
    return (
        <main className="min-h-0 grow p-10">
            <div className="border-border bg-base/70 mx-auto grid h-full w-full max-w-6xl grid-cols-[minmax(0,1fr)_--spacing(96)] overflow-hidden rounded-3xl border shadow-sm">
                <Display definition={display} />
                <div className="border-border min-h-0 border-l p-8">{children}</div>
            </div>
        </main>
    );
}
