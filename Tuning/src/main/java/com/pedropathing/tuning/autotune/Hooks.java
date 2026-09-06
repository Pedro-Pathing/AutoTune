package com.pedropathing.tuning.autotune;

import com.qualcomm.robotcore.eventloop.opmode.OpModeManagerImpl;
import dev.frozenmilk.sinister.sdk.apphooks.OnCreateEventLoop;
import dev.frozenmilk.sinister.sdk.apphooks.OnDestroy;

import java.io.IOException;

@SuppressWarnings("unused")
class Hooks {

    private static final Object serverLock = new Object();

    @SuppressWarnings("StaticFieldLeak")
    private static volatile OpModeManagerImpl opModeManager;
    private static volatile WebServer server;
    private static volatile WebSocketServer wsServer;
    private static final OnCreateEventLoop onCreateEventLoop = (context, eventLoop) ->
    {
        synchronized (serverLock) {
            stop();
            opModeManager = eventLoop.getOpModeManager();
            ImageRegistrar.assets = context.getAssets();
            server = new WebServer(context.getAssets());
            wsServer = new WebSocketServer();
            try {
                server.start();
                wsServer.start(Integer.MAX_VALUE);
            } catch (IOException e) {
                stop();
                throw new RuntimeException(e);
            }
        }
    };

    private static final OnDestroy onDestroy = context -> {
        synchronized (serverLock) {
            stop();
            opModeManager = null;
        }
    };

    private static void stop() {
        TuningSession.abort();
        if (wsServer != null) {
            wsServer.stop();
            wsServer = null;
        }
        if (server != null) {
            server.stop();
            server = null;
        }
    }

    static OpModeManagerImpl getOpModeManager() {
        return opModeManager;
    }
}
