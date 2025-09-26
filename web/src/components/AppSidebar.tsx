'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, User, Mail, LayoutDashboard, ChevronLeft, ChevronRight, Handshake, Album, GitCompare, GraduationCap, BookAIcon, Calendar, Brain } from 'lucide-react'

import { cn } from "@/lib/utils"
import { navLinks, ownerNavLinks } from '@/lib/constants'
import { useAuth } from "@/context/AuthContext"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar'
import LogoutButton from './Auth/Logout'

const iconMap: { [key: string]: React.ComponentType<any> } = {
    'Home': Home,
    'About': User,
    'Contact': Mail,
    'Dashboard': LayoutDashboard,
    'Schemes & Programs': Handshake,
    'Compare Property': GitCompare,
    'Guide': Album,
    'Courses': GraduationCap,
    'Study Material': BookAIcon,
    'Kanban': Calendar,
    'Doubts': Brain,
}

export function AppSidebar() {
    const pathname = usePathname()
    const { user } = useAuth()
    const { state, toggleSidebar } = useSidebar()
    const isOwner = false

    return (
        <Sidebar
            collapsible="icon"
            className="bg-[#2A52BE] text-white"
        >
            <SidebarHeader className="bg-[#2A52BE] text-white">
                <SidebarMenuButton size="lg" asChild>
                    <Link href="/">
                        <div className="flex flex-col items-center w-full gap-0.5 leading-none">
                            <span className="text-3xl font-semibold text-white">आचार्य</span>
                        </div>
                    </Link>
                </SidebarMenuButton>
            </SidebarHeader>

            <SidebarContent className="bg-[#2A52BE] text-white">
                <SidebarMenu className={cn(
                    "gap-2",
                    state === 'collapsed' ? '' : 'px-3'
                )}>
                    {(!isOwner ? navLinks : ownerNavLinks).map((item) => {
                        const Icon = iconMap[item.title] || Home;
                        return (
                            <SidebarMenuItem key={item.title} className="pt-2">
                                <SidebarMenuButton
                                    className={cn(
                                        'w-full mx-auto text-base text-white',
                                        '[&_svg]:!h-6 [&_svg]:!w-6'
                                    )}
                                    asChild
                                    isActive={pathname === item.url}
                                    tooltip={state === 'collapsed' ? item.title : undefined}
                                >
                                    <Link
                                        href={item.url}
                                        className="flex items-center gap-4 text-white hover:text-opacity-80"
                                    >
                                        <Icon className="shrink-0 text-white" />
                                        <span className="text-base">{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="bg-[#2A52BE] text-white">
                <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center space-x-2">
                        <div className="hidden group-data-[state=expanded]/sidebar:block">
                            <p className="text-base font-medium text-white">{user?.displayName}</p>
                            <p className="text-sm text-white text-opacity-70">{user?.email}</p>
                        </div>
                    </div>
                </div>
                <SidebarMenuButton
                    onClick={toggleSidebar}
                    className="w-full justify-between text-white hover:text-opacity-80"
                >
                    {state === 'expanded' ?
                        <ChevronLeft className="h-5 w-5 ml-auto" /> :
                        <ChevronRight className="h-5 w-5" />
                    }
                </SidebarMenuButton>
                {user && (
                    <LogoutButton className="text-white bg-red-600 hover:bg-red-700" />
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
