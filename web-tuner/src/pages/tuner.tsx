import { useEffect } from "react";
import { useParams } from "react-router";

import Header from "../components/header";
import Complete from "../components/screens/complete";
import Confirmation from "../components/screens/confirmation";
import ErrorScreen from "../components/screens/error";
import Fullscreen from "../components/screens/fullscreen";
import Inputs from "../components/screens/inputs";
import Loading from "../components/screens/loading";
import OpMode from "../components/screens/opMode";
import { useFullscreen } from "../hooks/useFullscreen";
import { useProtection } from "../hooks/useProtection";
import { useTuner } from "../hooks/useTuner";

export default function Tuner() {
    const { id } = useParams();
    const {
        active: fullscreenActive,
        requesting,
        error: fullscreenError,
        requestFullscreen
    } = useFullscreen();
    const { state, confirm, submitInputs, stopOpMode, abort } = useTuner(id, fullscreenActive);
    const ended = state.type === "complete" || state.type === "error";
    const fullscreenRequired = !fullscreenActive && !ended;

    useProtection(abort, fullscreenActive && !ended, ended);

    useEffect(() => {
        if (!ended || !fullscreenActive) return;

        void document.exitFullscreen().catch((error) => {
            console.warn("Failed to exit fullscreen:", error);
        });
    }, [fullscreenActive, ended]);

    return (
        <div className="flex h-screen flex-col overflow-hidden">
            <Header abortDisabled={fullscreenRequired || ended} abort={abort} />
            {fullscreenRequired ? (
                <Fullscreen
                    requesting={requesting}
                    error={fullscreenError}
                    onRequest={requestFullscreen}
                />
            ) : (
                <>
                    {state.type === "loading" && <Loading />}
                    {state.type === "confirmation" && (
                        <Confirmation
                            title={state.title}
                            message={state.message}
                            onConfirm={confirm}
                        />
                    )}
                    {state.type === "complete" && <Complete results={state.results} />}
                    {state.type === "inputs" && (
                        <Inputs {...state.inputs} onSubmit={submitInputs} />
                    )}
                    {state.type === "opModeRunning" && (
                        <OpMode
                            name={state.name}
                            canStop={state.canStop}
                            stopRequested={state.stopRequested}
                            onStop={stopOpMode}
                        />
                    )}
                    {state.type === "error" && <ErrorScreen message={state.message} />}
                </>
            )}
        </div>
    );
}
