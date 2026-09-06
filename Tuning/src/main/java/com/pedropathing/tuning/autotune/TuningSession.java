package com.pedropathing.tuning.autotune;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.CountDownLatch;

public final class TuningSession {
    private static final Object sessionLock = new Object();
    private static TuningSession currentSession;
    public final String name;
    private final Object requestLock = new Object();
    private final Procedure procedure;
    private final Transport client;
    private final Thread thread;
    private boolean abortRequested;
    private long nextRequestId;
    private PendingRequest activeRequest;
    private long activeOpModeRequestId;
    private TuningOpMode<?> activeOpMode;

    private TuningSession(Procedure procedure, Transport client, String name) {
        this.procedure = procedure;
        this.client = client;
        this.name = name;
        thread = new Thread(this::execute, "Pedro-Tuning");
    }

    static TuningSession beginProcedure(String id, Transport client) {
        TunerRegistrar.RegisteredProcedure procedure = TunerRegistrar.getProcedure(id);
        if (procedure == null) return null;

        TuningSession session = new TuningSession(procedure.procedure, client, procedure.name);
        synchronized (sessionLock) {
            if (currentSession != null) return null;

            currentSession = session;
            try {
                session.thread.start();
            } catch (RuntimeException | Error exception) {
                currentSession = null;
                throw exception;
            }
        }
        return session;
    }

    static void abort() {
        TuningSession session;
        synchronized (sessionLock) {
            session = currentSession;
        }
        abort(session);
    }

    static void abort(TuningSession session) {
        if (session == null) return;

        synchronized (sessionLock) {
            if (currentSession != session) return;
            session.abortRequested = true;
        }
        session.thread.interrupt();
    }

    static void abort(String message) throws InterruptedException {
        requireCurrentSession().abortProcedure(message);
    }

    static void requestConfirmation(String title, String message, Display display) throws InterruptedException {
        requireCurrentSession().awaitConfirmation(title, message, display);
    }

    static void requestInputs(Inputs inputs, Display display) throws InterruptedException {
        requireCurrentSession().awaitInputs(inputs, display);
    }

    static void opModeStarted(TuningOpMode<?> opMode, Display display) throws InterruptedException {
        requireCurrentSession().beginOpMode(opMode, display);
    }

    static void opModeFinished(TuningOpMode<?> opMode) {
        TuningSession session;
        synchronized (sessionLock) {
            session = currentSession;
        }
        if (session != null) session.endOpMode(opMode);
    }

    private static TuningSession requireCurrentSession() {
        synchronized (sessionLock) {
            if (currentSession == null) {
                throw new IllegalStateException("No tuning session is running.");
            }
            return currentSession;
        }
    }

    private static boolean matches(PendingRequest request, RequestType type, long requestId) {
        return request != null &&
                request.type == type &&
                (requestId == 0 || request.id == requestId);
    }

    private void execute() {
        try {
            runProcedure();
        } finally {
            synchronized (sessionLock) {
                if (currentSession == this) currentSession = null;
            }
        }
    }

    private void runProcedure() {
        try {
            procedure.execute();
            sendWhileRunning(() -> client.complete(procedure.resultSnapshot(), procedure.resultCodeSnapshot()));
        } catch (ProcedureAbortException exception) {
            Thread.currentThread().interrupt();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            client.error("The tuner ended before it completed.");
        } catch (IOException | RuntimeException | Error exception) {
            reportFailure(exception);
        }
    }

    private void abortProcedure(String message) throws InterruptedException {
        client.error(message);
        throw new ProcedureAbortException();
    }

    boolean confirm(long requestId) {
        PendingRequest request;
        synchronized (requestLock) {
            request = activeRequest;
            if (!matches(request, RequestType.CONFIRMATION, requestId)) return false;
            activeRequest = null;
        }
        request.complete();
        return true;
    }

    void submitInputs(long requestId, Map<String, Object> values) {
        PendingRequest request;
        synchronized (requestLock) {
            request = activeRequest;
            if (!matches(request, RequestType.INPUTS, requestId) || request.inputs == null) {
                throw new IllegalArgumentException(
                        "The submitted inputs are for a step that is no longer active."
                );
            }

            request.inputs.setValues(values);
            activeRequest = null;
        }
        request.complete();
    }

    private void awaitConfirmation(String title, String message, Display display) throws InterruptedException {
        awaitRequest(
                RequestType.CONFIRMATION,
                null,
                requestId -> client.requestConfirmation(requestId, title, message, display)
        );
    }

    private void awaitInputs(Inputs inputs, Display display) throws InterruptedException {
        awaitRequest(
                RequestType.INPUTS,
                inputs,
                requestId -> client.requestInputs(requestId, inputs, display)
        );
    }

    private void beginOpMode(TuningOpMode<?> opMode, Display display) throws InterruptedException {
        long requestId;
        synchronized (requestLock) {
            if (activeOpMode != null) {
                throw new IllegalStateException("Another tuning OpMode is already running.");
            }
            requestId = ++nextRequestId;
            activeOpModeRequestId = requestId;
            activeOpMode = opMode;
        }

        try {
            sendWhileRunning(() -> client.opModeRunning(requestId, opMode.canStop, opMode.name, display));
        } catch (IOException exception) {
            abort(this);
            throw new InterruptedException();
        }
    }

    private void endOpMode(TuningOpMode<?> opMode) {
        synchronized (requestLock) {
            if (activeOpMode == opMode) {
                activeOpMode = null;
                activeOpModeRequestId = 0;
            }
        }
    }

    void stopOpMode(long requestId) {
        synchronized (requestLock) {
            if (activeOpMode != null && activeOpModeRequestId == requestId && activeOpMode.canStop) {
                activeOpMode.requestOpModeStop();
            }
        }
    }

    private void awaitRequest(RequestType type, Inputs inputs, RequestSender sender)
            throws InterruptedException {
        PendingRequest request;
        synchronized (requestLock) {
            request = new PendingRequest(++nextRequestId, type, inputs);
            activeRequest = request;
            try {
                sendWhileRunning(() -> sender.send(request.id));
            } catch (IOException exception) {
                clearRequest(request);
                abort(this);
                throw new InterruptedException();
            } catch (InterruptedException | RuntimeException | Error exception) {
                clearRequest(request);
                throw exception;
            }
        }

        try {
            request.await();
        } finally {
            synchronized (requestLock) {
                clearRequest(request);
            }
        }
    }

    private void clearRequest(PendingRequest request) {
        if (activeRequest == request) activeRequest = null;
    }

    private void sendWhileRunning(IoAction action) throws IOException, InterruptedException {
        synchronized (sessionLock) {
            if (currentSession != this || abortRequested || Thread.currentThread().isInterrupted()) {
                throw new InterruptedException();
            }
            action.run();
        }
    }

    private void reportFailure(Throwable failure) {
        failure.printStackTrace();
        String detail = failure.getMessage();
        if (detail == null || detail.trim().isEmpty()) {
            detail = failure.getClass().getSimpleName();
        }
        client.error("The backend stopped the tuning procedure: " + detail);
    }

    private enum RequestType {
        CONFIRMATION,
        INPUTS
    }

    interface Transport {
        void requestConfirmation(long requestId, String title, String message, Display display) throws IOException;

        void requestInputs(long requestId, Inputs inputs, Display display) throws IOException;

        void opModeRunning(long requestId, boolean canStop, String name, Display display) throws IOException;

        void complete(Map<String, String> results, Map<Object, String> resultCode) throws IOException;

        void error(String message);
    }

    private interface IoAction {
        void run() throws IOException;
    }

    private interface RequestSender {
        void send(long requestId) throws IOException;
    }

    private static final class ProcedureAbortException extends InterruptedException {
    }

    private static final class PendingRequest {
        final long id;
        final RequestType type;
        final Inputs inputs;
        private final CountDownLatch response = new CountDownLatch(1);

        PendingRequest(long id, RequestType type, Inputs inputs) {
            this.id = id;
            this.type = type;
            this.inputs = inputs;
        }

        void await() throws InterruptedException {
            response.await();
        }

        void complete() {
            response.countDown();
        }
    }
}
