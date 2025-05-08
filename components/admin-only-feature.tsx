'use client';

import { AdminGuard } from '@/components/auth/admin-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

/**
 * Example component that shows how to protect individual UI elements or features
 * that should only be available to admin users
 */
export function AdminOnlyFeature() {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span>Admin Feature</span>
                </CardTitle>
                <CardDescription>
                    This component demonstrates how to protect specific features for admin users only
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Publicly visible content */}
                <div className="mb-4">
                    <p>This part of the UI is visible to all users.</p>
                </div>

                {/* Admin-only action buttons */}
                <AdminGuard
                    fallback={
                        <div className="flex flex-col items-center p-4 border border-dashed rounded-md bg-muted/50">
                            <Lock className="h-8 w-8 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground text-center">
                                Admin-only features are not available with your current permissions.
                            </p>
                        </div>
                    }
                >
                    <div className="space-y-2">
                        <h4 className="font-medium">Admin Controls</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                            These controls are only visible to users with the Admin role.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Button>Manage Users</Button>
                            <Button variant="outline">View Audit Logs</Button>
                            <Button variant="destructive">Delete Records</Button>
                        </div>
                    </div>
                </AdminGuard>
            </CardContent>
        </Card>
    );
} 