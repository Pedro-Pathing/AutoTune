package com.pedropathing.tuning.autotune;

import android.content.res.AssetManager;
import com.google.gson.Gson;
import fi.iki.elonen.NanoHTTPD;
import org.firstinspires.ftc.robotserver.internal.webserver.MimeTypesUtil;

import java.util.List;
import java.util.stream.Collectors;

public class WebServer extends NanoHTTPD {
    private final AssetManager assets;
    private final Gson gson = new Gson();

    public WebServer(AssetManager assets) {
        super(10158);
        this.assets = assets;
    }

    @Override
    public Response serve(IHTTPSession session) {
        try {
            String uri = session.getUri();
            if (session.getMethod() == Method.GET) {
                if (uri.toLowerCase().startsWith("/api")) {
                    if (uri.equalsIgnoreCase("/api/tuners")) {
                        List<TunerRegistrar.RegisteredProcedure> procedures = TunerRegistrar.getProcedures();
                        List<TunerMetadata> tuners = procedures.stream()
                                .map(procedure -> new TunerMetadata(procedure.id, procedure.name, procedure.procedure.description))
                                .collect(Collectors.toList());
                        return newFixedLengthResponse(Response.Status.OK, "application/json", gson.toJson(tuners));
                    }

                    return newFixedLengthResponse(Response.Status.NOT_FOUND, "text/plain", "Not found.");
                }

                if (uri.equalsIgnoreCase("/favicon.svg") || uri.toLowerCase().startsWith("/assets/")) {
                    return newChunkedResponse(Response.Status.OK, MimeTypesUtil.determineMimeType(uri), assets.open("pedro" + uri));
                }

                return newChunkedResponse(Response.Status.OK, "text/html", assets.open("pedro/index.html"));
            }

            return newFixedLengthResponse(Response.Status.METHOD_NOT_ALLOWED, "text/plain", "Method not allowed.");
        } catch (Exception e) {
            e.printStackTrace();
            return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "text/plain", "Internal error.");
        }
    }

    private static class TunerMetadata {
        public final String id;
        public final String name;
        public final String description;

        public TunerMetadata(String id, String name, String description) {
            this.name = name;
            this.description = description;
            this.id = id;
        }
    }
}
