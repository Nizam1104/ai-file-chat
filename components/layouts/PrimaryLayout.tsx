"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { Settings } from "lucide-react"
import SettingsDialog from "@/components/settings/SettingsDialog"

export default function PrimaryLayout({ children }: { children: React.ReactNode }) {
  const handleLogout = async () => {
    await signOut({ redirectTo: "/login" })
  }
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-48 border-r flex-shrink-0 flex flex-col justify-between">
        <div>
        <div className="p-6">
          <h2 className="text-xl font-semibold">File Chat</h2>
        </div>
        <nav className="mt-6">
          <div className="mt-1">
            <Link
              href="/dashboard"
              className={cn(
                "block px-6 py-2 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/snippet"
              className={cn(
                "block px-6 py-2 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              )}
            >
              Snippets
            </Link>
          </div>
        </nav>
        </div>
        <div className="mb-1 w-full space-y-1 px-2">
          <SettingsDialog>
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </SettingsDialog>
          <Button onClick={handleLogout} className="w-full">
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
