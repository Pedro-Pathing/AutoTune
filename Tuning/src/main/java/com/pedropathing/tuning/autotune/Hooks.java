package com.pedropathing.tuning.autotune;

import com.qualcomm.robotcore.eventloop.opmode.OpModeManagerImpl;
import dev.frozenmilk.sinister.sdk.apphooks.OnCreateEventLoop;
import dev.frozenmilk.sinister.sdk.apphooks.OnDestroy;

import java.io.IOException;

@SuppressWarnings("unused")
class Hooks {

    @SuppressWarnings("StaticFieldLeak")
    private static volatile OpModeManagerImpl opModeManager;
    private static volatile WebServer server;
    private static volatile WebSocketServer wsServer;
    private static final OnCreateEventLoop onCreateEventLoop = (context, eventLoop) ->
    {
        opModeManager = eventLoop.getOpModeManager();
        server = new WebServer(context.getAssets());
        wsServer = new WebSocketServer();
        try {
            server.start();
            wsServer.start(Integer.MAX_VALUE);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    };

    private static final OnDestroy onDestroy = context -> {
        TuningSession.abort();
        server.stop();
        wsServer.stop();
    };

    static OpModeManagerImpl getOpModeManager() {
        return opModeManager;
    }
}
