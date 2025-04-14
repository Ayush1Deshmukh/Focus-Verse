"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, Pause, Play, StopCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function SessionPage() {
  const router = useRouter()
  const [sessionData, setSessionData] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [progress, setProgress] = useState(100)

  // Load session data from localStorage
  useEffect(() => {
    const data = localStorage.getItem("focusSession")
    if (!data) {
      router.push("/setup")
      return
    }

    const parsedData = JSON.parse(data)
    setSessionData(parsedData)
    setTimeLeft(parsedData.duration * 60) // Convert minutes to seconds
  }, [router])

  // Timer logic
  useEffect(() => {
    if (!sessionData || isPaused || timeLeft <= 0) return

    const totalDuration = sessionData.duration * 60
    setProgress((timeLeft / totalDuration) * 100)

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSessionComplete()
          return 0
        }
        return prev - 1
      })

      // Update points (1 point per minute)
      if (timeLeft % 60 === 0 && timeLeft > 0) {
        setPointsEarned((prev) => prev + 1)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionData, timeLeft, isPaused])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Handle session completion
  const handleSessionComplete = useCallback(() => {
    // Calculate final points (1 point per minute)
    const finalPoints = sessionData ? sessionData.duration : 0

    // Store session results
    const sessionHistory = JSON.parse(localStorage.getItem("sessionHistory") || "[]")
    sessionHistory.push({
      date: new Date().toISOString(),
      duration: sessionData?.duration || 0,
      pointsEarned: finalPoints,
      blockedSites: sessionData?.blockedSites || {},
    })

    localStorage.setItem("sessionHistory", JSON.stringify(sessionHistory))

    // Update total points
    const currentPoints = Number.parseInt(localStorage.getItem("totalPoints") || "0")
    localStorage.setItem("totalPoints", (currentPoints + finalPoints).toString())

    // Unblock sites
    unblockSites()

    // Navigate to completion page
    router.push("/completion")
  }, [sessionData, router])

  // Handle pause/resume
  const togglePause = () => {
    setIsPaused((prev) => !prev)
  }

  // Handle end session early
  const endSessionEarly = () => {
    if (
      window.confirm(
        "Are you sure you want to end your session early? You'll only earn points for the time you've completed.",
      )
    ) {
      // Calculate partial points (1 point per completed minute)
      const totalDuration = sessionData?.duration * 60 || 0
      const completedSeconds = totalDuration - timeLeft
      const partialPoints = Math.floor(completedSeconds / 60)

      // Store session results with partial points
      const sessionHistory = JSON.parse(localStorage.getItem("sessionHistory") || "[]")
      sessionHistory.push({
        date: new Date().toISOString(),
        duration: sessionData?.duration || 0,
        actualDuration: Math.floor(completedSeconds / 60),
        pointsEarned: partialPoints,
        blockedSites: sessionData?.blockedSites || {},
        completed: false,
      })

      localStorage.setItem("sessionHistory", JSON.stringify(sessionHistory))

      // Update total points
      const currentPoints = Number.parseInt(localStorage.getItem("totalPoints") || "0")
      localStorage.setItem("totalPoints", (currentPoints + partialPoints).toString())

      // Unblock sites
      unblockSites()

      // Navigate to completion page
      router.push("/completion")
    }
  }

  // Add the unblockSites function
  const unblockSites = () => {
    // Get the blocked sites from localStorage
    const blockedSites = sessionData?.blockedSites || {}

    // Prepare domains to unblock
    const domainsToUnblock: string[] = []
    if (blockedSites.facebook) domainsToUnblock.push("facebook.com")
    if (blockedSites.instagram) domainsToUnblock.push("instagram.com")
    if (blockedSites.twitter) domainsToUnblock.push("twitter.com")
    if (blockedSites.youtube) domainsToUnblock.push("youtube.com")
    if (blockedSites.custom && Array.isArray(blockedSites.custom)) {
      blockedSites.custom.forEach((url: string) => domainsToUnblock.push(url))
    }

    // Only proceed if there are domains to unblock
    if (domainsToUnblock.length > 0) {
      console.log("Unblocking domains:", domainsToUnblock)
      
      // Try multiple approaches to ensure unblocking works
      unblockViaAllMethods(domainsToUnblock);
    }
  }

  // New function to try all methods of unblocking
  const unblockViaAllMethods = (domains: string[]) => {
    console.log("Attempting to unblock via all methods:", domains);
    
    // Try multiple approaches to ensure unblocking works
    
    // Method 1: Chrome runtime API
    if (
      typeof window !== "undefined" &&
      window.chrome &&
      window.chrome.runtime &&
      window.chrome.runtime.sendMessage
    ) {
      try {
        // Standard unblock
        window.chrome.runtime.sendMessage(
          { action: "unblock", domains },
          (response: any) => {
            console.log("Unblock response via runtime API:", response);
          }
        );
        
        // Emergency unblock as backup
        window.chrome.runtime.sendMessage(
          { action: "emergencyUnblock" },
          (response: any) => {
            console.log("Emergency unblock response:", response);
          }
        );
      } catch (error) {
        console.error("Error with chrome runtime API:", error);
      }
    }
    
    // Method 2: Window messaging (multiple formats)
    // Standard format
    window.postMessage(
      {
        type: "FOCUS_REWARDS_MESSAGE",
        payload: { action: "unblock", domains },
      },
      "*"
    );
    
    // Alternative format
    window.postMessage(
      {
        type: "UNBLOCK_SITES",
        domains,
      },
      "*"
    );
    
    // Emergency unblock
    window.postMessage(
      {
        type: "FOCUS_REWARDS_MESSAGE",
        payload: { action: "emergencyUnblock" },
      },
      "*"
    );
    
    // Set a flag in localStorage to indicate unblocking was attempted
    localStorage.setItem("sitesUnblocked", "true");
    localStorage.setItem("lastUnblockAttempt", JSON.stringify({
      time: new Date().toISOString(),
      domains
    }));
    
    // Add delay and retry logic
    setTimeout(() => {
      console.log("Retrying unblock after delay");
      
      // Try again via window message
      window.postMessage(
        {
          type: "FOCUS_REWARDS_MESSAGE",
          payload: { action: "unblock", domains },
        },
        "*"
      );
      
      // Also try force unblock
      window.postMessage(
        {
          type: "FOCUS_REWARDS_MESSAGE",
          payload: { action: "forceUnblock" },
        },
        "*"
      );
    }, 1000);
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading session...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[70px] flex flex-col items-center justify-center px-4 py-12">
      {/* Status Bar */}
      <div className="fixed top-[70px] left-0 right-0 bg-[#283593] text-white py-3 px-4 text-center z-10">
        <p className="flex items-center justify-center">
          <AlertCircle className="mr-2 h-5 w-5" />
          Focus Mode Active – Distractions Blocked
        </p>
      </div>

      <div className="w-full max-w-md mx-auto text-center space-y-8">
        {/* Timer Display */}
        <div className="relative">
          <svg className="w-64 h-64 mx-auto" viewBox="0 0 100 100">
            <circle
              className="text-gray-200"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="42"
              cx="50"
              cy="50"
            />
            <circle
              className="text-[#283593] transition-all duration-1000 ease-in-out"
              strokeWidth="8"
              strokeDasharray={264}
              strokeDashoffset={264 - (progress * 264) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="42"
              cx="50"
              cy="50"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="text-5xl font-bold text-[#283593]">{formatTime(timeLeft)}</div>
            <div className="text-gray-500 mt-2">{isPaused ? "Paused" : "Focus Mode"}</div>
          </div>
        </div>

        {/* Points Display */}
        <Card className="p-4 shadow-sm">
          <div className="text-lg">
            Points earned: <span className="font-bold text-[#43A047]">{pointsEarned}</span>
          </div>
          <Progress value={progress} className="h-2 mt-2" />
        </Card>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={togglePause}
            variant="outline"
            size="lg"
            className="rounded-full h-14 w-14 p-0 flex items-center justify-center"
          >
            {isPaused ? <Play className="h-6 w-6 text-[#283593]" /> : <Pause className="h-6 w-6 text-[#283593]" />}
          </Button>
          <Button
            onClick={endSessionEarly}
            variant="outline"
            size="lg"
            className="rounded-full h-14 w-14 p-0 flex items-center justify-center border-red-500 hover:bg-red-50"
          >
            <StopCircle className="h-6 w-6 text-red-500" />
          </Button>
        </div>

        <div className="text-sm text-gray-500">
          {isPaused
            ? "Your session is paused. Resume to continue earning points."
            : "Stay focused! Points are awarded for each minute of focus."}
        </div>
      </div>
    </div>
  )
}
