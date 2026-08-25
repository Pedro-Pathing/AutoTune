import { LoaderCircle } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex grow items-center justify-center">
            <LoaderCircle className="text-heading size-12 animate-spin" />
        </div>
    );
}
