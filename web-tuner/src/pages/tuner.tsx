import { useParams } from "react-router";

import Header from "../components/header";
import Complete from "../components/screens/complete";
import Confirmation from "../components/screens/confirmation";
import ErrorScreen from "../components/screens/error";
import Inputs from "../components/screens/inputs";
import Loading from "../components/screens/loading";
import OpMode from "../components/screens/opMode";
import { useTuner } from "../hooks/useTuner";

export default function Tuner() {
    const { id } = useParams();
    const { state, confirm, submitInputs, stopOpMode, abort } = useTuner(id);
    const ended = state.type === "complete" || state.type === "error";

    return (
        <div className="flex h-screen flex-col overflow-hidden">
            <Header abortDisabled={ended} abort={abort} />
            {state.type === "loading" && <Loading />}
            {state.type === "confirmation" && (
                <Confirmation
                    title={state.title}
                    message={state.message}
                    display={state.display}
                    onConfirm={confirm}
                />
            )}
            {state.type === "complete" && (
                <Complete results={state.results} resultCode={state.resultCode} />
            )}
            {state.type === "inputs" && (
                <Inputs {...state.inputs} display={state.display} onSubmit={submitInputs} />
            )}
            {state.type === "opModeRunning" && (
                <OpMode
                    name={state.name}
                    display={state.display}
                    canStop={state.canStop}
                    stopRequested={state.stopRequested}
                    onStop={stopOpMode}
                />
            )}
            {state.type === "error" && <ErrorScreen message={state.message} />}
        </div>
    );
}
