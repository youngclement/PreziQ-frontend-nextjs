'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useRoles } from '@/hooks/use-roles';
import RoleGuard from '@/components/auth/role-guard';
import { Shield, ShieldAlert, Users, FileText } from 'lucide-react';

export default function AdminDashboardPage() {
    return (
        <RoleGuard allowedRoles={['ADMIN']} fallbackPath="/">
            <div className="container py-10">
                <div className="flex flex-col space-y-6">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>

                    <AdminDashboardContent />
                </div>
            </div>
        </RoleGuard>
    );
}

function AdminDashboardContent() {
    const { user } = useAuth();
    const { userRoles } = useRoles();

    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-2">
                <h2 className="text-xl font-semibold">Welcome, {user?.firstName} {user?.lastName}</h2>
                <p className="text-muted-foreground">
                    You have {userRoles.length} role(s): {userRoles.map(role => role.name).join(', ')}
                </p>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="roles">Roles</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="pt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <StatsCard
                            title="Total Users"
                            value="1,247"
                            description="↗ 12% from last month"
                            icon={<Users className="h-5 w-5" />}
                        />
                        <StatsCard
                            title="Active Roles"
                            value="4"
                            description="Admin, Editor, User, Guest"
                            icon={<Shield className="h-5 w-5" />}
                        />
                        <StatsCard
                            title="Permissions"
                            value="16"
                            description="Access control settings"
                            icon={<ShieldAlert className="h-5 w-5" />}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="users" className="pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>View and manage system users</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>User management interface would go here.</p>
                        </CardContent>
                        <CardFooter>
                            <Button>Add New User</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="roles" className="pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Management</CardTitle>
                            <CardDescription>Configure role-based access control</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Role management interface would go here.</p>
                        </CardContent>
                        <CardFooter>
                            <Button>Add New Role</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

interface StatsCardProps {
    title: string;
    value: string;
    description: string;
    icon: React.ReactNode;
}

function StatsCard({ title, value, description, icon }: StatsCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
} 