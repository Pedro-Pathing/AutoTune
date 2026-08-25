import { serverMessageSchema, type ServerMessage } from "./schemas";

export type ConnectionFailure = { message: string };
export type TunerMessage = Exclude<ServerMessage, { type: "error" }>;

export class TuningConnection {
    private readonly socket: WebSocket;
    private ended = false;
    private deadlineId: number | null = null;

    constructor(
        id: string,
        private readonly onMessage: (message: TunerMessage) => void,
        private readonly onFailure: (failure: ConnectionFailure) => void
    ) {
        this.socket = new WebSocket(`ws://${window.location.hostname}:12649`);
        this.socket.onopen = () => {
            this.clearDeadline();
            if (this.send({ type: "init", id })) {
                this.armDeadline(
                    10_000,
                    "The tuning server connected but did not respond. Make sure it is ready and try again."
                );
            }
        };
        this.socket.onmessage = (event) => this.handleMessage(event);
        this.socket.onerror = () => this.fail("The connection to the tuning server failed.");
        this.socket.onclose = () => this.fail("The tuning server disconnected.");

        this.armDeadline(
            10_000,
            "The connection to the tuning server timed out. Make sure the server is running and try again."
        );
    }

    send(message: Record<string, unknown>): boolean {
        if (this.ended) return false;

        if (this.socket.readyState !== WebSocket.OPEN) {
            this.fail("The browser is no longer connected to the tuning server.");
            return false;
        }

        try {
            this.socket.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error("Failed to send WebSocket message:", error);
            this.fail("The browser could not send a message to the tuning server.");
            return false;
        }
    }

    abort(message: string) {
        if (this.ended) return;

        if (this.socket.readyState === WebSocket.OPEN) {
            this.send({ type: "abort" });
        }

        this.fail(message);
    }

    dispose() {
        this.ended = true;
        this.clearDeadline();
        this.socket.onopen = null;
        this.socket.onmessage = null;
        this.socket.onerror = null;
        this.socket.onclose = null;
        this.socket.close();
    }

    private handleMessage(event: MessageEvent) {
        if (this.ended) return;

        this.clearDeadline();

        let message: ServerMessage;
        try {
            message = serverMessageSchema.parse(JSON.parse(event.data));
        } catch {
            this.fail("The tuning server sent an invalid response.");
            return;
        }

        if (message.type === "error") {
            this.fail(message.message);
            return;
        }

        if (message.type === "complete") {
            this.ended = true;
            this.socket.close();
        }

        this.onMessage(message);
    }

    private fail(message: string) {
        if (this.ended) return;

        this.ended = true;
        this.clearDeadline();
        this.socket.close();
        this.onFailure({ message });
    }

    private armDeadline(delay: number, message: string) {
        this.clearDeadline();
        this.deadlineId = window.setTimeout(() => this.fail(message), delay);
    }

    private clearDeadline() {
        if (this.deadlineId === null) return;

        window.clearTimeout(this.deadlineId);
        this.deadlineId = null;
    }
}
