"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Marquee.module.css";

interface MarqueeProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export default function Marquee({ children, className = "", style }: MarqueeProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [needsMarquee, setNeedsMarquee] = useState(false);

    useEffect(() => {
        const checkIfNeedsMarquee = () => {
            if (wrapperRef.current && contentRef.current) {
                const wrapperWidth = wrapperRef.current.offsetWidth;
                const contentWidth = contentRef.current.scrollWidth;
                setNeedsMarquee(contentWidth > wrapperWidth);
            }
        };

        // Проверяем при загрузке
        checkIfNeedsMarquee();

        // Проверяем при изменении размера окна
        window.addEventListener("resize", checkIfNeedsMarquee);
        return () => window.removeEventListener("resize", checkIfNeedsMarquee);
    }, [children]);

    return (
        <div
            ref={wrapperRef}
            className={`${styles.marqueeWrapper} ${className}`}
            style={style}
        >
            <div
                ref={contentRef}
                className={`${styles.marqueeContent} ${needsMarquee ? styles.scrolling : ""}`}
            >
                {children}
            </div>
        </div>
    );
}
