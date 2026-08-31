export type Props = {
    lightMode: string;
    darkMode: string;
};

export default function Image({ lightMode, darkMode }: Props) {
    return (
        <div className="bg-body/5 flex min-h-0 items-center justify-center p-10">
            <img
                src={`/images/${lightMode}`}
                alt=""
                draggable={false}
                className="max-h-full max-w-full object-contain dark:hidden"
            />
            <img
                src={`/images/${darkMode}`}
                alt=""
                draggable={false}
                className="hidden max-h-full max-w-full object-contain dark:inline"
            />
        </div>
    );
}
