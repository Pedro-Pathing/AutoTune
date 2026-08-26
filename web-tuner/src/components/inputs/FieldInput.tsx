import type { FieldDefinition } from "../../lib/schemas";
import BooleanInput from "./BooleanInput";
import DoubleInput from "./DoubleInput";
import EnumInput from "./EnumInput";
import IntegerInput from "./IntegerInput";
import StringInput from "./StringInput";

type Props = {
    field: FieldDefinition;
};

export default function FieldInput({ field }: Props) {
    switch (field.type) {
        case "STRING":
            return <StringInput field={field} />;
        case "INT":
            return <IntegerInput field={field} />;
        case "DOUBLE":
            return <DoubleInput field={field} />;
        case "ENUM":
            return <EnumInput field={field} />;
        case "BOOLEAN":
            return <BooleanInput field={field} />;
    }
}
