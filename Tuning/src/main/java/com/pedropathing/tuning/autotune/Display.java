package com.pedropathing.tuning.autotune;

public abstract class Display {
    private Display() {

    }

    public static Display.Image image(ImageRegistrar.Handle lightMode, ImageRegistrar.Handle darkMode) {
        return new Image(lightMode, darkMode);
    }

    public static Display.Image image(ImageRegistrar.Handle handle) {
        return image(handle, handle);
    }

    public static class Image extends Display {
        private final ImageRegistrar.Handle lightMode;
        private final ImageRegistrar.Handle darkMode;

        private Image(ImageRegistrar.Handle lightMode, ImageRegistrar.Handle darkMode) {
            this.lightMode = lightMode;
            this.darkMode = darkMode;
        }
    }

    public static class FourWheelBot extends Display {
        public enum Wheel {
            FRONT_LEFT,
            FRONT_RIGHT,
            BACK_LEFT,
            BACK_RIGHT
        }

        private final Wheel wheel;
        private final boolean reversed;

        private FourWheelBot(Wheel wheel, boolean reversed) {
            this.wheel = wheel;
            this.reversed = reversed;
        }
    }

    public static Display.FourWheelBot fourWheelBot(FourWheelBot.Wheel wheel, boolean reversed) {
        return new FourWheelBot(wheel, reversed);
    }
}
