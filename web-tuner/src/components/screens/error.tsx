import { ArrowLeft, CircleAlert, RotateCcw } from "lucide-react";

export default function ErrorScreen({ message }: { message: string }) {
    return (
        <main className="flex grow items-center justify-center p-8">
            <div
                className="border-border bg-base/70 flex w-full max-w-xl flex-col items-center gap-5 rounded-3xl border p-10 text-center shadow-sm"
                role="alert"
            >
                <CircleAlert aria-hidden="true" className="text-danger/50 size-12" />
                <h2 className="text-heading text-4xl font-bold">Something went wrong.</h2>
                <p className="text-body max-w-[60ch] wrap-break-word whitespace-pre-wrap">
                    {message}
                </p>
                <div className="mt-2 flex items-center gap-4">
                    <button
                        className="bg-primary text-accent-foreground flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 font-medium transition-opacity hover:opacity-80"
                        type="button"
                        onClick={() => window.location.reload()}
                    >
                        <RotateCcw className="size-4" />
                        Try again
                    </button>
                    <a
                        className="text-primary hover:border-primary flex items-center gap-2 rounded-full border border-transparent p-3 font-medium transition-colors"
                        href="/"
                    >
                        <ArrowLeft className="size-4" />
                        Choose another tuner
                    </a>
                </div>
            </div>
        </main>
    );
}
