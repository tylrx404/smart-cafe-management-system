"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  MapPin,
  MessageSquare,
  Plus,
} from "lucide-react"
import { Header } from "@/components/header"
import { FloatingParticles } from "@/components/particles"
import { Button } from "@/components/ui/button"
import { getUser } from "@/lib/storage"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://localhost:8000")

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  Pending: {
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    icon: Clock,
    label: "Pending",
  },
  "In Progress": {
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    icon: RefreshCw,
    label: "In Progress",
  },
  Resolved: {
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    icon: CheckCircle2,
    label: "Resolved",
  },
}

const SEVERITY_COLORS: Record<string, string> = {
  High: "text-red-400 bg-red-500/10 border-red-500/30",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
}

const ISSUE_ICONS: Record<string, string> = {
  Garbage: "🗑️",
  Pothole: "🕳️",
  "Streetlight Issue": "💡",
  Unknown: "❓",
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function MyReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchReports = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`${BACKEND}/api/my-reports`, {
        credentials: "include",
      })
      if (res.status === 401) {
        router.push("/")
        return
      }
      const data = await res.json()
      setReports(data)
    } catch {
      setError("Failed to load reports. Is the backend running?")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getUser().then((u) => {
      if (!u) router.push("/")
      else fetchReports()
    })
  }, [])

  const total = reports.length
  const resolved = reports.filter((r) => r.status === "Resolved").length
  const pending = reports.filter((r) => r.status === "Pending").length
  const inProgress = reports.filter((r) => r.status === "In Progress").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950">
      <FloatingParticles />
      <Header />

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Reports</h1>
              <p className="text-muted-foreground text-sm">Track the status of your civic reports</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={fetchReports}
              variant="outline"
              className="border-white/20 hover:bg-white/10 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => router.push("/civic/report")}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Report
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Reports", value: total, color: "text-foreground", bg: "bg-white/5" },
            { label: "Pending", value: pending, color: "text-amber-400", bg: "bg-amber-500/5" },
            { label: "In Progress", value: inProgress, color: "text-blue-400", bg: "bg-blue-500/5" },
            { label: "Resolved", value: resolved, color: "text-emerald-400", bg: "bg-emerald-500/5" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.bg} border border-white/10 rounded-xl p-4`}
            >
              <p className="text-muted-foreground text-xs mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && reports.length === 0 && (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-foreground font-semibold mb-2">No reports yet</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Be the first to report a civic issue in your area
            </p>
            <Button
              onClick={() => router.push("/civic/report")}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
            >
              Submit First Report
            </Button>
          </div>
        )}

        {/* Reports List */}
        {!loading && reports.length > 0 && (
          <div className="space-y-4">
            {reports.map((report) => {
              const statusCfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG["Pending"]
              const StatusIcon = statusCfg.icon

              return (
                <div
                  key={report.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Issue Icon */}
                    <div className="text-4xl flex-shrink-0">
                      {ISSUE_ICONS[report.issue_type] ?? "📋"}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-foreground font-semibold text-lg">
                          {report.issue_type}
                        </h3>
                        <span className="text-muted-foreground text-xs">#{report.id}</span>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${statusCfg.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </span>

                        {/* Severity Badge */}
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${SEVERITY_COLORS[report.severity] ?? ""}`}
                        >
                          {report.severity}
                        </span>
                      </div>

                      {/* Department */}
                      <p className="text-muted-foreground text-sm mb-2">
                        🏛️ {report.department}
                      </p>

                      {/* Description */}
                      {report.description && (
                        <p className="text-foreground/70 text-sm mb-3 line-clamp-2">
                          {report.description}
                        </p>
                      )}

                      {/* Location & Date */}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {(report.location_name || (report.latitude && report.longitude)) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {report.location_name ? report.location_name : `${report.latitude?.toFixed(3)}, ${report.longitude?.toFixed(3)}`}
                          </span>
                        )}
                        <span>📅 {formatDate(report.created_at)}</span>
                      </div>

                      {/* Admin Message */}
                      {report.admin_message && (
                        <div className="mt-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                            <span className="text-blue-400 text-xs font-medium">Admin Response</span>
                          </div>
                          <p className="text-foreground/80 text-sm">{report.admin_message}</p>
                          {report.resolution_days && (
                            <p className="text-blue-300 text-xs mt-1">
                              ⏳ Expected resolution: {report.resolution_days} day(s)
                            </p>
                          )}
                        </div>
                      )}

                      {/* Resolved reward */}
                      {report.status === "Resolved" && (
                        <div className="mt-3 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <p className="text-emerald-400 text-xs font-medium">
                            🎁 +20 bonus points earned — Issue resolved!
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Image thumbnail */}
                    {report.image_path && (
                      <div className="flex-shrink-0">
                        <img
                          src={`${BACKEND}${report.image_path}`}
                          alt="Report"
                          className="w-24 h-24 object-cover rounded-xl border border-white/10"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = "none"
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
