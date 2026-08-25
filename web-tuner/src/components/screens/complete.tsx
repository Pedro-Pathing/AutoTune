import Java from "@devicon/react/java/plain";
import Kotlin from "@devicon/react/kotlin/plain";
import clsx from "clsx";
import { ArrowRight, Table2 } from "lucide-react";
import { useState, type ReactElement } from "react";
import { Link } from "react-router";

type Tab = "Values" | "Java" | "Kotlin";

type Props = {
    results: Record<string, string>;
};

export default function Complete({ results }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>("Values");
    const activeTabOffset = activeTab === "Java" ? 100 : activeTab === "Kotlin" ? 200 : 0;

    return (
        <main className="min-h-0 grow py-10">
            <div className="mx-auto flex h-full w-full max-w-xl flex-col">
                <h2 className="text-heading text-center text-5xl font-bold">Complete</h2>

                <div className="border-border bg-base/70 my-10 flex min-h-0 grow flex-col overflow-hidden rounded-3xl border shadow-sm">
                    <div className="border-border relative flex shrink-0 border-b" role="tablist">
                        <TabButton
                            label="Values"
                            icon={<Table2 className="size-4" />}
                            isActive={activeTab === "Values"}
                            onClick={() => setActiveTab("Values")}
                        />
                        <TabButton
                            label="Java"
                            icon={<Java size={16} color="currentColor" />}
                            isActive={activeTab === "Java"}
                            onClick={() => setActiveTab("Java")}
                        />
                        <TabButton
                            label="Kotlin"
                            icon={<Kotlin size={16} color="currentColor" />}
                            isActive={activeTab === "Kotlin"}
                            onClick={() => setActiveTab("Kotlin")}
                        />
                        <span
                            aria-hidden="true"
                            className="bg-primary absolute bottom-0 left-0 h-0.5 w-1/3 transition-transform duration-300 ease-out"
                            style={{
                                transform: `translateX(${activeTabOffset}%)`
                            }}
                        />
                    </div>

                    <div className="min-h-0 grow" role="tabpanel" aria-label={activeTab}>
                        {activeTab === "Values" ? (
                            <div className="scrollbar-minimal h-full overflow-auto">
                                <table className="w-full border-collapse text-left">
                                    <caption className="sr-only">Tuned Values</caption>
                                    <tbody>
                                        {Object.entries(results).map(([key, value]) => (
                                            <tr
                                                key={key}
                                                className="border-border border-b last:border-b-0"
                                            >
                                                <th
                                                    className="text-body px-6 py-5 text-sm font-medium"
                                                    scope="row"
                                                >
                                                    {key}
                                                </th>
                                                <td className="text-heading px-6 py-5 text-right font-mono text-lg font-semibold tabular-nums">
                                                    {value}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-body grid h-full place-items-center p-8 text-center">
                                {activeTab} content will be available here soon.
                            </p>
                        )}
                    </div>
                </div>

                <Link
                    to="/"
                    className="bg-primary text-accent-foreground focus-visible:ring-primary focus-visible:ring-offset-base flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-3 font-semibold transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-offset-2"
                    type="button"
                >
                    Choose another tuner
                    <ArrowRight className="size-6" />
                </Link>
            </div>
        </main>
    );
}

function TabButton({
    label,
    icon,
    isActive,
    onClick
}: {
    label: string;
    icon: ReactElement;
    isActive: boolean;
    onClick: () => void;
}) {
    return (
        <button
            className={clsx(
                "text-body hover:text-heading focus-visible:ring-primary flex flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none",
                isActive && "text-heading"
            )}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={onClick}
        >
            {icon}
            {label}
        </button>
    );
}
