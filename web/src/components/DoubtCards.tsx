"use client";

import DisplayCards from "@/components/ui/display-cards";
import { ImageIcon, PenLine, UserRound } from "lucide-react";

const defaultCards = [
    {
        icon: <ImageIcon className="size-4 text-blue-300" />,
        title: "Analyze Image",
        description: "Smart image analysis & insights",
        date: "Instant Results",
        iconClassName: "text-blue-500",
        titleClassName: "text-blue-500",
        className:
            "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
        link: "/doubts/analyze-image"
    },
    {
        icon: <PenLine className="size-4 text-blue-300" />,
        title: "Whiteboard",
        description: "Interactive problem solving",
        date: "Real-time",
        iconClassName: "text-blue-500",
        titleClassName: "text-blue-500",
        className:
            "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
        link: "/doubts/analyze-whiteboard"
    },
    {
        icon: <UserRound className="size-4 text-blue-300" />,
        title: "Avatar Doubt-solving",
        description: "Personal AI assistance",
        date: "24/7 Available",
        iconClassName: "text-blue-500",
        titleClassName: "text-blue-500",
        className:
            "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10",
        link: "/doubts/avatar"
    },
];

function DisplayCardsDemo() {
    return (
        <div className="flex min-h-[400px] w-full items-center justify-center py-20">
            <div className="w-full max-w-4xl">
                <DisplayCards cards={defaultCards} />
            </div>
        </div>
    );
}

export default DisplayCardsDemo;