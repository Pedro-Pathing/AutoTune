import { LoaderCircle, Maximize } from "lucide-react";

type Props = {
    requesting: boolean;
    error: string | null;
    onRequest: () => void;
};

export default function Fullscreen({ requesting, error, onRequest }: Props) {
    return (
        <main className="flex grow items-center justify-center p-8">
            <div className="border-border bg-base/70 flex w-full max-w-xl flex-col items-center gap-5 rounded-3xl border p-10 text-center shadow-sm">
                <Maximize aria-hidden="true" className="text-primary/60 size-12" />
                <h2 className="text-heading text-4xl font-bold">Fullscreen Mode</h2>
                <p className="text-body max-w-[60ch]">
                    The tuner can only start once this page is fullscreen. Use the button below to
                    continue.
                </p>
                {error !== null && (
                    <p className="text-body max-w-[60ch] text-sm" role="alert">
                        {error}
                    </p>
                )}
                <button
                    className="bg-primary text-accent-foreground focus-visible:ring-primary focus-visible:ring-offset-base mt-2 flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 font-medium transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                    type="button"
                    disabled={requesting}
                    aria-busy={requesting}
                    onClick={onRequest}
                >
                    {requesting && (
                        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                    )}
                    {requesting ? "Requesting fullscreen…" : "Enter fullscreen mode"}
                </button>
            </div>
        </main>
    );
}
