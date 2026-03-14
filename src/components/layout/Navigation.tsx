"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    BookOpen,
    Layers,
    Brain,
    Search as SearchIcon,
    Tags
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./Search";

const navItems = [
    { label: "Dashboard", icon: Home, href: "/dashboard" },
    { label: "Knowledge", icon: BookOpen, href: "/knowledge" },
    { label: "Problems", icon: Layers, href: "/problems" },
    { label: "Topics", icon: Tags, href: "/topics" },
    { label: "Review", icon: Brain, href: "/review" },
];

export function Navigation() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-border bg-background/80 backdrop-blur-lg md:relative md:top-0 md:h-full md:w-64 md:border-t-0 md:border-r">
            <div className="flex flex-row items-center justify-around h-16 md:flex-col md:h-full md:justify-start md:gap-4 md:p-6">
                <div className="hidden md:flex flex-col gap-6 mb-4 px-2 w-full">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg">
                            <Brain className="w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">Antigravity</span>
                    </Link>
                    <GlobalSearch />
                </div>

                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors md:flex-row md:gap-3 md:rounded-lg md:px-4 md:py-3 md:text-sm md:w-full",
                                isActive
                                    ? "text-primary md:bg-primary/10"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                            <span className="md:inline">{item.label}</span>
                            {isActive && (
                                <div className="md:hidden absolute bottom-2 w-1 h-1 rounded-full bg-primary" />
                            )}
                        </Link>
                    );
                })}

                {/* Mobile Search Trigger */}
                <div className="md:hidden">
                    <GlobalSearch />
                </div>
            </div>
        </nav>
    );
}
