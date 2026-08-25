import { ArrowUpRight, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import logoDark from "../assets/autotune-stacked-black.svg";
import logoLight from "../assets/autotune-stacked-white.svg";
import Loading from "../components/screens/loading";
import { useTheme } from "../lib/theme";

type TunerMetadata = {
    id: string;
    name: string;
    description: string;
};

type State = "loading" | "error" | "success";

export default function Home() {
    const [theme, setTheme] = useTheme();
    const [tuners, setTuners] = useState<TunerMetadata[] | null>(null);
    const [state, setState] = useState<State>("loading");

    useEffect(() => {
        fetch("/api/tuners")
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json() as Promise<TunerMetadata[]>;
            })
            .then((data) => {
                setTuners(data);
                setState("success");
            })
            .catch((err) => {
                console.error(err);
                setState("error");
            });
    }, []);

    if (state === "loading") return <Loading />;
    if (state === "error")
        return (
            <div className="flex grow items-center justify-center text-center text-lg">
                Something went wrong.&nbsp;
                <a href="/" className="text-sky-500 hover:underline">
                    Reload.
                </a>
            </div>
        );

    return (
        <>
            <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="fixed top-4 left-4 z-50 rounded-full border border-mauve-400/25 bg-neutral-300/50 p-2 text-black opacity-60 transition-opacity duration-300 hover:opacity-100 dark:bg-neutral-950/50 dark:text-white"
            >
                {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>

            <div className="mx-auto mt-16 w-full max-w-xl">
                <img
                    src={logoLight}
                    alt="Autotune Logo"
                    draggable="false"
                    className="dark:hidden"
                />
                <img
                    src={logoDark}
                    alt="Autotune Logo"
                    draggable="false"
                    className="hidden dark:block"
                />
            </div>

            <main className="grid grid-cols-3 gap-8 p-16">
                {tuners?.map((tuner) => (
                    <Tuner key={tuner.id} tuner={tuner} />
                ))}
            </main>
        </>
    );
}

function Tuner({ tuner: { name, id, description } }: { tuner: TunerMetadata }) {
    return (
        <Link
            to={`/tuner/${id}`}
            className="group my-8 block min-w-0 rounded-4xl border border-mauve-400/25 bg-neutral-300/50 p-6 opacity-75 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-neutral-400/60 hover:opacity-100 hover:shadow-lg xl:my-0 xl:grow xl:basis-0 dark:bg-neutral-950/50 dark:hover:bg-neutral-950/80"
        >
            <div className="flex items-center gap-4">
                <span className="text-xl text-black dark:text-white/75">{name}</span>
                <ArrowUpRight className="size-10 rounded-full border-2 border-sky-500 p-1 text-black opacity-60 transition-opacity duration-300 group-hover:opacity-100 dark:text-white" />
            </div>
            <p className="mt-4 text-black/60 xl:overflow-hidden xl:text-nowrap dark:text-white/50">
                {description}
            </p>
        </Link>
    );
}
