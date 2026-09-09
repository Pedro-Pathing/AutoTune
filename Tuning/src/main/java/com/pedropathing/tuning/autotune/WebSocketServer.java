package com.pedropathing.tuning.autotune;

import android.util.Log;
import com.google.gson.*;
import com.google.gson.typeadapters.RuntimeTypeAdapterFactory;
import fi.iki.elonen.NanoWSD;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.Map;

public class WebSocketServer extends NanoWSD {
    private static final JsonSerializer<Inputs.Field<?>> inputFieldSerializer = (
            Inputs.Field<?> field,
            Type type,
            JsonSerializationContext context
    ) -> {
        JsonObject json = new JsonObject();
        json.addProperty("id", field.id);
        json.addProperty("name", field.name);
        json.addProperty("type", field.type.name());

        if (field.defaultValue instanceof Enum<?>) {
            json.addProperty("defaultValue", ((Enum<?>) field.defaultValue).name());
        } else if (field.defaultValue != null) {
            json.add("defaultValue", context.serialize(field.defaultValue));
        }

        if (field instanceof Inputs.StringField) {
            json.addProperty("allowEmpty", ((Inputs.StringField) field).allowsEmpty());
        } else if (field instanceof Inputs.NumberField<?>) {
            Inputs.NumberField<?> number = (Inputs.NumberField<?>) field;
            if (number.min != null) json.add("min", context.serialize(number.min));
            if (number.max != null) json.add("max", context.serialize(number.max));
        } else if (field instanceof Inputs.EnumField<?>) {
            JsonArray options = new JsonArray();
            for (Enum<?> option : ((Inputs.EnumField<?>) field).options) {
                JsonObject optionJson = new JsonObject();
                optionJson.add("name", context.serialize(option.name()));
                optionJson.add("displayName", context.serialize(getDisplayName(option)));
                options.add(optionJson);
            }
            json.add("options", options);
        }

        return json;
    };

    private static final JsonSerializer<ImageRegistrar.Handle> imageHandleSerializer = (
            ImageRegistrar.Handle handle,
            Type type,
            JsonSerializationContext context
    ) -> context.serialize(handle.id);

    private static final Gson GSON = new GsonBuilder()
            .registerTypeAdapter(Inputs.Field.class, inputFieldSerializer)
            .registerTypeAdapter(ImageRegistrar.Handle.class, imageHandleSerializer)
            .registerTypeAdapterFactory(
                    RuntimeTypeAdapterFactory
                            .of(Display.class, "type")
                            .registerSubtype(Display.Image.class, "image")
                            .registerSubtype(Display.FourWheelBot.class, "fourWheelBot")
            )
            .create();

    private static final Object socketLock = new Object();
    private static Socket activeSocket;


    public WebSocketServer() {
        super(12649);
    }

    private static String getDisplayName(Enum<?> option) {
        try {
            DisplayName annotation = option.getDeclaringClass().getField(option.name()).getAnnotation(DisplayName.class);
            if (annotation == null) return option.name();
            else return annotation.value();
        } catch (NoSuchFieldException e) {
            throw new RuntimeException(e);
        }
    }

    private static boolean isKnownType(String type) {
        return "init".equals(type) ||
                "confirm".equals(type) ||
                "inputs".equals(type) ||
                "stopOpMode".equals(type) ||
                "abort".equals(type);
    }

    private static String failureMessage(Throwable failure) {
        String message = failure.getMessage();
        if (message == null || message.trim().isEmpty()) {
            return "The backend stopped with " + failure.getClass().getSimpleName() + ".";
        }
        return message;
    }

    @Override
    protected WebSocket openWebSocket(IHTTPSession handshake) {
        return new Socket(handshake);
    }

    private static final class Incoming {
        String type;
        String id;
        long requestId;
        Map<String, Object> values;
    }

    private static final class ConfirmationOutgoing {
        final String type = "confirm";
        final long requestId;
        final String title;
        final String message;
        final Display display;

        ConfirmationOutgoing(long requestId, String title, String message, Display display) {
            this.requestId = requestId;
            this.title = title;
            this.message = message;
            this.display = display;
        }
    }

    private static final class InputsOutgoing {
        final String type = "inputs";
        final long requestId;
        final Inputs inputs;
        final Display display;

        InputsOutgoing(long requestId, Inputs inputs, Display display) {
            this.requestId = requestId;
            this.inputs = inputs;
            this.display = display;
        }
    }

    private static final class CompleteOutgoing {
        final String type = "complete";
        final Map<String, String> results;
        final Map<Object, String> resultCode;

        CompleteOutgoing(Map<String, String> results, Map<Object, String> resultCode) {
            this.results = results;
            this.resultCode = resultCode;
        }
    }

    private static final class InitOutgoing {
        final String type = "init";
        final String name;

        InitOutgoing(String name) {
            this.name = name;
        }
    }

    private static final class OpModeRunningOutgoing {
        final String type = "opModeRunning";
        final long requestId;
        final boolean canStop;
        final String name;
        final Display display;

        OpModeRunningOutgoing(long requestId, boolean canStop, String name, Display display) {
            this.requestId = requestId;
            this.canStop = canStop;
            this.name = name;
            this.display = display;
        }
    }

    private static final class ErrorOutgoing {
        final String type = "error";
        final String message;

        ErrorOutgoing(String message) {
            this.message = message;
        }
    }

    private static final class Socket extends WebSocket implements TuningSession.Transport {
        private TuningSession session;

        Socket(IHTTPSession handshake) {
            super(handshake);
        }

        @Override
        protected void onOpen() {
            if (claim()) return;
            closeQuietly(
                    WebSocketFrame.CloseCode.PolicyViolation,
                    "A tuning client is already connected."
            );
        }

        @Override
        protected void debugFrameReceived(WebSocketFrame frame) {
            logCloseFrame("RECEIVED", frame);
        }

        @Override
        protected void debugFrameSent(WebSocketFrame frame) {
            logCloseFrame("SENT", frame);
        }

        private void logCloseFrame(String direction, WebSocketFrame frame) {
            if (frame.getOpCode() != WebSocketFrame.OpCode.Close) return;

            // NanoWSD does not populate the CloseFrame getters for outgoing frames.
            byte[] payload = frame.getBinaryPayload();
            String code = payload.length >= 2
                    ? Integer.toString(((payload[0] & 0xff) << 8) | (payload[1] & 0xff))
                    : "none";
            String reason = payload.length > 2
                    ? new String(payload, 2, payload.length - 2, java.nio.charset.StandardCharsets.UTF_8)
                    : "";
            Log.d("WebSocketServer",
                    "socket=" + Integer.toHexString(System.identityHashCode(this))
                    + " peer=" + getHandshakeRequest().getRemoteIpAddress()
                    + " " + direction + " CLOSE"
                    + " code=" + code
                    + " reason=" + reason);
        }

        @Override
        protected void onClose(WebSocketFrame.CloseCode code, String reason, boolean initiatedByRemote) {
            Log.d("WebSocketServer", "WebSocket closed, code: " + code  + ", reason: " + reason + ", initiatedByRemote: " + initiatedByRemote);
            release();
        }

        @Override
        protected void onMessage(WebSocketFrame frame) {
            if (!isCurrent()) return;

            Incoming incoming;
            try {
                incoming = GSON.fromJson(frame.getTextPayload(), Incoming.class);
                if (incoming == null || !isKnownType(incoming.type)) {
                    throw new IllegalArgumentException("Unknown message type.");
                }
            } catch (RuntimeException exception) {
                fail(
                        "The tuning server could not understand a message from the browser.",
                        exception
                );
                return;
            }

            handle(incoming);
        }

        private void handle(Incoming incoming) {
            if ("init".equals(incoming.type)) {
                handleInit(incoming.id);
                return;
            }

            if (session == null) {
                terminateWithError(
                        "The browser sent a message that is not valid for the current procedure."
                );
                return;
            }

            switch (incoming.type) {
                case "confirm":
                    handleConfirmation(incoming.requestId);
                    break;
                case "inputs":
                    handleInputs(incoming.requestId, incoming.values);
                    break;
                case "stopOpMode":
                    session.stopOpMode(incoming.requestId);
                    break;
                case "abort":
                    closeNormally("Procedure ended.");
                    break;
            }
        }

        private void handleInit(String id) {
            if (session != null) {
                terminateWithError(
                        "This connection already has a tuning procedure. Reload the page to start over."
                );
                return;
            }

            try {
                session = TuningSession.beginProcedure(id, this);
                if (session != null) sendMessage(new InitOutgoing(session.name));
            } catch (RuntimeException | IOException exception) {
                fail(failureMessage(exception), exception);
                return;
            }

            if (session == null) {
                sendError(
                        "The requested procedure does not exist, or another procedure is still running."
                );
            }
        }

        private void handleConfirmation(long requestId) {
            if (!session.confirm(requestId)) {
                terminateWithError(
                        "The procedure received a confirmation for a step that is no longer active."
                );
            }
        }

        private void handleInputs(long requestId, Map<String, Object> values) {
            try {
                session.submitInputs(requestId, values);
            } catch (IllegalArgumentException exception) {
                fail(exception.getMessage(), exception);
            } catch (RuntimeException exception) {
                fail(failureMessage(exception), exception);
            }
        }

        @Override
        protected void onPong(WebSocketFrame pong) {
        }

        @Override
        protected void onException(IOException exception) {
            Log.e("WebSocketServer", "WebSocket IO Error", exception);
            release();
        }

        @Override
        public void requestConfirmation(long requestId, String title, String message, Display display) throws IOException {
            sendMessage(new ConfirmationOutgoing(requestId, title, message, display));
        }

        @Override
        public void requestInputs(long requestId, Inputs inputs, Display display) throws IOException {
            sendMessage(new InputsOutgoing(requestId, inputs, display));
        }

        @Override
        public void opModeRunning(long requestId, boolean canStop, String name, Display display) throws IOException {
            sendMessage(new OpModeRunningOutgoing(requestId, canStop, name, display));
        }

        @Override
        public void complete(Map<String, String> results, Map<Object, String> resultCode) throws IOException {
            sendMessage(new CompleteOutgoing(results, resultCode));
        }

        @Override
        public void error(String message) {
            sendError(message);
        }

        private synchronized void sendMessage(Object message) throws IOException {
            if (!isCurrent() || !isOpen()) {
                throw new IOException("The tuning client is disconnected.");
            }
            super.send(GSON.toJson(message));
        }

        private void fail(String message, Throwable failure) {
            failure.printStackTrace();
            terminateWithError(
                    message == null || message.trim().isEmpty() ? failureMessage(failure) : message
            );
        }

        private void terminateWithError(String message) {
            sendError(message);
            abortSession();
        }

        private void sendError(String message) {
            try {
                sendMessage(new ErrorOutgoing(message));
            } catch (IOException ignored) {
            }
        }

        private boolean claim() {
            synchronized (socketLock) {
                if (activeSocket != null) return false;
                activeSocket = this;
                return true;
            }
        }

        private boolean isCurrent() {
            synchronized (socketLock) {
                return activeSocket == this;
            }
        }

        private void closeNormally(String reason) {
            release();
            closeQuietly(WebSocketFrame.CloseCode.NormalClosure, reason);
        }

        private void closeQuietly(WebSocketFrame.CloseCode code, String reason) {
            try {
                close(code, reason, false);
            } catch (IOException ignored) {
            }
        }

        private void release() {
            synchronized (socketLock) {
                if (activeSocket != this) return;
                activeSocket = null;
            }
            abortSession();
        }

        private void abortSession() {
            TuningSession activeSession = session;
            session = null;
            TuningSession.abort(activeSession);
        }
    }
}
