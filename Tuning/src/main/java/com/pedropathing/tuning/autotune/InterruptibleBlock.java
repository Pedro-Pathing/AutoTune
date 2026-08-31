package com.pedropathing.tuning.autotune;

@FunctionalInterface
public interface InterruptibleBlock {
    void execute() throws InterruptedException;
}
