import { useCallback, useEffect, useRef, useState } from "react";

import type { DisplayDefinition, InputsPayload } from "../lib/schemas";
import {
    TuningConnection,
    type ConnectionFailure,
    type TunerMessage
} from "../lib/tuningConnection";

type State =
    | { type: "loading" }
    | {
          type: "confirmation";
          requestId: number;
          title: string;
          message: string;
          display?: DisplayDefinition;
      }
    | { type: "inputs"; requestId: number; inputs: InputsPayload; display?: DisplayDefinition }
    | {
          type: "opModeRunning";
          requestId: number;
          canStop: boolean;
          stopRequested: boolean;
          name: string;
          display?: DisplayDefinition;
      }
    | { type: "complete"; results: Record<string, string>; resultCode: Record<string, string> }
    | { type: "error"; message: string };

export type AbortHandler = (message: string) => void;

function messageToState(message: TunerMessage): State {
    switch (message.type) {
        case "confirm":
            return {
                type: "confirmation",
                requestId: message.requestId,
                title: message.title,
                message: message.message,
                display: message.display
            };
        case "inputs":
            return {
                type: "inputs",
                requestId: message.requestId,
                inputs: message.inputs,
                display: message.display
            };
        case "opModeRunning":
            return {
                type: "opModeRunning",
                requestId: message.requestId,
                canStop: message.canStop,
                stopRequested: false,
                name: message.name,
                display: message.display
            };
        case "complete":
            return { type: "complete", results: message.results, resultCode: message.resultCode };
    }
}

export function useTuner(id: string | undefined) {
    const [state, setState] = useState<State>({ type: "loading" });
    const connectionRef = useRef<TuningConnection | null>(null);

    useEffect(() => {
        if (id === undefined || id.length === 0) {
            setState({
                type: "error",
                message: "No tuner was selected. Return to the tuner list and try again."
            });
            return;
        }

        setState({ type: "loading" });

        let connection: TuningConnection;

        try {
            connection = new TuningConnection(
                id,
                (message) => {
                    const nextState = messageToState(message);
                    setState(nextState);
                },
                (failure: ConnectionFailure) => {
                    setState({ type: "error", ...failure });
                }
            );
        } catch (error) {
            console.error("Failed to create WebSocket:", error);
            setState({
                type: "error",
                message: "The browser could not open a connection to the tuning server."
            });
            return;
        }

        connectionRef.current = connection;
        return () => {
            connection.dispose();
            if (connectionRef.current === connection) connectionRef.current = null;
        };
    }, [id]);

    function sendMessage(message: Record<string, unknown>) {
        const connection = connectionRef.current;
        if (connection !== null) return connection.send(message);

        setState({
            type: "error",
            message: "The browser was disconnected from the tuning server."
        });
        return false;
    }

    function confirm() {
        if (state.type !== "confirmation") return;
        if (sendMessage({ type: "confirm", requestId: state.requestId })) {
            setState({ type: "loading" });
        }
    }

    function submitInputs(inputs: Record<string, unknown>) {
        if (state.type !== "inputs") return;
        if (sendMessage({ type: "inputs", requestId: state.requestId, values: inputs })) {
            setState({ type: "loading" });
        }
    }

    function stopOpMode() {
        if (state.type !== "opModeRunning" || !state.canStop || state.stopRequested) {
            return;
        }

        const requestId = state.requestId;
        if (sendMessage({ type: "stopOpMode", requestId })) {
            setState((currentState) =>
                currentState.type === "opModeRunning" && currentState.requestId === requestId
                    ? { ...currentState, stopRequested: true }
                    : currentState
            );
        }
    }

    const abort = useCallback((message: string) => {
        connectionRef.current?.abort(message);
        setState({ type: "error", message });
    }, []);

    return { state, confirm, submitInputs, stopOpMode, abort };
}
