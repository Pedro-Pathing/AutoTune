import type { DisplayDefinition } from "../../lib/schemas";
import FourWheelBot from "./fourWheelBot";
import Image from "./image";

export type Props = {
    definition: DisplayDefinition;
};

export default function Display({ definition }: Props) {
    switch (definition.type) {
        case "image":
            return <Image lightMode={definition.lightMode} darkMode={definition.darkMode} />;
        case "fourWheelBot":
            return (
                <FourWheelBot
                    key={definition.wheel}
                    wheel={definition.wheel}
                    reversed={definition.reversed}
                />
            );
    }
}
