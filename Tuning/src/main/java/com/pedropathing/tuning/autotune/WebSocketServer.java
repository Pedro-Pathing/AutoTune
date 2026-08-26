package com.pedropathing.tuning.autotune;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonSerializationContext;
import com.google.gson.JsonSerializer;
import fi.iki.elonen.NanoWSD;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.Map;

public class WebSocketServer extends NanoWSD {
    private static final Gson GSON = new GsonBuilder()
            .registerTypeAdapter(
                    Inputs.Field.class,
                    (JsonSerializer<Inputs.Field<?>>) WebSocketServer::serializeInputField
            )
            .create();

    private static final Object socketLock = new Object();
    private static Socket activeSocket;

    public WebSocketServer() {
        super(12649);
    }

    @Override
    protected WebSocket openWebSocket(IHTTPSession handshake) {
        return new Socket(handshake);
    }

    private static JsonElement serializeInputField(
            Inputs.Field<?> field,
            Type ignoredType,
            JsonSerializationContext context
    ) {
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

        ConfirmationOutgoing(long requestId, String title, String message) {
            this.requestId = requestId;
            this.title = title;
            this.message = message;
        }
    }

    private static final class InputsOutgoing {
        final String type = "inputs";
        final long requestId;
        final Inputs inputs;

        InputsOutgoing(long requestId, Inputs inputs) {
            this.requestId = requestId;
            this.inputs = inputs;
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

    private static final class OpModeRunningOutgoing {
        final String type = "opModeRunning";
        final long requestId;
        final boolean canStop;
        final String name;

        OpModeRunningOutgoing(long requestId, boolean canStop, String name) {
            this.requestId = requestId;
            this.canStop = canStop;
            this.name = name;
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
        protected void onClose(WebSocketFrame.CloseCode code, String reason, boolean initiatedByRemote) {
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
            } catch (RuntimeException exception) {
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
            release();
        }

        @Override
        public void requestConfirmation(long requestId, String title, String message) throws IOException {
            sendMessage(new ConfirmationOutgoing(requestId, title, message));
        }

        @Override
        public void requestInputs(long requestId, Inputs inputs) throws IOException {
            sendMessage(new InputsOutgoing(requestId, inputs));
        }

        @Override
        public void opModeRunning(long requestId, boolean canStop, String name) throws IOException {
            sendMessage(new OpModeRunningOutgoing(requestId, canStop, name));
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
