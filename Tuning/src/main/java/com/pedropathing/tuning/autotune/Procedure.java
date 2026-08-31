package com.pedropathing.tuning.autotune;

import com.qualcomm.robotcore.eventloop.opmode.OpModeManagerImpl;
import dev.frozenmilk.sinister.sdk.opmodes.SinisterRegisteredOpModes;
import org.firstinspires.ftc.robotcore.internal.opmode.OpModeMeta;

import java.util.LinkedHashMap;
import java.util.Map;

public abstract class Procedure {
    public final String name;
    public final String description;

    private final Map<String, String> results = new LinkedHashMap<>();
    private final Map<Object, String> resultCode = new LinkedHashMap<>();
    private Display currentDisplay;

    public Procedure(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public abstract void run() throws InterruptedException;

    final void execute() throws InterruptedException {
        results.clear();
        resultCode.clear();
        run();
    }

    protected void confirmation(String title, String message) throws InterruptedException {
        TuningSession.requestConfirmation(title, message, currentDisplay);
    }

    protected Inputs inputs(String title, String description) {
        return new Inputs(title, description);
    }

    protected void awaitInputs(Inputs inputs) throws InterruptedException {
        TuningSession.requestInputs(inputs, currentDisplay);
    }

    protected final void abort(String message) throws InterruptedException {
        TuningSession.abort(message);
    }

    protected void withDisplay(Display display, InterruptibleBlock block) throws InterruptedException {
        Display previousDisplay = this.currentDisplay;
        this.currentDisplay = display;
        try {
            block.execute();
        } finally {
            this.currentDisplay = previousDisplay;
        }
    }

    protected final void result(String name, String value) {
        results.put(name, value);
    }

    protected final void result(String name, Object value) {
        result(name, value.toString());
    }

    protected final void code(String language, String code) {
        resultCode.put(language, code);
    }

    protected final void code(Language language, String code) {
        resultCode.put(language, code);
    }

    final Map<String, String> resultSnapshot() {
        return new LinkedHashMap<>(results);
    }

    final Map<Object, String> resultCodeSnapshot() {
        return new LinkedHashMap<>(resultCode);
    }

    protected final <Result> Result runOpMode(TuningOpMode<Result> opMode) throws InterruptedException {
        TuningSession.requestConfirmation(opMode.name, opMode.description, currentDisplay);

        OpModeMeta meta = new OpModeMeta.Builder()
                .setName("Pedro Tuning")
                .setFlavor(OpModeMeta.Flavor.UTILITY)
                .build();

        OpModeManagerImpl manager = Hooks.getOpModeManager();
        SinisterRegisteredOpModes.INSTANCE.register(meta, opMode);
        try {
            manager.initOpMode(meta.name);
            manager.startActiveOpMode();
            TuningSession.opModeStarted(opMode, currentDisplay);
            return opMode.awaitResult();
        } finally {
            TuningSession.opModeFinished(opMode);
            manager.requestOpModeStop(opMode);
            SinisterRegisteredOpModes.INSTANCE.unregister(meta);
        }
    }

    public enum Language {
        JAVA,
        KOTLIN,
        JSON
    }
}
