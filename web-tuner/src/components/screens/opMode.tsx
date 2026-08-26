import { LoaderCircle } from "lucide-react";

type Props = {
    name: string;
    canStop: boolean;
    stopRequested: boolean;
    onStop: () => void;
};

export default function OpMode({ name, canStop, stopRequested, onStop }: Props) {
    return (
        <main className="flex grow items-center justify-center p-8">
            <div className="border-border bg-base/70 flex w-full max-w-xl flex-col items-center gap-5 rounded-3xl border py-8 text-center shadow-sm">
                <h2 className="text-heading text-4xl font-bold">{name}</h2>
                <LoaderCircle className="text-heading mt-4 size-8 animate-spin" />
                {canStop && (
                    <button
                        className="bg-primary text-accent-foreground focus-visible:ring-primary focus-visible:ring-offset-base mt-4 flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 font-medium transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                        type="button"
                        disabled={stopRequested}
                        onClick={onStop}
                    >
                        {stopRequested && <LoaderCircle className="size-4 animate-spin" />}
                        {stopRequested ? "Stopping…" : "Stop OpMode"}
                    </button>
                )}
            </div>
        </main>
    );
}
