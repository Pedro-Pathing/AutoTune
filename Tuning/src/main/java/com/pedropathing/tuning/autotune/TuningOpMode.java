package com.pedropathing.tuning.autotune;

import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;

import java.util.concurrent.CountDownLatch;

public abstract class TuningOpMode<Result> extends LinearOpMode {
    public final String name;
    public final String description;
    public final boolean canStop;
    private final CountDownLatch finished = new CountDownLatch(1);
    private Throwable failure;
    private Result result;

    public TuningOpMode(String name, String description, boolean canStop) {
        this.name = name;
        this.description = description;
        this.canStop = canStop;
    }

    @Override
    public final void runOpMode() throws InterruptedException {
        try {
            result = runTuningOpMode();
        } catch (InterruptedException | RuntimeException | Error exception) {
            failure = exception;
            throw exception;
        } finally {
            finished.countDown();
        }
    }

    protected abstract Result runTuningOpMode() throws InterruptedException;

    final Result awaitResult() throws InterruptedException {
        finished.await();
        if (failure instanceof InterruptedException) throw (InterruptedException) failure;
        if (failure instanceof RuntimeException) throw (RuntimeException) failure;
        if (failure instanceof Error) throw (Error) failure;
        return result;
    }
}
