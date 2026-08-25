import { useAtom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { useEffect } from "react";

export type Theme = "light" | "dark";

const themeAtom = atomWithStorage<Theme | null>("theme", null, createJSONStorage(), {
    getOnInit: true
});

export function useTheme(): [Theme, (theme: Theme) => void] {
    const [theme, setTheme] = useAtom(themeAtom);

    const system: Theme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    useEffect(() => {
        if (theme === null) setTheme(system);
    }, [theme, setTheme, system]);

    return [theme ?? system, setTheme];
}
