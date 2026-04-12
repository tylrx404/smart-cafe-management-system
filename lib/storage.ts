import type { User, DailyInput, EcoScore, Badge, WasteDecision, DailyGreenIndex } from "./types"
import { ENTRY_LOCK_DURATION } from "./config"
import { calculateDailyGreenIndex } from "./calculations"
import { getToken, saveToken, removeToken, saveUser } from "./auth"

// Single source of truth — set in .env.local and Vercel env variables
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://ecopluse-1.onrender.com"

/** Build headers, attaching Bearer token when available */
function getAuthHeaders(): HeadersInit {
  const token = getToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const fetchConfig: RequestInit = {
  credentials: "include",
  headers: getAuthHeaders(),
}



export async function getUser(): Promise<User | null> {
  if (typeof window === "undefined") return null
  try {
    const res = await fetch(`${BACKEND_URL}/auth/me`, fetchConfig)
    if (!res.ok) {
      if (res.status === 401) {
        clearUserLocally()
      }
      return null
    }
    return await res.json()
  } catch (err) {
    console.error("Failed to get user:", err)
    return null
  }
}

// Used for synchronous fallback or quick UI checks
export function getLocalUser(): User | null {
  if (typeof window === "undefined") return null
  const data = localStorage.getItem("ecopulse_user_cache")
  return data ? JSON.parse(data) : null
}

export function setLocalUser(user: User): void {
  localStorage.setItem("ecopulse_user_cache", JSON.stringify(user))
}

export function clearUserLocally(): void {
  localStorage.removeItem("ecopulse_user_cache")
}

export async function logoutUser(): Promise<void> {
  try {
    const token = getToken()
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  } catch (e) {
    console.error(e)
  }
  removeToken()
  clearUserLocally()
}

export async function getDailyInputs(): Promise<DailyInput[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/data/daily-inputs`, fetchConfig)
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function addDailyInput(input: DailyInput): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/data/daily-inputs`, {
      ...fetchConfig,
      method: "POST",
      body: JSON.stringify(input),
    })

    const previousScores = await getDailyGreenIndexScores(input.userId)
    const dailyGreenIndex = calculateDailyGreenIndex(input, previousScores)
    await saveDailyGreenIndex(dailyGreenIndex)
  } catch (e) {
    console.error("Failed to save daily input", e)
  }
}

export async function getTodayInput(userId: string): Promise<DailyInput | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/data/today-input`, fetchConfig)
    if (res.status === 404 || !res.ok) return null
    const text = await res.text()
    if (!text || text === "null") return null
    return JSON.parse(text)
  } catch {
    return null
  }
}

export async function canSubmitToday(userId: string): Promise<boolean> {
  const inputs = await getDailyInputs()
  if (inputs.length === 0) return true

  const lastInput = inputs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
  const lastSubmitTime = new Date(lastInput.timestamp).getTime()
  const now = Date.now()

  return now - lastSubmitTime >= ENTRY_LOCK_DURATION
}

export async function getTimeUntilNextEntry(userId: string): Promise<number> {
  const inputs = await getDailyInputs()
  if (inputs.length === 0) return 0

  const lastInput = inputs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
  const lastSubmitTime = new Date(lastInput.timestamp).getTime()
  const now = Date.now()
  const elapsed = now - lastSubmitTime

  return Math.max(0, ENTRY_LOCK_DURATION - elapsed)
}

export async function getEcoScore(): Promise<EcoScore> {
  try {
    const res = await fetch(`${BACKEND_URL}/data/eco-score`, fetchConfig)
    if (!res.ok) throw new Error()
    const data = await res.json()
    return {
      waterCredit: data.water_credit || 0,
      energyCredit: data.energy_credit || 0,
      transportCredit: data.transport_credit || 0,
      wasteCredit: data.waste_credit || 0,
      totalScore: data.total_score || 0,
      debt: data.debt || 0
    }
  } catch {
    return { waterCredit: 0, energyCredit: 0, transportCredit: 0, wasteCredit: 0, totalScore: 0, debt: 0 }
  }
}

export async function updateEcoScore(score: EcoScore): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/data/eco-score`, {
      ...fetchConfig,
      method: "POST",
      body: JSON.stringify({
        water_credit: score.waterCredit,
        energy_credit: score.energyCredit,
        transport_credit: score.transportCredit,
        waste_credit: score.wasteCredit,
        total_score: score.totalScore,
        debt: score.debt
      }),
    })
  } catch (e) {
    console.error(e)
  }
}

export async function getBadges(): Promise<Badge[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/data/badges`, fetchConfig)
    if (!res.ok) throw new Error()
    const badges = await res.json()
    return badges.length > 0 ? badges : getDefaultBadges()
  } catch {
    return getDefaultBadges()
  }
}

export async function updateBadges(badges: Badge[]): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/data/badges`, {
      ...fetchConfig,
      method: "POST",
      body: JSON.stringify(badges),
    })
  } catch (e) {
    console.error(e)
  }
}

function getDefaultBadges(): Badge[] {
  return [
    { id: "eco-starter", name: "Eco Starter", icon: "Leaf", description: "Complete your first daily input", earned: false },
    { id: "water-saver", name: "Water Saver", icon: "Droplets", description: "Use less than 100L water for 3 days", earned: false },
    { id: "energy-aware", name: "Energy Aware", icon: "Zap", description: "Keep AC/Fan under 4 hours for 5 days", earned: false },
    { id: "green-champion", name: "Green Champion", icon: "Trophy", description: "Achieve 80+ Green Index for a week", earned: false },
    { id: "air-guardian", name: "Air Guardian", icon: "Wind", description: "Use public/walk/cycle transport for 7 days", earned: false },
    { id: "solar-hero", name: "Solar Hero", icon: "Sun", description: "High outdoor exposure for 5 days", earned: false },
  ]
}

export async function getWasteDecisions(): Promise<WasteDecision[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/data/waste-decisions`, fetchConfig)
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function addWasteDecision(decision: WasteDecision): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/data/waste-decisions`, {
      ...fetchConfig,
      method: "POST",
      body: JSON.stringify(decision),
    })
  } catch (e) {
    console.error(e)
  }
}

export async function getDailyGreenIndexScores(userId: string): Promise<DailyGreenIndex[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/data/green-index`, fetchConfig)
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

export async function saveDailyGreenIndex(index: DailyGreenIndex): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/data/green-index`, {
      ...fetchConfig,
      method: "POST",
      body: JSON.stringify(index),
    })
  } catch (e) {
    console.error(e)
  }
}

/**
 * Register a new user.
 * Returns { ok: true } on success or { ok: false, detail: string } on error.
 */
export async function registerUser(
  user: any
): Promise<{ ok: boolean; detail?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/signup`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, detail: data?.detail || "Registration failed" }
    }
    // signup auto-logs in via HttpOnly cookie; also save user cache
    if (data?.id) saveUser(data)
    return { ok: true }
  } catch (err) {
    console.error("Signup failed", err)
    return { ok: false, detail: "Server not reachable" }
  }
}

/**
 * Login an existing user.
 * Saves the access token and user to localStorage.
 * Returns { ok: true } on success or { ok: false, detail: string } on error.
 */
export async function loginUser(
  credentials: any
): Promise<{ ok: boolean; detail?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, detail: data?.detail || "Invalid credentials" }
    }
    // Backend may return { message, user, access_token? }
    if (data?.access_token) {
      saveToken(data.access_token)
    }
    if (data?.user) {
      saveUser(data.user)
      setLocalUser(data.user as User)
    }
    return { ok: true }
  } catch (err) {
    console.error("Login failed", err)
    return { ok: false, detail: "Server not reachable" }
  }
}
