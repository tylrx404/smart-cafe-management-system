"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ShieldCheck,
  Filter,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  Send,
  X,
} from "lucide-react"
import { Header } from "@/components/header"
import { FloatingParticles } from "@/components/particles"
import { Button } from "@/components/ui/button"
import { getUser } from "@/lib/storage"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://localhost:8000")

const STATUSES = ["", "Pending", "In Progress", "Resolved"]
const ISSUE_TYPES = ["", "Garbage", "Pothole", "Streetlight Issue", "Unknown"]
const DEPARTMENTS = ["", "Waste Management", "Road Department", "Electricity Department", "General Civic Department"]

const SEVERITY_COLORS: Record<string, string> = {
  High: "text-red-400 bg-red-500/10 border-red-500/30",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  "In Progress": "text-blue-400 bg-blue-500/10 border-blue-500/30",
  Resolved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
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
  })
}

export default function AdminCivicPage() {
  const router = useRouter()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Filters
  const [filterStatus, setFilterStatus] = useState("")
  const [filterIssue, setFilterIssue] = useState("")
  const [filterDept, setFilterDept] = useState("")

  // Active response modal
  const [activeReport, setActiveReport] = useState<any>(null)
  const [responseMsg, setResponseMsg] = useState("")
  const [resolutionDays, setResolutionDays] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState("")

  const fetchReports = async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.append("status", filterStatus)
      if (filterIssue) params.append("issue_type", filterIssue)
      if (filterDept) params.append("department", filterDept)

      const res = await fetch(`${BACKEND}/api/reports?${params}`, {
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
      else if (u.role !== "admin") router.push("/dashboard")
      else fetchReports()
    })
  }, [])

  useEffect(() => {
    if (!loading) fetchReports()
  }, [filterStatus, filterIssue, filterDept])

  const handleStatusUpdate = async (reportId: number, status: string) => {
    try {
      const res = await fetch(`${BACKEND}/api/report/${reportId}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      await fetchReports()
    } catch {
      setError("Failed to update status")
    }
  }

  const handleAdminResponse = async () => {
    if (!activeReport || !responseMsg.trim()) return
    setActionLoading(true)
    setActionSuccess("")
    try {
      const body: any = {
        message: responseMsg,
        status: newStatus || undefined,
        resolution_days: resolutionDays ? parseInt(resolutionDays) : undefined,
      }
      const res = await fetch(`${BACKEND}/api/report/${activeReport.id}/admin-response`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      setActionSuccess("Response sent successfully!")
      setResponseMsg("")
      setResolutionDays("")
      setNewStatus("")
      await fetchReports()
      setTimeout(() => {
        setActiveReport(null)
        setActionSuccess("")
      }, 1500)
    } catch {
      setError("Failed to send response")
    } finally {
      setActionLoading(false)
    }
  }

  // Stats
  const total = reports.length
  const resolved = reports.filter((r) => r.status === "Resolved").length
  const pending = reports.filter((r) => r.status === "Pending").length
  const inProgress = reports.filter((r) => r.status === "In Progress").length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950">
      <FloatingParticles />
      <Header />

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Civic Panel</h1>
              <p className="text-muted-foreground text-sm">Review, respond, and resolve community reports</p>
            </div>
          </div>
          <Button
            onClick={fetchReports}
            variant="outline"
            className="border-white/20 hover:bg-white/10 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total", value: total, color: "text-foreground" },
            { label: "Pending", value: pending, color: "text-amber-400" },
            { label: "In Progress", value: inProgress, color: "text-blue-400" },
            { label: "Resolved", value: resolved, color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-muted-foreground text-xs mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Resolution Rate */}
        {total > 0 && (
          <div className="mb-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground font-medium">Resolution Rate</span>
                <span className="text-emerald-400 font-bold">{Math.round((resolved / total) * 100)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((resolved / total) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          {[
            { label: "Status", value: filterStatus, setter: setFilterStatus, options: STATUSES },
            { label: "Issue Type", value: filterIssue, setter: setFilterIssue, options: ISSUE_TYPES },
            { label: "Department", value: filterDept, setter: setFilterDept, options: DEPARTMENTS },
          ].map((f) => (
            <div key={f.label} className="relative">
              <select
                value={f.value}
                onChange={(e) => f.setter(e.target.value)}
                className="appearance-none bg-white/10 border border-white/20 text-foreground text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
              >
                <option value="" className="bg-slate-900">All {f.label}s</option>
                {f.options.slice(1).map((o) => (
                  <option key={o} value={o} className="bg-slate-900">{o}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          ))}
          {(filterStatus || filterIssue || filterDept) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFilterStatus(""); setFilterIssue(""); setFilterDept("") }}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        )}

        {/* Empty */}
        {!loading && !error && reports.length === 0 && (
          <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-foreground font-semibold mb-2">No reports found</h3>
            <p className="text-muted-foreground text-sm">Try adjusting filters or wait for new reports</p>
          </div>
        )}

        {/* Reports Table */}
        {!loading && reports.length > 0 && (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Icon + Basic Info */}
                  <div className="text-3xl flex-shrink-0">
                    {ISSUE_ICONS[report.issue_type] ?? "📋"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-foreground font-semibold">{report.issue_type}</span>
                      <span className="text-muted-foreground text-xs">#{report.id}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md border font-medium ${STATUS_COLORS[report.status] ?? ""}`}
                      >
                        {report.status}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md border font-medium ${SEVERITY_COLORS[report.severity] ?? ""}`}
                      >
                        {report.severity}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-sm mb-1">🏛️ {report.department}</p>
                    {report.description && (
                      <p className="text-foreground/70 text-sm mb-2 line-clamp-2">{report.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>👤 User: {report.user_id?.slice(0, 8)}...</span>
                      <span>📅 {formatDate(report.created_at)}</span>
                      {(report.location_name || report.latitude) && (
                        <span>📍 {report.location_name ? report.location_name : `${report.latitude.toFixed(3)}, ${report.longitude?.toFixed(3)}`}</span>
                      )}
                    </div>
                    {report.admin_message && (
                      <div className="mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                        💬 {report.admin_message}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-fit">
                    {/* Quick Status Buttons */}
                    {report.status !== "In Progress" && report.status !== "Resolved" && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(report.id, "In Progress")}
                        className="bg-blue-600/80 hover:bg-blue-600 text-white text-xs"
                      >
                        Mark In Progress
                      </Button>
                    )}
                    {report.status !== "Resolved" && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(report.id, "Resolved")}
                        className="bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Resolve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveReport(report)
                        setNewStatus(report.status)
                      }}
                      className="border-white/20 hover:bg-white/10 text-xs flex items-center gap-1"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Respond
                    </Button>
                  </div>

                  {/* Image */}
                  {report.image_path && (
                    <img
                      src={`${BACKEND}${report.image_path}`}
                      alt="Issue"
                      className="w-20 h-20 object-cover rounded-xl border border-white/10 flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Admin Response Modal */}
      {activeReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground font-semibold text-lg">
                Respond to Report #{activeReport.id}
              </h3>
              <button
                onClick={() => { setActiveReport(null); setActionSuccess("") }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Update Status */}
              <div>
                <label className="text-muted-foreground text-sm mb-1.5 block">Update Status</label>
                <div className="relative">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full appearance-none bg-white/10 border border-white/20 text-foreground rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {STATUSES.slice(1).map((s) => (
                      <option key={s} value={s} className="bg-slate-900">{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Resolution Days */}
              <div>
                <label className="text-muted-foreground text-sm mb-1.5 block">
                  Expected Resolution (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={resolutionDays}
                  onChange={(e) => setResolutionDays(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-full bg-white/10 border border-white/20 text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-muted-foreground"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-muted-foreground text-sm mb-1.5 block">
                  Message to User *
                </label>
                <textarea
                  value={responseMsg}
                  onChange={(e) => setResponseMsg(e.target.value)}
                  rows={3}
                  placeholder="e.g. We have received your report and a team has been dispatched..."
                  className="w-full bg-white/10 border border-white/20 text-foreground rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-muted-foreground"
                />
              </div>

              {actionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  {actionSuccess}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => { setActiveReport(null); setActionSuccess("") }}
                  className="flex-1 border-white/20 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAdminResponse}
                  disabled={actionLoading || !responseMsg.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Response
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
