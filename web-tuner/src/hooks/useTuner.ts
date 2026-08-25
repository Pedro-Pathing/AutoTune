import { useCallback, useEffect, useRef, useState } from "react";

import type { InputsPayload } from "../lib/schemas";
import {
    TuningConnection,
    type ConnectionFailure,
    type TunerMessage
} from "../lib/tuningConnection";

type State =
    | { type: "loading" }
    | { type: "confirmation"; requestId: number; title: string; message: string }
    | { type: "inputs"; requestId: number; inputs: InputsPayload }
    | {
          type: "opModeRunning";
          requestId: number;
          canStop: boolean;
          stopRequested: boolean;
          name: string;
      }
    | { type: "complete"; results: Record<string, string> }
    | { type: "error"; message: string };

export type AbortHandler = (message: string) => void;

function messageToState(message: TunerMessage): State {
    switch (message.type) {
        case "confirm":
            return {
                type: "confirmation",
                requestId: message.requestId,
                title: message.title,
                message: message.message
            };
        case "inputs":
            return {
                type: "inputs",
                requestId: message.requestId,
                inputs: message.inputs
            };
        case "opModeRunning":
            return {
                type: "opModeRunning",
                requestId: message.requestId,
                canStop: message.canStop,
                stopRequested: false,
                name: message.name
            };
        case "complete":
            return { type: "complete", results: message.results };
    }
}

export function useTuner(id: string | undefined, enabled: boolean) {
    const [state, setState] = useState<State>({ type: "loading" });
    const connectionRef = useRef<TuningConnection | null>(null);
    const previousIdRef = useRef(id);
    const startedRef = useRef(false);
    const terminalRef = useRef(false);

    useEffect(() => {
        if (previousIdRef.current !== id) {
            previousIdRef.current = id;
            startedRef.current = false;
            terminalRef.current = false;
            setState({ type: "loading" });
        }

        if (id === undefined || id.length === 0) {
            terminalRef.current = true;
            setState({
                type: "error",
                message: "No tuner was selected. Return to the tuner list and try again."
            });
            return;
        }

        if (!enabled || document.fullscreenElement === null) {
            if (!terminalRef.current) startedRef.current = false;
            return;
        }

        if (startedRef.current) return;

        startedRef.current = true;
        terminalRef.current = false;
        setState({ type: "loading" });

        let connection: TuningConnection;

        try {
            connection = new TuningConnection(
                id,
                (message) => {
                    const nextState = messageToState(message);
                    if (nextState.type === "complete") terminalRef.current = true;
                    setState(nextState);
                },
                (failure: ConnectionFailure) => {
                    terminalRef.current = true;
                    setState({ type: "error", ...failure });
                }
            );
        } catch (error) {
            console.error("Failed to create WebSocket:", error);
            terminalRef.current = true;
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
    }, [id, enabled]);

    function sendMessage(message: Record<string, unknown>) {
        const connection = connectionRef.current;
        if (connection !== null) return connection.send(message);

        terminalRef.current = true;
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
        terminalRef.current = true;
        setState({ type: "error", message });
    }, []);

    return { state, confirm, submitInputs, stopOpMode, abort };
}
