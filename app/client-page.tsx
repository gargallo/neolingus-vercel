"use client";

import { Button } from "@/components/ui/button";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import Link from "next/link";
import { 
  Construction,
  Languages,
  Moon,
  Sun
} from "lucide-react";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }}
      className="border-border bg-background hover:bg-accent"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

function HomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Languages className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                NEOLINGUS
              </span>
            </div>
            <div className="flex gap-3 items-center">
              <ThemeToggle />
              <Button variant="outline" asChild size="sm">
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Minimal & Mysterious */}
      <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Construction Badge - Subtle */}
          <div className="mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-orange-100 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-500/30 text-orange-800 dark:text-orange-300/80 rounded-full text-sm font-medium backdrop-blur-sm">
              <Construction className="h-4 w-4 mr-2 animate-pulse" />
              Under Construction
            </div>
          </div>
          
          {/* Main Title - Massive & Stunning */}
          <div className="mb-16">
            <h1 className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 mb-8 tracking-tight">
              NEOLINGUS
            </h1>
            
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-purple-500 dark:via-purple-400 to-transparent mx-auto mb-8"></div>
            
            <h2 className="text-2xl sm:text-3xl font-light text-muted-foreground tracking-wide">
              Something extraordinary is coming
            </h2>
          </div>

          {/* Mysterious Hint */}
          <div className="mb-16 space-y-6">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>
            
            <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              The future of language certification is being crafted. 
              <br />
              <span className="text-foreground/80">Be ready.</span>
            </p>
          </div>

          {/* CTA - Clean & Minimal */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" asChild className="text-lg px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 border-0 text-white">
              <Link href="/sign-up">
                Join Waitlist
              </Link>
            </Button>
            <Button variant="ghost" size="lg" asChild className="text-lg px-8 py-4 text-muted-foreground hover:text-foreground transition-all duration-300">
              <Link href="/sign-in">
                Sign In
              </Link>
            </Button>
          </div>
        </div>

        {/* Floating Elements - Subtle Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>
      </div>

      {/* Footer - Minimal */}
      <footer className="border-t border-border bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-center items-center">
            <p className="text-muted-foreground text-xs">
              © 2024 NEOLINGUS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ClientHomePage() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="neolingus-theme">
      <HomePage />
    </ThemeProvider>
  );
}