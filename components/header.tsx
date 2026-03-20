"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Leaf,
  LayoutDashboard,
  Edit3,
  BarChart3,
  Map,
  TrendingUp,
  Recycle,
  Info,
  MapPin,
  User,
  LogOut,
  ChevronDown,
  AlertTriangle,
  Bell,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getUser, clearUserLocally, logoutUser } from "@/lib/storage"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://localhost:8000")

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/daily-input", label: "Daily Input", icon: Edit3 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/heatmap", label: "India Heatmap", icon: Map },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/tackle-pollution", label: "Tackle Pollution", icon: Recycle },
  { href: "/civic/report", label: "Civic Issues", icon: AlertTriangle },
  { href: "/about", label: "About", icon: Info },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    getUser().then((u) => setUser(u))
  }, [])

  // Fetch notifications periodically
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/notifications`, { credentials: "include" })
        if (!res.ok) return
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread_count || 0)
      } catch {
        // silently fail if backend is not up
      }
    }
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [])

  const markAllRead = async () => {
    try {
      await fetch(`${BACKEND}/api/notifications/read-all`, {
        method: "POST",
        credentials: "include",
      })
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch {}
  }

  const handleLogout = async () => {
    await logoutUser()
    router.push("/")
  }

  const handleChangeCity = () => {
    clearUserLocally()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              EcoPulse
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              const isCivic = item.href === "/civic/report"
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? isCivic
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-emerald-500/20 text-emerald-400"
                      : isCivic
                        ? "text-amber-300/70 hover:text-amber-300 hover:bg-amber-500/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {user && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-emerald-500" />
                <span>{user.city}</span>
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setNotifOpen((o) => !o)
                  if (!notifOpen && unreadCount > 0) markAllRead()
                }}
                className="relative w-9 h-9 rounded-lg hover:bg-white/10"
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <span className="font-medium text-foreground text-sm">🔔 Notifications</span>
                    <button
                      onClick={markAllRead}
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto overflow-x-hidden">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-muted-foreground text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-white/5 ${
                            !n.is_read ? "bg-emerald-500/5" : ""
                          }`}
                        >
                          <p className="text-foreground text-xs leading-relaxed">{n.message}</p>
                          <p className="text-muted-foreground text-xs mt-1">
                            {n.timestamp ? new Date(n.timestamp).toLocaleDateString() : ""}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-white/10">
                    <Link
                      href="/civic/my-reports"
                      className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                      onClick={() => setNotifOpen(false)}
                    >
                      View all reports →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/20">
                {user && (
                  <>
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.city}, {user.state}
                      </p>
                    </div>
                    <DropdownMenuSeparator className="bg-white/10" />
                  </>
                )}
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/civic/report" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    Report Civic Issue
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/civic/my-reports" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    My Reports
                  </Link>
                </DropdownMenuItem>
                {user?.role === "admin" && (
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/admin/civic" className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-purple-400" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleChangeCity} className="cursor-pointer">
                  <MapPin className="mr-2 h-4 w-4" />
                  Change City
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="lg:hidden flex items-center gap-1 pb-3 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const isCivic = item.href === "/civic/report"
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? isCivic
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-emerald-500/20 text-emerald-400"
                    : isCivic
                      ? "text-amber-300/70 hover:text-amber-300 hover:bg-amber-500/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
