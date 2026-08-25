import { Moon, Sun } from "lucide-react";

import logoDark from "../assets/autotune-header-black.svg";
import logoLight from "../assets/autotune-header-white.svg";
import type { AbortHandler } from "../hooks/useTuner";
import { useTheme } from "../lib/theme";

type Props = {
    abortDisabled: boolean;
    abort: AbortHandler;
};

export default function Header({ abortDisabled, abort }: Props) {
    const [theme, setTheme] = useTheme();

    return (
        <header className="bg-base/80 border-border mx-4 mt-4 h-16 shrink-0 rounded-full border pr-3 shadow-sm backdrop-blur-lg">
            <div className="grid h-full grid-cols-3 grid-rows-1 items-center">
                <img
                    src={logoLight}
                    alt="Autotune Logo"
                    draggable="false"
                    className="w-3xs justify-self-start dark:hidden"
                />
                <img
                    src={logoDark}
                    alt="Autotune Logo"
                    draggable="false"
                    className="hidden w-3xs justify-self-start dark:block"
                />

                <span className="text-heading justify-self-center text-center text-lg font-semibold tracking-wide select-none">
                    Pinpoint
                </span>
                <div className="flex items-center gap-3.5 justify-self-end">
                    <button
                        type="button"
                        onClick={() => abort("The tuner was aborted because E-STOP was pressed.")}
                        disabled={abortDisabled}
                        className="bg-danger text-accent-foreground flex h-10 cursor-pointer items-center justify-center rounded-full px-6 font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        E-STOP
                    </button>
                    <button
                        type="button"
                        aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="z-50 flex size-10 items-center justify-center rounded-full border border-mauve-400/25 bg-neutral-300/50 p-2 text-black opacity-60 transition-opacity duration-300 hover:opacity-100 dark:bg-neutral-950/50 dark:text-white"
                    >
                        {theme === "dark" ? (
                            <Sun className="size-5" />
                        ) : (
                            <Moon className="size-5" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
