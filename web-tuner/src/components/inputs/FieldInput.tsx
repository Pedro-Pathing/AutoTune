import type { FieldDefinition } from "../../lib/schemas";
import BooleanInput from "./BooleanInput";
import DoubleInput from "./DoubleInput";
import EnumInput from "./EnumInput";
import IntegerInput from "./IntegerInput";
import StringInput from "./StringInput";

type Props = {
    field: FieldDefinition;
    onChange: (value: unknown) => void;
};

export default function FieldInput({ field, onChange }: Props) {
    switch (field.type) {
        case "STRING":
            return <StringInput field={field} onChange={onChange} />;
        case "INT":
            return <IntegerInput field={field} onChange={onChange} />;
        case "DOUBLE":
            return <DoubleInput field={field} onChange={onChange} />;
        case "ENUM":
            return <EnumInput field={field} onChange={onChange} />;
        case "BOOLEAN":
            return <BooleanInput field={field} onChange={onChange} />;
    }
}
