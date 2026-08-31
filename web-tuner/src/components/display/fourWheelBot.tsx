// thanks so much to neset for making this interactive dozer diagram!
import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from "react";

import backSvg from "../../assets/four-wheel-bot/back.svg";
import bottomSvg from "../../assets/four-wheel-bot/bottom.svg";
import frontSvg from "../../assets/four-wheel-bot/front.svg";
import leftSvg from "../../assets/four-wheel-bot/left.svg";
import rightSvg from "../../assets/four-wheel-bot/right.svg";
import topSvg from "../../assets/four-wheel-bot/top.svg";
import treadArrowsSvg from "../../assets/four-wheel-bot/tread-arrows.svg";
import treadSvg from "../../assets/four-wheel-bot/tread.svg";
import wheelSvg from "../../assets/four-wheel-bot/wheel.svg";
import type { Wheel } from "../../lib/schemas";

export type Props = {
    wheel: Wheel;
    reversed: boolean;
};

type View = {
    yaw: number;
    pitch: number;
};

type DragPoint = {
    pointerId: number;
    x: number;
    y: number;
};

type FaceDefinition = {
    name: string;
    artwork: string;
    width: number;
    height: number;
    rotation: string;
    offset: number;
};

type WheelDefinition = {
    id: Wheel;
    x: 1 | -1;
    z: 1 | -1;
};

const SCALE = 4;
const SEGMENTS = 32;
const SPIN_SECONDS = 5;
const MODEL_FIT_WIDTH = 520;
const MODEL_FIT_HEIGHT = 420;
const MODEL_PADDING = 32;

const BODY_WIDTH = 100 * SCALE;
const BODY_LENGTH = 100 * SCALE;
const BODY_HEIGHT = 50 * SCALE;
const WHEEL_DIAMETER = 34 * SCALE;
const WHEEL_THICKNESS = 13 * SCALE;
const WHEEL_DROP = 8 * SCALE;
const WHEEL_INSET = 20 * SCALE;

const WHEEL_RADIUS = WHEEL_DIAMETER / 2;
const SEGMENT_WIDTH = 2 * WHEEL_RADIUS * Math.tan(Math.PI / SEGMENTS);
const TREAD_WIDTH = SEGMENT_WIDTH * SEGMENTS;
const WHEEL_FACE_DIAMETER = WHEEL_DIAMETER / Math.cos(Math.PI / SEGMENTS);
const SEGMENT_OVERLAP = 1.05;

const CENTERED_LAYER: CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 0,
    height: 0,
    transformStyle: "preserve-3d"
};

const PIVOT_LAYER: CSSProperties = {
    ...CENTERED_LAYER,
    left: 0,
    top: 0
};

const ARTWORK: CSSProperties = {
    display: "block",
    maxWidth: "none",
    pointerEvents: "none"
};

const FACES: readonly FaceDefinition[] = [
    {
        name: "front",
        artwork: frontSvg,
        width: BODY_WIDTH,
        height: BODY_HEIGHT,
        rotation: "",
        offset: BODY_LENGTH / 2
    },
    {
        name: "back",
        artwork: backSvg,
        width: BODY_WIDTH,
        height: BODY_HEIGHT,
        rotation: "rotateY(180deg)",
        offset: BODY_LENGTH / 2
    },
    {
        name: "right",
        artwork: rightSvg,
        width: BODY_LENGTH,
        height: BODY_HEIGHT,
        rotation: "rotateY(-90deg)",
        offset: BODY_WIDTH / 2
    },
    {
        name: "left",
        artwork: leftSvg,
        width: BODY_LENGTH,
        height: BODY_HEIGHT,
        rotation: "rotateY(90deg)",
        offset: BODY_WIDTH / 2
    },
    {
        name: "top",
        artwork: topSvg,
        width: BODY_WIDTH,
        height: BODY_LENGTH,
        rotation: "rotateX(90deg) rotateZ(180deg)",
        offset: BODY_HEIGHT / 2
    },
    {
        name: "bottom",
        artwork: bottomSvg,
        width: BODY_WIDTH,
        height: BODY_LENGTH,
        rotation: "rotateX(-90deg)",
        offset: BODY_HEIGHT / 2
    }
];

const WHEELS: readonly WheelDefinition[] = [
    { id: "FRONT_LEFT", x: 1, z: 1 },
    { id: "FRONT_RIGHT", x: -1, z: 1 },
    { id: "BACK_LEFT", x: 1, z: -1 },
    { id: "BACK_RIGHT", x: -1, z: -1 }
];

function clamp(value: number, minimum: number, maximum: number) {
    return Math.max(minimum, Math.min(maximum, value));
}

function Artwork({ src, style }: { src: string; style: CSSProperties }) {
    return <img src={src} alt="" draggable={false} style={{ ...ARTWORK, ...style }} />;
}

function RobotWheel({
    definition,
    active,
    forward
}: {
    definition: WheelDefinition;
    active: boolean;
    forward: boolean;
}) {
    const x = definition.x * (BODY_WIDTH / 2 + WHEEL_THICKNESS / 2);
    const z = definition.z * (BODY_LENGTH / 2 - WHEEL_INSET);

    return (
        <div
            style={{
                ...PIVOT_LAYER,
                transform: `translate3d(${x}px, ${BODY_HEIGHT / 2 + WHEEL_DROP}px, ${z}px) rotateY(${definition.x > 0 ? 90 : -90}deg)`
            }}
        >
            <div style={{ ...PIVOT_LAYER, transform: "rotateX(90deg)" }}>
                <div
                    className="four-wheel-bot__wheel"
                    style={{
                        ...PIVOT_LAYER,
                        animationName: active ? "four-wheel-bot-roll" : "none",
                        animationDuration: `${SPIN_SECONDS}s`,
                        animationTimingFunction: "linear",
                        animationIterationCount: "infinite",
                        animationDirection: forward ? "normal" : "reverse"
                    }}
                >
                    {Array.from({ length: SEGMENTS }, (_, index) => (
                        <div
                            key={index}
                            style={{
                                position: "absolute",
                                left: -SEGMENT_WIDTH / 2,
                                top: (-WHEEL_THICKNESS * SEGMENT_OVERLAP) / 2,
                                width: SEGMENT_WIDTH,
                                height: WHEEL_THICKNESS * SEGMENT_OVERLAP,
                                overflow: "hidden",
                                backfaceVisibility: "visible",
                                transform: `rotateY(${(index * 360) / SEGMENTS}deg) translateZ(${WHEEL_RADIUS}px) scaleX(${SEGMENT_OVERLAP})`
                            }}
                        >
                            <Artwork
                                src={active ? treadArrowsSvg : treadSvg}
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: -index * SEGMENT_WIDTH,
                                    width: TREAD_WIDTH,
                                    height: "100%",
                                    transform: active && !forward ? "scaleX(-1)" : "none"
                                }}
                            />
                        </div>
                    ))}

                    {([1, -1] as const).map((side) => (
                        <div
                            key={side}
                            style={{
                                position: "absolute",
                                left: -WHEEL_FACE_DIAMETER / 2,
                                top: -WHEEL_FACE_DIAMETER / 2,
                                width: WHEEL_FACE_DIAMETER,
                                height: WHEEL_FACE_DIAMETER,
                                backfaceVisibility: "visible",
                                transform: `rotateX(${90 * side}deg) translateZ(${WHEEL_THICKNESS / 2}px)`
                            }}
                        >
                            <Artwork src={wheelSvg} style={{ width: "100%", height: "100%" }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function FourWheelBot({ wheel, reversed }: Props) {
    const [view, setView] = useState<View>({
        yaw: wheel === "FRONT_RIGHT" || wheel === "BACK_RIGHT" ? 34 : -34,
        pitch: 19
    });
    const [dragging, setDragging] = useState(false);
    const [fitScale, setFitScale] = useState(1);
    const viewport = useRef<HTMLDivElement | null>(null);
    const dragPoint = useRef<DragPoint | null>(null);
    const direction = reversed ? -1 : 1;

    useEffect(() => {
        const element = viewport.current;
        if (!element) return;

        const observer = new ResizeObserver(([entry]) => {
            if (!entry) return;

            const availableWidth = Math.max(0, entry.contentRect.width - MODEL_PADDING);
            const availableHeight = Math.max(0, entry.contentRect.height - MODEL_PADDING);
            setFitScale(
                clamp(
                    Math.min(availableWidth / MODEL_FIT_WIDTH, availableHeight / MODEL_FIT_HEIGHT),
                    0.35,
                    1
                )
            );
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (!event.isPrimary || event.button !== 0) return;

        dragPoint.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY
        };
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (dragPoint.current?.pointerId !== event.pointerId) return;

        const deltaX = event.clientX - dragPoint.current.x;
        const deltaY = event.clientY - dragPoint.current.y;
        dragPoint.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY
        };

        setView((current) => ({
            ...current,
            yaw: current.yaw + deltaX * 0.4,
            pitch: clamp(current.pitch + deltaY * 0.4, -89, 89)
        }));
    };

    const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
        if (dragPoint.current?.pointerId !== event.pointerId) return;

        dragPoint.current = null;
        setDragging(false);

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const handleLostPointerCapture = (event: PointerEvent<HTMLDivElement>) => {
        if (dragPoint.current?.pointerId !== event.pointerId) return;

        dragPoint.current = null;
        setDragging(false);
    };

    return (
        <div
            className="bg-body/5 relative h-full min-h-0 w-full overflow-hidden select-none"
            role="img"
        >
            <div
                ref={viewport}
                className="absolute inset-0 touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onLostPointerCapture={handleLostPointerCapture}
                style={{
                    perspective: 2400,
                    cursor: dragging ? "grabbing" : "grab"
                }}
            >
                <div
                    style={{
                        ...CENTERED_LAYER,
                        transform: `translateZ(-900px) scale(${fitScale}) rotateX(${-view.pitch}deg) rotateY(${view.yaw}deg)`
                    }}
                >
                    {FACES.map((face) => (
                        <Artwork
                            key={face.name}
                            src={face.artwork}
                            style={{
                                position: "absolute",
                                left: -face.width / 2,
                                top: -face.height / 2,
                                width: face.width,
                                height: face.height,
                                backfaceVisibility: "hidden",
                                transform: `${face.rotation} translateZ(${face.offset}px)`
                            }}
                        />
                    ))}

                    {WHEELS.map((definition) => (
                        <RobotWheel
                            key={definition.id}
                            definition={definition}
                            active={definition.id === wheel}
                            forward={direction * -definition.x > 0}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
