"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

export default function LoginPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  const handleGoogleLogin = () => {
    setStep(2);
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically save user details
    router.push("/ask");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-8 left-8 text-2xl font-bold">memora.</div>
      <Card className="w-full max-w-md">
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome to Memora AI</CardTitle>
              <CardDescription>
                Your personal knowledge base.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleGoogleLogin} className="w-full" variant="outline">
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-72.2 72.2C322 108.9 287.6 96 248 96c-88.8 0-160.1 72.1-160.1 160.1s71.3 160.1 160.1 160.1c98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 26.9 3.9 41.4z"></path></svg>
                Login with Google
              </Button>
            </CardContent>
          </>
        )}
        {step === 2 && (
          <form onSubmit={handleDetailsSubmit}>
            <CardHeader>
              <CardTitle>Just a few more details</CardTitle>
              <CardDescription>
                This will be displayed on your profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="callName">Call Name</Label>
                <Input id="callName" placeholder="e.g. John" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Surname</Label>
                <Input id="surname" placeholder="e.g. Doe" required />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">Continue</Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
