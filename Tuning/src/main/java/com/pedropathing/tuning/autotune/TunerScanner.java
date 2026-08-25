package com.pedropathing.tuning.autotune;

import dev.frozenmilk.sinister.Scanner;
import dev.frozenmilk.sinister.targeting.NarrowSearch;
import dev.frozenmilk.sinister.targeting.SearchTarget;
import dev.frozenmilk.util.graph.Graph;
import dev.frozenmilk.util.graph.rule.AdjacencyRule;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

public class TunerScanner implements Scanner {
    public static final TunerScanner INSTANCE = new TunerScanner();

    @Override
    public AdjacencyRule<Scanner, Graph<Scanner>> getLoadAdjacencyRule() {
        return Scanner.INDEPENDENT();
    }

    @Override
    public AdjacencyRule<Scanner, Graph<Scanner>> getUnloadAdjacencyRule() {
        return Scanner.INDEPENDENT();
    }

    @Override
    public SearchTarget getTargets() {
        return new NarrowSearch();
    }

    @Override
    public void scan(ClassLoader loader, Class<?> clazz) {
        List<Method> tunerFactories = Arrays.stream(clazz.getDeclaredMethods())
                .filter(method -> method.isAnnotationPresent(Tuner.class))
                .collect(Collectors.toList());

        for (Method factory : tunerFactories) {
            if (!Modifier.isStatic(factory.getModifiers()))
                throw new IllegalArgumentException(String.format("Method %s.%s is annotated with @Tuner, but is not static.", clazz.getCanonicalName(), factory.getName()));
            if (factory.getParameterCount() != 0)
                throw new IllegalArgumentException(String.format("Method %s.%s is annotated with @Tuner, but has %d parameters instead of 0.", clazz.getCanonicalName(), factory.getName(), factory.getParameterCount()));
            if (factory.getReturnType() != Procedure.class)
                throw new IllegalArgumentException(String.format("Method %s.%s is annotated with @Tuner, but returns %s instead of Procedure.", clazz.getCanonicalName(), factory.getName(), factory.getReturnType().getCanonicalName()));
            factory.setAccessible(true);
            Procedure procedure;
            try {
                procedure = (Procedure) factory.invoke(null);
            } catch (IllegalAccessException | InvocationTargetException e) {
                e.printStackTrace();
                continue;
            }
            Tuner annotation = factory.getAnnotation(Tuner.class);
            TunerRegistrar.register(annotation.name(), procedure);
        }
    }

    @Override
    public void unload(ClassLoader loader, Class<?> clazz) {
        TunerRegistrar.deregisterAll();
    }
}
