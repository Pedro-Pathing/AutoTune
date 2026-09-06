import Java from "@devicon/react/java/plain";
import Kotlin from "@devicon/react/kotlin/plain";
import clsx from "clsx";
import copy from "copy-to-clipboard";
import { ArrowRight, Braces, Check, Copy, Table2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { codeToHtml } from "shiki";

type Props = {
    results: Record<string, string>;
    resultCode: Record<string, string>;
};

const VALUES: unique symbol = Symbol();

type Tab = typeof VALUES | string;

export default function Complete({ results, resultCode }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>(VALUES);
    const tabs: Tab[] = useMemo(() => [VALUES, ...Object.keys(resultCode)], [resultCode]);
    const tabIndex = useMemo(() => tabs.indexOf(activeTab), [tabs, activeTab]);
    const activeTabOffset = useMemo(() => tabIndex * 100, [tabIndex]);

    return (
        <main className="min-h-0 grow py-10">
            <div className="mx-auto flex h-full w-full max-w-xl flex-col">
                <h2 className="text-heading text-center text-5xl font-bold">Complete</h2>

                <div className="border-border bg-base/70 my-10 flex min-h-0 grow flex-col overflow-hidden rounded-3xl border shadow-sm">
                    <div className="border-border relative flex shrink-0 border-b">
                        {tabs.map((tab) => (
                            <TabButton
                                key={tab === VALUES ? 0 : tab}
                                tab={tab}
                                isActive={activeTab === tab}
                                onClick={() => setActiveTab(tab)}
                            />
                        ))}
                        <span
                            className="bg-primary absolute bottom-0 left-0 h-0.5 transition-transform duration-300 ease-out"
                            style={{
                                transform: `translateX(${activeTabOffset}%)`,
                                width: `${100 / tabs.length}%`
                            }}
                        />
                    </div>

                    <div className="min-h-0 grow">
                        {activeTab === VALUES ? (
                            Object.keys(results).length > 1 ? (
                                <div className="scrollbar-minimal h-full overflow-auto">
                                    <table className="w-full border-collapse text-left">
                                        <tbody>
                                            {Object.entries(results).map(([key, value]) => (
                                                <tr
                                                    key={key}
                                                    className="border-border border-b last:border-b-0"
                                                >
                                                    <th className="text-body px-6 py-5 text-sm font-medium">
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
                                    This tuner did not produce any values.
                                </p>
                            )
                        ) : (
                            <CodeBlock key={activeTab} code={resultCode[activeTab]} tab={activeTab} />
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
    tab,
    isActive,
    onClick
}: {
    tab: Tab;
    isActive: boolean;
    onClick: () => void;
}) {
    let displayName: string;
    switch (tab) {
        case VALUES:
            displayName = "Values";
            break;
        case "JAVA":
            displayName = "Java";
            break;
        case "KOTLIN":
            displayName = "Kotlin";
            break;
        case "JSON":
            displayName = "JSON";
            break;
        default:
            displayName = tab;
            break;
    }

    return (
        <button
            className={clsx(
                "text-body hover:text-heading focus-visible:ring-primary flex flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:outline-none",
                isActive && "text-heading"
            )}
            type="button"
            onClick={onClick}
        >
            {tab === VALUES && <Table2 className="size-4" />}
            {tab === "JAVA" && <Java size={16} color="currentColor" />}
            {tab === "KOTLIN" && <Kotlin size={16} color="currentColor" />}
            {tab === "JSON" && <Braces className="size-4" />}

            {displayName}
        </button>
    );
}

type CopyStatus = "idle" | "copied" | "failed";

function CodeBlock({ code, tab }: { code: string; tab: string }) {
    const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
    const [formattedCode, setFormattedCode] = useState("");

    useEffect(() => {
        if (!["JAVA", "KOTLIN", "JSON"].includes(tab)) {
            setFormattedCode(`<pre class="text-body shiki"><code>${code}</code></pre>`);
            return;
        }

        async function format() {
            setFormattedCode(
                await codeToHtml(code, {
                    lang: tab.toLowerCase(),
                    themes: {
                        dark: "github-dark-default",
                        light: "github-light-default"
                    }
                })
            );
        }

        void format();
    }, [code, tab]);

    useEffect(() => {
        if (copyStatus === "idle") return;

        const timeout = window.setTimeout(() => setCopyStatus("idle"), 2000);
        return () => window.clearTimeout(timeout);
    }, [copyStatus]);

    async function copyCode() {
            const success = await copy(code).catch(() => false);
            setCopyStatus(success ? "copied" : "failed");
    }

    return (
        <div className="relative h-full min-h-0 min-w-0">
            <button
                className="border-border bg-base/90 text-body hover:bg-base hover:text-heading focus-visible:ring-primary absolute top-3 right-3 z-10 flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                type="button"
                onClick={() => void copyCode()}
            >
                {copyStatus === "copied" ? (
                    <Check className="text-primary size-3.5" />
                ) : (
                    <Copy className="size-3.5" />
                )}
                <span aria-live="polite">
                    {copyStatus === "copied"
                        ? "Copied"
                        : copyStatus === "failed"
                          ? "Copy failed"
                          : "Copy"}
                </span>
            </button>

            <div
                className="scrollbar-minimal h-full min-h-0 min-w-0 overflow-auto"
                dangerouslySetInnerHTML={{ __html: formattedCode }}
            />
        </div>
    );
}
