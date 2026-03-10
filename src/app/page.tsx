import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-col min-h-[100dvh]">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b border-border">
        <div className="flex items-center justify-center">
          <span className="font-bold font-mono text-xl tracking-tight text-primary">
            Retain
          </span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
            Dashboard
          </Link>
          <Link href="/knowledge" className="text-sm font-medium hover:text-primary transition-colors">
            Knowledge Base
          </Link>
          <Link href="/problems" className="text-sm font-medium hover:text-primary transition-colors">
            Problems
          </Link>
        </nav>
      </header>
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background flex flex-col items-center justify-center">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Master your University Courses
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                A knowledge base built for students. Retain concepts and master problems with spaced repetition and active recall.
              </p>
            </div>
            <div className="space-x-4">
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full px-8">
                  Get Started
                </Button>
              </Link>
              <Link href="/review">
                <Button size="lg" variant="outline" className="rounded-full px-8">
                  Start Review
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative blurs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[50%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>
    </main>
  );
}
