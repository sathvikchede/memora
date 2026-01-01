"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function SpaceClient() {
    const [spaceName, setSpaceName] = useState("");
    const [spaceDescription, setSpaceDescription] = useState("");
    const [inviteLink, setInviteLink] = useState("");

    const handleCreateSpace = (e: React.FormEvent) => {
        e.preventDefault();
        if (spaceName.trim() && spaceDescription.trim()) {
            const generatedLink = `https://memora.ai/join/${Math.random().toString(36).substring(2, 10)}`;
            setInviteLink(generatedLink);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        // Add toast notification here if desired
    };

    return (
        <div className="container mx-auto max-w-2xl py-8">
            <div className="space-y-8">
                <Card>
                    <form onSubmit={handleCreateSpace}>
                        <CardHeader>
                            <CardTitle>Create a new Space</CardTitle>
                            <CardDescription>Spaces are isolated rooms of information for your organization.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="spaceName">Space Name</Label>
                                <Input id="spaceName" value={spaceName} onChange={(e) => setSpaceName(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="spaceDescription">Description</Label>
                                <Textarea id="spaceDescription" value={spaceDescription} onChange={(e) => setSpaceDescription(e.target.value)} required />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit">Create Space</Button>
                        </CardFooter>
                    </form>
                </Card>

                {inviteLink && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Invite to {spaceName}</CardTitle>
                            <CardDescription>Share this link to invite others to your space.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                            <Input value={inviteLink} readOnly />
                            <Button onClick={handleCopyLink}>Copy</Button>
                        </CardContent>
                    </Card>
                )}

                 <Separator />

                <div>
                    <h3 className="text-lg font-medium">Your Spaces</h3>
                    <div className="mt-4 rounded-md border p-4 text-center text-muted-foreground">
                        You are not part of any other spaces yet.
                    </div>
                </div>
            </div>
        </div>
    );
}
