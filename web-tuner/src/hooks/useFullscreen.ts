import { useEffect, useState } from "react";

export function useFullscreen() {
    const [active, setActive] = useState(document.fullscreenElement !== null);
    const [requesting, setRequesting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        function handleFullscreenChange() {
            setActive(document.fullscreenElement !== null);
            setError(null);
        }

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        handleFullscreenChange();

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    async function requestFullscreen() {
        if (document.fullscreenElement !== null) return;

        if (typeof document.documentElement.requestFullscreen !== "function") {
            setError(
                "This browser does not support fullscreen. Use a supported browser to start the tuner."
            );
            return;
        }

        setRequesting(true);
        setError(null);

        try {
            await document.documentElement.requestFullscreen();
        } catch (error) {
            if (document.fullscreenElement !== null) return;

            console.warn("Fullscreen request was denied:", error);
            setError(
                "The browser did not allow fullscreen. Check this site's fullscreen permission, then try again."
            );
        } finally {
            setRequesting(false);
        }
    }

    return { active, requesting, error, requestFullscreen };
}
