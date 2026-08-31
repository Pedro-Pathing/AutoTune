package com.pedropathing.tuning.autotune;

import android.content.res.AssetManager;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Callable;

import static com.pedropathing.tuning.autotune.Utils.nanoid;

public final class ImageRegistrar {
    private static final Map<String, Image> images = new HashMap<>();
    static AssetManager assets;

    static Map<String, Image> getImages() {
        return new HashMap<>(images);
    }

    private static Handle register(Callable<InputStream> data, String mimeType) {
        String id = nanoid();
        Image image = new Image(data, mimeType);
        images.put(id, image);
        return new Handle(id);
    }

    public static Handle registerPNG(Callable<InputStream> data) {
        return register(data, "image/png");
    }

    public static Handle registerAssetPNG(String path) {
        return registerPNG(() -> assets.open(path));
    }

    public static Handle registerJPEG(Callable<InputStream> data) {
        return register(data, "image/jpeg");
    }

    public static Handle registerAssetJPEG(String path) {
        return registerJPEG(() -> assets.open(path));
    }

    public static Handle registerSVG(Callable<InputStream> data) {
        return register(data, "image/svg+xml");
    }

    public static Handle registerAssetSVG(String path) {
        return registerSVG(() -> assets.open(path));
    }

    public static final class Handle {
        final String id;

        private Handle(String id) {
            this.id = id;
        }
    }

    static final class Image {
        public final Callable<InputStream> data;
        public final String mimeType;

        private Image(Callable<InputStream> data, String mimeType) {
            this.data = data;
            this.mimeType = mimeType;
        }
    }
}
