"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, CheckCircle2, Clock, ArrowRight, Loader2 } from "lucide-react"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://localhost:8000")

export function CivicIssuesSummary() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BACKEND}/api/civic-stats`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-6 flex items-center justify-center h-36">
        <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-foreground font-semibold">Civic Issues — City Overview</h3>
        </div>
        <Link
          href="/civic/report"
          className="text-amber-400 hover:text-amber-300 text-sm flex items-center gap-1 transition-colors"
        >
          Report Issue
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {stats ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Reports</p>
            </div>
            <div className="bg-amber-500/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">{stats.resolved}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
          </div>

          {/* Resolution bar */}
          {stats.total > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Resolution Rate</span>
                <span className="text-emerald-400 font-medium">{stats.resolution_rate}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${stats.resolution_rate}%` }}
                />
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-4 flex gap-2">
            <Link
              href="/civic/report"
              className="flex-1 text-center text-xs py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 transition-all font-medium"
            >
              + Report Issue
            </Link>
            <Link
              href="/civic/my-reports"
              className="flex-1 text-center text-xs py-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground border border-white/10 transition-all"
            >
              My Reports
            </Link>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-muted-foreground text-sm">
            Start your community by{" "}
            <Link href="/civic/report" className="text-amber-400 hover:underline">
              reporting a civic issue
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  )
}
