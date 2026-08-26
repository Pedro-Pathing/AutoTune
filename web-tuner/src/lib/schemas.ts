import { z } from "zod";

const requestIdSchema = z.int().positive();
const fieldBase = {
    id: z.string(),
    name: z.string()
};

const fieldSchema = z.discriminatedUnion("type", [
    z.object({
        ...fieldBase,
        type: z.literal("STRING"),
        defaultValue: z.string().optional(),
        allowEmpty: z.boolean()
    }),
    z.object({
        ...fieldBase,
        type: z.literal("INT"),
        defaultValue: z.int().optional(),
        min: z.int().optional(),
        max: z.int().optional()
    }),
    z.object({
        ...fieldBase,
        type: z.literal("DOUBLE"),
        defaultValue: z.number().optional(),
        min: z.number().optional(),
        max: z.number().optional()
    }),
    z.object({
        ...fieldBase,
        type: z.literal("ENUM"),
        defaultValue: z.string().optional(),
        options: z.array(
            z.object({
                name: z.string(),
                displayName: z.string()
            })
        )
    }),
    z.object({
        ...fieldBase,
        type: z.literal("BOOLEAN"),
        defaultValue: z.boolean()
    })
]);

export const inputsPayloadSchema = z.object({
    name: z.string(),
    description: z.string(),
    fields: fieldSchema.array()
});

export type FieldDefinition = z.infer<typeof fieldSchema>;
export type InputsPayload = z.infer<typeof inputsPayloadSchema>;

export const serverMessageSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("confirm"),
        requestId: requestIdSchema,
        title: z.string(),
        message: z.string()
    }),
    z.object({
        type: z.literal("inputs"),
        requestId: requestIdSchema,
        inputs: inputsPayloadSchema
    }),
    z.object({
        type: z.literal("opModeRunning"),
        requestId: requestIdSchema,
        canStop: z.boolean(),
        name: z.string()
    }),
    z.object({
        type: z.literal("complete"),
        results: z.record(z.string(), z.string()),
        resultCode: z.record(z.string(), z.string())
    }),
    z.object({
        type: z.literal("error"),
        message: z.string()
    })
]);

export type ServerMessage = z.infer<typeof serverMessageSchema>;
