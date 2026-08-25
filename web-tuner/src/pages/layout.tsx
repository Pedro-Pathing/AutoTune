import clsx from "clsx";
import { Monitor } from "lucide-react";
import { Outlet } from "react-router";

import { useTheme } from "../lib/theme";

export default function Layout() {
    const [theme] = useTheme();
    return (
        <div
            className={clsx(
                "flex min-h-screen flex-col bg-base relative bg-(image:--gradient-base) bg-fixed bg-no-repeat text-body",
                theme === "dark" && "dark"
            )}
        >
            <main className="flex grow items-center justify-center p-6 text-center md:hidden">
                <div className="border-border bg-base/70 flex w-full max-w-md flex-col items-center gap-5 rounded-3xl border p-8 shadow-sm">
                    <Monitor aria-hidden="true" className="text-primary/60 size-12" />
                    <h1 className="text-heading text-3xl font-bold">Computer required</h1>
                    <p className="max-w-[36ch]">
                        This app is designed for a larger screen. Please open it on a desktop or
                        laptop computer to continue.
                    </p>
                </div>
            </main>

            <div className="hidden min-h-screen flex-col md:flex">
                <Outlet />
            </div>
        </div>
    );
}
