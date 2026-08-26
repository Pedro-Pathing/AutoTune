package com.pedropathing.tuning.autotune;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static com.pedropathing.tuning.autotune.Utils.nanoid;

public class TunerRegistrar {
    private static final List<RegisteredProcedure> procedures = new ArrayList<>();

    public static void register(String name, Procedure procedure) {
        procedures.add(
                new RegisteredProcedure(
                        name.isEmpty() ? procedure.name : name,
                        procedure
                )
        );
    }

    public static void deregisterAll() {
        procedures.clear();
    }

    public static List<RegisteredProcedure> getProcedures() {
        return Collections.unmodifiableList(procedures);
    }

    public static Procedure getProcedure(String id) {
        return procedures.stream()
                .filter(procedure -> procedure.id.equals(id))
                .map(procedure -> procedure.procedure)
                .findFirst()
                .orElse(null);
    }

    public static class RegisteredProcedure {
        public final String name;
        public final String id;
        public final Procedure procedure;

        public RegisteredProcedure(String name, Procedure procedure) {
            this.name = name;
            this.procedure = procedure;
            id = nanoid();
        }
    }
}
