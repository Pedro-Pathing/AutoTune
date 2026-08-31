import type { DisplayDefinition } from "../../lib/schemas";
import DisplaySplit from "../display/displaySplit";

type Props = {
    title: string;
    message: string;
    display?: DisplayDefinition;
    onConfirm: () => void;
};

export default function Confirmation({ title, message, display, onConfirm }: Props) {
    if (!display) {
        return (
            <div className="flex grow flex-col items-center justify-center gap-12">
                <h2 className="text-heading text-center text-6xl font-bold">{title}</h2>
                <p className="max-w-[60ch] text-xl">{message}</p>
                <button
                    type="button"
                    onClick={onConfirm}
                    className="bg-primary text-accent-foreground flex h-11 cursor-pointer items-center justify-center justify-self-end rounded-full px-6 font-medium transition-opacity hover:opacity-80"
                >
                    Continue
                </button>
            </div>
        );
    }

    return (
        <DisplaySplit display={display}>
            <div className="flex h-full min-h-0 flex-col justify-between">
                <div>
                    <h2 className="text-heading mb-5 text-4xl font-bold">{title}</h2>
                    <p className="text-heading text-xl leading-relaxed whitespace-pre-wrap">
                        {message}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onConfirm}
                    className="bg-primary text-accent-foreground flex h-11 w-full cursor-pointer items-center justify-center rounded-full px-6 font-medium transition-opacity hover:opacity-80"
                >
                    Continue
                </button>
            </div>
        </DisplaySplit>
    );
}
