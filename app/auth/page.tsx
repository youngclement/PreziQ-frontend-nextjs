"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, usePathname } from "next/navigation";
import dynamic from 'next/dynamic';
import SignInForm from "./components/sign-in-form";
import SignUpForm from "./components/sign-up-form";

// Dynamic import for the 3D model component
const ThreeDModel = dynamic(() => import('@/components/3d/auth-model'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center">Loading 3D Model...</div>
});

export default function AuthPage() {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("login");
    const isFirstRender = useRef(true);
    const previousPathname = useRef(pathname);

    // Set the active tab based on the current path, but only on first render
    // or when pathname changes from external navigation
    useEffect(() => {
        if (isFirstRender.current || previousPathname.current !== pathname) {
            if (pathname === "/auth/sign-up") {
                setActiveTab("register");
            } else if (pathname === "/auth/sign-in") {
                setActiveTab("login");
            }
            isFirstRender.current = false;
            previousPathname.current = pathname;
        }
    }, [pathname]);

    // Update URL when tab changes using shallow routing to prevent full page rerender
    const handleTabChange = (value: string) => {
        setActiveTab(value);

        // Use replace instead of push to avoid adding to history stack
        // This prevents back button from cycling through tab changes
        if (value === "register" && pathname !== "/auth/sign-up") {
            // router.replace("/auth/sign-up", { scroll: false });
            previousPathname.current = "/auth/sign-up";
        } else if (value === "login" && pathname !== "/auth/sign-in") {
            // router.replace("/auth/sign-in", { scroll: false });
            previousPathname.current = "/auth/sign-in";
        }
    };

    return (
        <div className="fixed inset-0 overflow-hidden">
            {/* Main container with navbar offset */}
            <div
                className="absolute inset-0 top-16 bg-gradient-to-br from-background to-muted/50 bg-no-repeat bg-cover bg-center"
                style={{ backgroundImage: "url('/auth-bg-pattern.svg')" }}
            >
                {/* Main content */}
                <div className="h-full w-full flex flex-col md:flex-row">
                    {/* Left side - 3D Model */}
                    <div className="w-full md:w-1/2 h-1/2 md:h-full bg-gradient-to-br from-background/80 to-background/30 backdrop-blur-sm 
                        rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none border border-border/30 shadow-lg flex items-center justify-center p-4 md:p-6">
                        <div className="h-full max-h-[350px] md:max-h-[500px] w-full relative">
                            <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Loading 3D Model...</div>}>
                                <ThreeDModel />
                            </Suspense>
                            <div className="absolute bottom-8 left-0 right-0 text-center">
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">PreziQ</h1>
                                <p className="text-lg text-muted-foreground mt-2">Your presentation assistant</p>
                            </div>
                        </div>
                    </div>

                    {/* Right side - Auth forms */}
                    <div className="w-full md:w-1/2 h-1/2 md:h-full flex items-center justify-center p-4 md:p-8">
                        <Card className="w-full max-w-md bg-background/80 backdrop-blur-sm border-border/30">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold">Welcome to PreziQ</CardTitle>
                                <CardDescription>Sign in to your account or create a new one</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">

                                    <TabsList className="grid w-full grid-cols-2 mb-6">
                                        <TabsTrigger value="login">Sign In</TabsTrigger>
                                        <TabsTrigger value="register">Sign Up</TabsTrigger>
                                    </TabsList>

                                    {/* Use a fixed height container to prevent layout shifts */}
                                    <div className="min-h-[350px]">
                                        <TabsContent value="login" className="mt-0">
                                            <SignInForm isLoading={isLoading} setIsLoading={setIsLoading} />
                                        </TabsContent>

                                        <TabsContent value="register" className="mt-0">
                                            <SignUpForm isLoading={isLoading} setIsLoading={setIsLoading} />
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </CardContent>
                            <CardFooter className="flex flex-col space-y-4 pt-0">
                                <div className="relative w-full">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button variant="outline" type="button" disabled={isLoading}>
                                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        Google
                                    </Button>
                                    <Button variant="outline" type="button" disabled={isLoading}>
                                        <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                        </svg>
                                        GitHub
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}