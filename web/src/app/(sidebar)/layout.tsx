"use client"

import { AppSidebar } from "@/components/AppSidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import type React from "react"

interface SidebarLayoutProps {
    children: React.ReactNode
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full">
                <AppSidebar />
                <SidebarInset className="flex-1 overflow-auto w-full">
                    <main className="w-full min-h-screen">{children}</main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    )
}

export default SidebarLayout

