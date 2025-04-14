"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Facebook, Instagram, Twitter, Youtube, ArrowRight } from "lucide-react"
import confetti from "canvas-confetti"

// Declare canvas-confetti module
declare module 'canvas-confetti';

// Declare chrome variable to avoid undefined error
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage?: (
          extensionIdOrMessage: string | any, 
          messageOrCallback?: any | ((response: any) => void), 
          callback?: (response: any) => void
        ) => void;
      }
    }
  }
}

// Types for session data
interface BlockedSites {
  facebook?: boolean;
  instagram?: boolean;
  twitter?: boolean;
  youtube?: boolean;
  custom?: string[];
  [key: string]: any; // Add index signature for flexibility
}

interface SessionData {
  blockedSites?: BlockedSites;
  duration?: number;
  actualDuration?: number;
  pointsEarned?: number;
  [key: string]: any;
}

export default function CompletionPage() {
  const router = useRouter()
  const [pointsEarned, setPointsEarned] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [showingPoints, setShowingPoints] = useState(0)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)

  // Add this function at the beginning of the component
  const unblockSites = () => {
    // Get the blocked sites from localStorage
    const sessionData: SessionData = JSON.parse(localStorage.getItem("focusSession") || "{}")
    const blockedSites: BlockedSites = sessionData.blockedSites || {}

    // Prepare domains to unblock
    const domainsToUnblock: string[] = []
    if (blockedSites.facebook) domainsToUnblock.push("facebook.com")
    if (blockedSites.instagram) domainsToUnblock.push("instagram.com")
    if (blockedSites.twitter) domainsToUnblock.push("twitter.com")
    if (blockedSites.youtube) domainsToUnblock.push("youtube.com")
    if (blockedSites.custom && Array.isArray(blockedSites.custom)) {
      blockedSites.custom.forEach((url: string) => domainsToUnblock.push(url))
    }

    // Send message to extension to unblock domains
    try {
      // Try direct messaging first
      if (window.chrome && window.chrome.runtime && window.chrome.runtime.sendMessage) {
        window.chrome.runtime.sendMessage(
          { action: "unblock", domains: domainsToUnblock },
          (response: any) => {
            if (response && response.success) {
              console.log("Sites unblocked successfully")
            } else {
              console.log("Failed to unblock sites or extension not installed")
              // Fallback to window messaging for content script
              sendMessageViaWindow(domainsToUnblock, "unblock")
            }
          },
        )
      } else {
        // Fallback to window messaging for content script
        sendMessageViaWindow(domainsToUnblock, "unblock")
      }
    } catch (error) {
      console.error("Error communicating with extension:", error)
      // Fallback to window messaging
      sendMessageViaWindow(domainsToUnblock, "unblock")
    }
  }

  // Add this function to handle window messaging
  const sendMessageViaWindow = (domains: string[], action: string) => {
    window.postMessage(
      {
        type: "FOCUS_REWARDS_MESSAGE",
        payload: { action, domains },
      },
      "*",
    )
  }

  // Function to ensure all sites are unblocked
  const ensureUnblocking = () => {
    // Try to get blocked sites from session data
    const sessionDataStr = localStorage.getItem("focusSession");
    if (!sessionDataStr) return;
    
    try {
      const sessionData: SessionData = JSON.parse(sessionDataStr);
      const blockedSites = sessionData?.blockedSites || {};
      
      // Prepare domains to unblock
      const domainsToUnblock: string[] = [];
      if (blockedSites.facebook) domainsToUnblock.push("facebook.com");
      if (blockedSites.instagram) domainsToUnblock.push("instagram.com");
      if (blockedSites.twitter) domainsToUnblock.push("twitter.com");
      if (blockedSites.youtube) domainsToUnblock.push("youtube.com");
      
      // Safely handle custom domains
      const customDomains = blockedSites.custom || [];
      if (Array.isArray(customDomains)) {
        customDomains.forEach((url: string) => domainsToUnblock.push(url));
      }
      
      if (domainsToUnblock.length > 0) {
        console.log("Ensuring all sites are unblocked:", domainsToUnblock);
        
        // Try all available unblocking methods
        unblockViaManyMethods(domainsToUnblock);
        
        // Clear the session to prevent this from happening again
        localStorage.removeItem("focusSession");
      }
    } catch (error) {
      console.error("Error ensuring sites are unblocked:", error);
    }
  }

  // Add a more comprehensive unblocking function
  const unblockViaManyMethods = (domains: string[]) => {
    console.log("Attempting aggressive unblocking via all methods:", domains);
    
    // Method 1: Try using chrome.runtime if available
    if (
      typeof window !== "undefined" && 
      window.chrome && 
      window.chrome.runtime && 
      window.chrome.runtime.sendMessage
    ) {
      try {
        // Regular unblock message
        window.chrome.runtime.sendMessage(
          { action: "unblock", domains },
          (response: any) => {
            console.log("Unblock response:", response);
          }
        );
        
        // Emergency unblock as backup
        window.chrome.runtime.sendMessage(
          { action: "emergencyUnblock" },
          (response: any) => {
            console.log("Emergency unblock response:", response);
          }
        );
        
        // Force unblock as additional backup
        window.chrome.runtime.sendMessage(
          { action: "forceUnblock" },
          (response: any) => {
            console.log("Force unblock response:", response);
          }
        );
      } catch (error) {
        console.error("Error with runtime API:", error);
      }
    }
    
    // Method 2: Try all possible window message formats
    // Standard message format
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
        domains
      },
      "*"
    );
    
    // Emergency unblock format
    window.postMessage(
      {
        type: "FOCUS_REWARDS_MESSAGE",
        payload: { action: "emergencyUnblock" }
      },
      "*"
    );
    
    // Method 3: Set flags in localStorage
    localStorage.setItem("sitesUnblocked", "true");
    localStorage.setItem("unblockAttemptTime", new Date().toISOString());
    localStorage.setItem("domainsToUnblock", JSON.stringify(domains));
    
    // Method 4: Retry with delay to ensure the message gets through
    setTimeout(() => {
      console.log("Retry unblocking after delay");
      
      // Retry chrome runtime API if available
      if (
        typeof window !== "undefined" && 
        window.chrome && 
        window.chrome.runtime && 
        window.chrome.runtime.sendMessage
      ) {
        try {
          window.chrome.runtime.sendMessage(
            { action: "forceUnblock" },
            (response: any) => {
              console.log("Delayed force unblock response:", response);
            }
          );
        } catch (error) {
          console.error("Error with delayed runtime API call:", error);
        }
      }
      
      // Retry window messaging
      window.postMessage(
        {
          type: "FOCUS_REWARDS_MESSAGE",
          payload: { action: "forceUnblock" },
        },
        "*"
      );
    }, 1500);
  }

  // Update the useEffect to call unblockSites
  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    })

    // Unblock sites when session completes
    unblockSites()
    
    // Additional insurance: try a second unblocking approach
    ensureUnblocking()

    // Get session data and points
    const history = JSON.parse(localStorage.getItem("sessionHistory") || "[]")
    if (history.length === 0) {
      router.push("/")
      return
    }

    const lastSession = history[history.length - 1]
    setSessionData(lastSession)
    setPointsEarned(lastSession.pointsEarned || 0)

    const total = Number.parseInt(localStorage.getItem("totalPoints") || "0")
    setTotalPoints(total)

    // Animate points counter
    let count = 0
    const interval = setInterval(() => {
      count += 1
      setShowingPoints(count)
      if (count >= lastSession.pointsEarned) {
        clearInterval(interval)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [router])

  const handleRedeem = (service: string, points: number) => {
    if (totalPoints >= points) {
      // Deduct points
      const newTotal = totalPoints - points
      localStorage.setItem("totalPoints", newTotal.toString())
      setTotalPoints(newTotal)

      // Record redemption
      const redemptions = JSON.parse(localStorage.getItem("redemptions") || "[]")
      redemptions.push({
        date: new Date().toISOString(),
        service,
        points,
      })
      localStorage.setItem("redemptions", JSON.stringify(redemptions))

      // Show confirmation
      alert(`You've unlocked ${service} for 10 minutes! Enjoy your break.`)
    }
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading session data...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[70px] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl mx-auto">
        <Card className="shadow-md animate-in fade-in slide-in-from-bottom-8 duration-500">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-[#43A047]/10 w-20 h-20 rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-10 w-10 text-[#43A047]" />
            </div>
            <CardTitle className="text-3xl font-bold">Well Done!</CardTitle>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Points Summary */}
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <div className="text-lg text-gray-600 mb-2">Points Earned</div>
              <div className="text-5xl font-bold text-[#283593]">{showingPoints}</div>
              <div className="text-sm text-gray-500 mt-2">Total Balance: {totalPoints} points</div>
            </div>

            {/* Session Summary */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Session Duration</div>
                <div className="text-xl font-semibold">
                  {sessionData.actualDuration || sessionData.duration} minutes
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Distractions Blocked</div>
                <div className="text-xl font-semibold">
                  {Object.values(sessionData.blockedSites).filter(Boolean).length} sites
                </div>
              </div>
            </div>

            {/* Redeem Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Redeem Your Points</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center">
                    <Facebook className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <div className="font-medium">Facebook</div>
                      <div className="text-sm text-gray-500">10 minutes access</div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between items-center">
                    <div className="text-[#43A047] font-semibold">15 points</div>
                    <Button
                      size="sm"
                      onClick={() => handleRedeem("Facebook", 15)}
                      disabled={totalPoints < 15}
                      className="bg-[#43A047] hover:bg-[#2E7D32]"
                    >
                      Redeem
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center">
                    <Instagram className="h-8 w-8 text-pink-600 mr-3" />
                    <div>
                      <div className="font-medium">Instagram</div>
                      <div className="text-sm text-gray-500">10 minutes access</div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between items-center">
                    <div className="text-[#43A047] font-semibold">20 points</div>
                    <Button
                      size="sm"
                      onClick={() => handleRedeem("Instagram", 20)}
                      disabled={totalPoints < 20}
                      className="bg-[#43A047] hover:bg-[#2E7D32]"
                    >
                      Redeem
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center">
                    <Twitter className="h-8 w-8 text-blue-400 mr-3" />
                    <div>
                      <div className="font-medium">Twitter</div>
                      <div className="text-sm text-gray-500">10 minutes access</div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between items-center">
                    <div className="text-[#43A047] font-semibold">15 points</div>
                    <Button
                      size="sm"
                      onClick={() => handleRedeem("Twitter", 15)}
                      disabled={totalPoints < 15}
                      className="bg-[#43A047] hover:bg-[#2E7D32]"
                    >
                      Redeem
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center">
                    <Youtube className="h-8 w-8 text-red-600 mr-3" />
                    <div>
                      <div className="font-medium">YouTube</div>
                      <div className="text-sm text-gray-500">10 minutes access</div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between items-center">
                    <div className="text-[#43A047] font-semibold">25 points</div>
                    <Button
                      size="sm"
                      onClick={() => handleRedeem("YouTube", 25)}
                      disabled={totalPoints < 25}
                      className="bg-[#43A047] hover:bg-[#2E7D32]"
                    >
                      Redeem
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                View Dashboard
              </Button>
            </Link>
            <Link href="/setup" className="w-full sm:w-auto">
              <Button className="w-full bg-[#283593] hover:bg-[#1A237E]">
                Start New Session <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
