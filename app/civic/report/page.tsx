"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Camera,
  MapPin,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileImage,
  Trash2,
  Navigation,
} from "lucide-react"
import { Header } from "@/components/header"
import { FloatingParticles } from "@/components/particles"
import { Button } from "@/components/ui/button"
import { getUser } from "@/lib/storage"

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:8000` : "http://localhost:8000")

const ISSUE_ICONS: Record<string, string> = {
  Garbage: "🗑️",
  Pothole: "🕳️",
  "Streetlight Issue": "💡",
  Unknown: "❓",
}

const SEVERITY_COLORS: Record<string, string> = {
  High: "text-red-400 bg-red-500/10 border-red-500/30",
  Medium: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  Low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
}

export default function CivicReportPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [description, setDescription] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locationName, setLocationName] = useState<string>("")
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    getUser().then((u) => {
      if (!u) router.push("/")
    })
  }, [router])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowed.includes(file.type)) {
      setError("Please upload a JPG, PNG, WEBP, or GIF image.")
      return
    }
    setImageFile(file)
    setError("")
    const reader = new FileReader()
    reader.onload = (ev) => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const getLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported by your browser.")
      return
    }
    setGeoLoading(true)
    setGeoError("")
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        setLatitude(lat)
        setLongitude(lon)
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1&email=contact@ecopulse.local`)
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.village || ""
          const state = data.address?.state || ""
          const fullName = city && state ? `${city}, ${state}` : data.display_name
          setLocationName(fullName || "Location captured")
        } catch (e) {
          setLocationName("Location captured")
        }
        
        setGeoLoading(false)
      },
      () => {
        setGeoError("Could not get location. Please allow location access.")
        setGeoLoading(false)
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() && !imageFile) {
      setError("Please provide a description or upload an image.")
      return
    }
    setSubmitting(true)
    setError("")
    setResult(null)

    const formData = new FormData()
    formData.append("description", description)
    if (latitude !== null) formData.append("latitude", String(latitude))
    if (longitude !== null) formData.append("longitude", String(longitude))
    if (locationName) formData.append("location_name", locationName)
    if (imageFile) formData.append("image", imageFile)

    try {
      const res = await fetch(`${BACKEND}/api/report`, {
        method: "POST",
        credentials: "include",
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || "Submission failed")
      }
      const data = await res.json()
      setResult(data)
      setDescription("")
      clearImage()
      setLatitude(null)
      setLongitude(null)
      setLocationName("")
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950">
      <FloatingParticles />
      <Header />

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Report Civic Issue</h1>
              <p className="text-muted-foreground text-sm">
                Help improve your city — AI will classify and route your report
              </p>
            </div>
          </div>
        </div>

        {/* Success Result */}
        {result && (
          <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              <h2 className="text-lg font-semibold text-emerald-400">Report Submitted!</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Detected Issue</p>
                <p className="text-foreground font-semibold text-lg">
                  {ISSUE_ICONS[result.issue_type] ?? "📋"} {result.issue_type}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Assigned Department</p>
                <p className="text-foreground font-semibold">{result.department}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Severity</p>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-md text-sm font-medium border ${SEVERITY_COLORS[result.severity] ?? ""}`}
                >
                  {result.severity}
                </span>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <span className="inline-flex px-2 py-0.5 rounded-md text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/30">
                  {result.status}
                </span>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-400 text-sm font-medium">🎁 +10 points earned for reporting!</p>
            </div>
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => setResult(null)}
                variant="outline"
                className="border-white/20 hover:bg-white/10"
              >
                Submit Another
              </Button>
              <Button
                onClick={() => router.push("/civic/my-reports")}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                View My Reports
              </Button>
            </div>
          </div>
        )}

        {/* Form */}
        {!result && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-400" />
                Upload Photo (Optional)
              </h2>

              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-64 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg p-1.5 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="mt-2 text-xs text-muted-foreground">{imageFile?.name}</div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
                >
                  <FileImage className="h-10 w-10 mx-auto text-muted-foreground group-hover:text-emerald-400 transition-colors mb-3" />
                  <p className="text-foreground font-medium mb-1">Click to upload image</p>
                  <p className="text-muted-foreground text-sm">JPG, PNG, WEBP or GIF — AI will analyse it</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Description */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                <Upload className="h-4 w-4 text-emerald-400" />
                Describe the Issue
              </h2>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="e.g. There is a large pothole on MG Road near the petrol pump... or garbage dump near the park entrance..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
              <p className="text-xs text-muted-foreground mt-2">
                AI will detect the issue type from your description
              </p>
            </div>

            {/* Geolocation */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-400" />
                Location
              </h2>

              {latitude && longitude ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Navigation className="h-4 w-4 text-emerald-400" />
                  <div>
                    <p className="text-emerald-400 text-sm font-medium">{locationName || "Location captured!"}</p>
                    <p className="text-muted-foreground text-xs">
                      {latitude.toFixed(5)}, {longitude.toFixed(5)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setLatitude(null); setLongitude(null); setLocationName("") }}
                    className="ml-auto text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={getLocation}
                  disabled={geoLoading}
                  className="border-white/20 hover:bg-white/10 flex items-center gap-2"
                >
                  {geoLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  {geoLoading ? "Getting location..." : "Use My Location"}
                </Button>
              )}

              {geoError && (
                <p className="text-red-400 text-sm mt-2">{geoError}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Location helps route the report to the right local office
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white h-12 text-base font-semibold rounded-xl transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Analysing &amp; Submitting...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Submit Civic Report
                </>
              )}
            </Button>
          </form>
        )}
      </main>
    </div>
  )
}
