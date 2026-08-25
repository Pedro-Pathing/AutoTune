package com.pedropathing.tuning.autotune;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static com.aventrix.jnanoid.jnanoid.NanoIdUtils.randomNanoId;

public class Inputs {
    public final String name;
    public final String description;
    private final List<Field<?>> fields = new ArrayList<>();

    public Inputs(String name, String description) {
        this.name = name;
        this.description = description;
    }

    void setValues(Map<String, Object> values) {
        if (values == null) throw new IllegalArgumentException("Input values are missing.");

        List<Object> converted = new ArrayList<>(fields.size());
        for (Field<?> field : fields) {
            Object value = values.get(field.id);
            if (value == null) throw new IllegalArgumentException("Field '" + field.name + "' not set.");
            Object convertedValue = convert(field, value);
            validate(field, convertedValue);
            converted.add(convertedValue);
        }
        // we do this in a separate step so that if a field is invalid, we throw before assigning some of the fields
        for (int index = 0; index < fields.size(); index++) {
            set(fields.get(index), converted.get(index));
        }
    }

    private static Object convert(Field<?> field, Object value) {
        switch (field.type) {
            case STRING:
                if (value instanceof String) return value;
                break;
            case DOUBLE:
                if (value instanceof Number) {
                    return ((Number) value).doubleValue();
                }
                break;
            case BOOLEAN:
                if (value instanceof Boolean) return value;
                break;
            case INT:
                if (value instanceof Number) {
                    double number = ((Number) value).doubleValue();
                    return (int) number;
                }
                break;
            case ENUM:
                if (value instanceof String) {
                    for (Enum<?> option : ((EnumField<?>) field).options) {
                        if (option.name().equals(value)) return option;
                    }
                }
                break;
        }
        throw new IllegalArgumentException("Invalid value for field '" + field.name + "'.");
    }

    @SuppressWarnings("unchecked")
    private static <Value> void validate(Field<Value> field, Object value) {
        field.validate((Value) value);
    }

    @SuppressWarnings("unchecked")
    private static <Value> void set(Field<Value> field, Object value) {
        field.set((Value) value);
    }

    public final Field<String> s(String name) {
        Field<String> field = new Field<>(name, Type.STRING);
        fields.add(field);
        return field;
    }

    public final NumberField<Double> d(String name) {
        NumberField<Double> field = new NumberField<>(name, Type.DOUBLE);
        fields.add(field);
        return field;
    }

    public final Field<Boolean> b(String name) {
        Field<Boolean> field = new Field<>(name, Type.BOOLEAN);
        fields.add(field);
        return field;
    }

    public final NumberField<Integer> i(String name) {
        NumberField<Integer> field = new NumberField<>(name, Type.INT);
        fields.add(field);
        return field;
    }

    public final <Value extends Enum<Value>> Field<Value> e(String name, Class<Value> enumClass) {
        Field<Value> field = new EnumField<>(name, enumClass);
        fields.add(field);
        return field;
    }

    public enum Type {
        STRING,
        DOUBLE,
        BOOLEAN,
        INT,
        ENUM
    }

    public static class Field<Value> {
        public final String id;
        public final String name;
        public final Type type;
        protected Value defaultValue;
        private boolean required = true;
        private transient Value value;
        private transient boolean set;

        Field(String name, Type type) {
            this.id = randomNanoId();
            this.name = name;
            this.type = type;
        }

        public Field<Value> withDefault(Value defaultValue) {
            if (defaultValue == null) {
                throw new IllegalArgumentException("Default value cannot be null.");
            }
            this.defaultValue = defaultValue;
            required = false;
            return this;
        }

        public Field<Value> required() {
            required = true;
            defaultValue = null;
            return this;
        }

        boolean isRequired() {
            return required;
        }

        public Value get() {
            if (!set) {
                throw new IllegalStateException("Field not set. Make sure to call awaitInputs() on the inputs before accessing.");
            }
            return value;
        }

        void validate(Value value) {
            if (value == null) throw new IllegalArgumentException("Value cannot be null.");
        }

        void set(Value value) {
            validate(value);
            this.set = true;
            this.value = value;
        }
    }

    public static class NumberField<Value extends Number & Comparable<Value>> extends Field<Value> {
        public Value min;
        public Value max;

        NumberField(String name, Type type) {
            super(name, type);
        }

        public NumberField<Value> min(Value min) {
            this.min = min;
            return this;
        }

        public NumberField<Value> max(Value max) {
            this.max = max;
            return this;
        }

        @Override
        public NumberField<Value> withDefault(Value defaultValue) {
            super.withDefault(defaultValue);
            return this;
        }

        @Override
        public NumberField<Value> required() {
            super.required();
            return this;
        }

        @Override
        void validate(Value value) {
            if (value != null && min != null && value.compareTo(min) < 0) {
                throw new IllegalArgumentException("Value for '" + name + "' cannot be less than " + min + ".");
            }
            if (value != null && max != null && value.compareTo(max) > 0) {
                throw new IllegalArgumentException("Value for '" + name + "' cannot be greater than " + max + ".");
            }
            super.validate(value);
        }
    }

    static class EnumField<Value extends Enum<Value>> extends Field<Value> {
        public final transient Class<Value> enumClass;
        public final List<Value> options;

        EnumField(String name, Class<Value> enumClass) {
            super(name, Type.ENUM);
            this.enumClass = enumClass;
            this.options = Collections.unmodifiableList(Arrays.asList(enumClass.getEnumConstants()));
        }
    }
}
