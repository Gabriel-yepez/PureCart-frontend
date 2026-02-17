import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Github, Twitter } from "lucide-react";

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Or{" "}
                        <Link href="/signup" className="font-medium text-black hover:text-gray-800 dark:text-white dark:hover:text-gray-300 transition-colors">
                            create a new account
                        </Link>
                    </p>
                </div>

                <Card className="border-gray-200 dark:border-gray-800 shadow-xl bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl text-center">Login</CardTitle>
                        <CardDescription className="text-center">
                            Enter your email below to login to your account
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid grid-cols-2 gap-6">
                            <Button variant="outline" className="w-full">
                                <Github className="mr-2 h-4 w-4" />
                                Github
                            </Button>
                            <Button variant="outline" className="w-full">
                                <Twitter className="mr-2 h-4 w-4" />
                                Twitter
                            </Button>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-300 dark:border-gray-700" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-black px-2 text-gray-500">
                                    Or continue with
                                </span>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                            <Input id="email" type="email" placeholder="m@example.com" />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Password</label>
                            <Input id="password" type="password" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black transition-colors">
                            Sign In
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
