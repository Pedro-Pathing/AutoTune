import { useEffect, useRef } from "react";

import type { AbortHandler } from "./useTuner";

export function useProtection(abort: AbortHandler, active: boolean, ended: boolean) {
    const activeRef = useRef(active);
    const endedRef = useRef(ended);
    activeRef.current = active;
    endedRef.current = ended;

    useEffect(() => {
        let fullscreenEntered = document.fullscreenElement !== null;

        function handleBlur() {
            if (!activeRef.current) return;
            abort("The tuner was aborted because the window lost focus.");
        }

        function handleVisibilityChange() {
            if (activeRef.current && document.visibilityState === "hidden") {
                abort("The tuner was aborted because the tab was hidden.");
            }
        }

        function handleFullscreenChange() {
            if (document.fullscreenElement !== null) {
                fullscreenEntered = true;
                return;
            }

            if (!fullscreenEntered || endedRef.current) return;

            fullscreenEntered = false;
            abort("The tuner was aborted because fullscreen mode was exited.");
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (!activeRef.current || event.code !== "Space") return;
            event.preventDefault();
            abort("The tuner was aborted with the spacebar.");
        }

        window.addEventListener("blur", handleBlur);
        window.addEventListener("keydown", handleKeyDown);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, [abort]);
}
