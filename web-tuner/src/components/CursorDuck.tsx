// thanks so much to chatgpt for making this duck
import { useEffect, useRef } from "react";

const DUCK_SIZE = 60;
const CURSOR_OFFSET_Y = 38;

export default function CursorDuck() {
    const duckRef = useRef<HTMLDivElement>(null);
    const directionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const duck = duckRef.current;
        const direction = directionRef.current;
        const finePointer = window.matchMedia("(pointer: fine)");
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

        if (!duck || !direction || !finePointer.matches) return;

        let currentX = 0;
        let currentY = 0;
        let targetX = 0;
        let targetY = 0;
        let previousTime = performance.now();
        let animationFrame: number | null = null;
        let isVisible = false;
        let isWaddling = false;

        const placeDuck = () => {
            duck.style.transform = `translate3d(${currentX - DUCK_SIZE / 2}px, ${currentY - DUCK_SIZE / 2}px, 0)`;
        };

        const animate = (time: number) => {
            const elapsed = Math.min((time - previousTime) / 1000, 0.064);
            const followAmount = 1 - Math.exp(-9 * elapsed);
            const deltaX = targetX - currentX;
            const deltaY = targetY - currentY;

            currentX += deltaX * followAmount;
            currentY += deltaY * followAmount;
            previousTime = time;
            placeDuck();

            if (Math.abs(deltaX) > 0.5) {
                direction.style.transform = `scaleX(${deltaX < 0 ? -1 : 1})`;
            }

            const stillMoving = Math.hypot(deltaX, deltaY) > 0.75;
            if (stillMoving !== isWaddling) {
                isWaddling = stillMoving;
                duck.classList.toggle("cursor-duck--waddling", isWaddling);
            }

            if (stillMoving) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                currentX = targetX;
                currentY = targetY;
                placeDuck();
                animationFrame = null;
            }
        };

        const followPointer = (event: PointerEvent) => {
            targetX = Math.min(
                Math.max(event.clientX, DUCK_SIZE / 2),
                window.innerWidth - DUCK_SIZE / 2
            );
            targetY = Math.min(
                Math.max(event.clientY + CURSOR_OFFSET_Y, DUCK_SIZE / 2),
                window.innerHeight - DUCK_SIZE / 2
            );

            if (!isVisible) {
                currentX = targetX;
                currentY = targetY;
                placeDuck();
                duck.classList.add("cursor-duck--visible");
                isVisible = true;
            }

            if (event.movementX !== 0) {
                direction.style.transform = `scaleX(${event.movementX < 0 ? -1 : 1})`;
            }

            if (reducedMotion.matches) {
                currentX = targetX;
                currentY = targetY;
                placeDuck();
                return;
            }

            if (animationFrame === null) {
                previousTime = performance.now();
                animationFrame = requestAnimationFrame(animate);
            }
        };

        const hideDuck = () => {
            duck.classList.remove("cursor-duck--visible");
            isVisible = false;
        };

        window.addEventListener("pointermove", followPointer, { passive: true });
        document.documentElement.addEventListener("pointerleave", hideDuck);

        return () => {
            window.removeEventListener("pointermove", followPointer);
            document.documentElement.removeEventListener("pointerleave", hideDuck);
            if (animationFrame !== null) cancelAnimationFrame(animationFrame);
        };
    }, []);

    return (
        <div ref={duckRef} className="cursor-duck" aria-hidden="true">
            <div ref={directionRef} className="cursor-duck__direction">
                <img src="/favicon.svg" alt="" draggable="false" className="cursor-duck__image" />
            </div>
        </div>
    );
}
