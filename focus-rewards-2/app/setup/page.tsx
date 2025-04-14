"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Facebook, Instagram, Twitter, Youtube, Plus, Clock } from "lucide-react"
import { ExtensionCheck } from "@/components/extension-check"

// Declare chrome as a global variable to avoid Typescript errors
declare global {
  interface Window {
    chrome?: any
  }
}

export default function SetupPage() {
  const router = useRouter()
  const [duration, setDuration] = useState(25)
  const [blockedSites, setBlockedSites] = useState({
    facebook: true,
    instagram: true,
    twitter: false,
    youtube: false,
  })
  const [customUrl, setCustomUrl] = useState("")
  const [customUrls, setCustomUrls] = useState<string[]>([])
  const [isReady, setIsReady] = useState(false)

  const handleAddCustomUrl = () => {
    if (customUrl && !customUrls.includes(customUrl)) {
      setCustomUrls([...customUrls, customUrl])
      setCustomUrl("")
    }
  }

  // Update the handleStartSession function to communicate with the extension
  const handleStartSession = () => {
    // Store session data in localStorage
    const sessionData = {
      duration,
      blockedSites: {
        ...blockedSites,
        custom: customUrls,
      },
      startTime: new Date().toISOString(),
    }

    localStorage.setItem("focusSession", JSON.stringify(sessionData))

    // Prepare domains to block
    const domainsToBlock: string[] = []
    if (blockedSites.facebook) domainsToBlock.push("facebook.com")
    if (blockedSites.instagram) domainsToBlock.push("instagram.com")
    if (blockedSites.twitter) domainsToBlock.push("twitter.com")
    if (blockedSites.youtube) domainsToBlock.push("youtube.com")
    customUrls.forEach((url) => domainsToBlock.push(url))

    // Only proceed if there are domains to block
    if (domainsToBlock.length > 0) {
      console.log(`Blocking domains for ${duration} minutes:`, domainsToBlock);
      
      // Send message to extension to block domains
      try {
        // Try direct messaging first (if extension allows it)
        if (window.chrome && window.chrome.runtime && window.chrome.runtime.sendMessage) {
          window.chrome.runtime.sendMessage(
            { 
              action: "block", 
              domains: domainsToBlock,
              duration: duration // Pass the duration in minutes
            },
            (response: any) => {
              if (response && response.success) {
                console.log("Sites blocked successfully via runtime API")
              } else {
                console.log("Failed to block sites via runtime API")
                // Fallback to window messaging for content script
                sendMessageViaWindow(domainsToBlock, "block", duration)
              }
            }
          )
        } else {
          // Fallback to window messaging for content script
          sendMessageViaWindow(domainsToBlock, "block", duration)
        }
      } catch (error) {
        console.error("Error communicating with extension:", error)
        // Fallback to window messaging
        sendMessageViaWindow(domainsToBlock, "block", duration)
      }
    }

    router.push("/session")
  }

  // Update the window messaging function to include duration
  const sendMessageViaWindow = (domains: string[], action: string, duration?: number) => {
    console.log(`Sending ${action} message via window for domains:`, domains, duration ? `duration: ${duration} minutes` : '');
    
    window.postMessage(
      {
        type: "FOCUS_REWARDS_MESSAGE",
        payload: { 
          action, 
          domains,
          duration // Include the duration
        },
      },
      "*"
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[70px] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[600px]">
        <ExtensionCheck />
        <Card className="w-full shadow-md animate-in fade-in slide-in-from-bottom-8 duration-500">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Set Up Your Study Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Duration Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="duration" className="text-lg font-medium">
                  Study Duration: {duration} minutes
                </Label>
                <Clock className="h-5 w-5 text-[#283593]" />
              </div>
              <Slider
                id="duration"
                min={5}
                max={120}
                step={5}
                value={[duration]}
                onValueChange={(value) => setDuration(value[0])}
                className="py-4"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>5 min</span>
                <span>60 min</span>
                <span>120 min</span>
              </div>
            </div>

            {/* Site Blocking Setup */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Block These Distractions</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 border rounded-md">
                  <Checkbox
                    id="facebook"
                    checked={blockedSites.facebook}
                    onCheckedChange={(checked) => setBlockedSites({ ...blockedSites, facebook: checked === true })}
                  />
                  <Label htmlFor="facebook" className="flex items-center cursor-pointer">
                    <Facebook className="h-5 w-5 mr-2 text-blue-600" />
                    Facebook
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-md">
                  <Checkbox
                    id="instagram"
                    checked={blockedSites.instagram}
                    onCheckedChange={(checked) => setBlockedSites({ ...blockedSites, instagram: checked === true })}
                  />
                  <Label htmlFor="instagram" className="flex items-center cursor-pointer">
                    <Instagram className="h-5 w-5 mr-2 text-pink-600" />
                    Instagram
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-md">
                  <Checkbox
                    id="twitter"
                    checked={blockedSites.twitter}
                    onCheckedChange={(checked) => setBlockedSites({ ...blockedSites, twitter: checked === true })}
                  />
                  <Label htmlFor="twitter" className="flex items-center cursor-pointer">
                    <Twitter className="h-5 w-5 mr-2 text-blue-400" />
                    Twitter
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-md">
                  <Checkbox
                    id="youtube"
                    checked={blockedSites.youtube}
                    onCheckedChange={(checked) => setBlockedSites({ ...blockedSites, youtube: checked === true })}
                  />
                  <Label htmlFor="youtube" className="flex items-center cursor-pointer">
                    <Youtube className="h-5 w-5 mr-2 text-red-600" />
                    YouTube
                  </Label>
                </div>
              </div>

              {/* Custom URL */}
              <div className="space-y-2">
                <Label htmlFor="custom-url">Add Custom Website</Label>
                <div className="flex space-x-2">
                  <Input
                    id="custom-url"
                    placeholder="e.g., reddit.com"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddCustomUrl}
                    disabled={!customUrl}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Custom URLs List */}
              {customUrls.length > 0 && (
                <div className="space-y-2">
                  <Label>Custom Blocked Sites:</Label>
                  <div className="flex flex-wrap gap-2">
                    {customUrls.map((url, index) => (
                      <div key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center">
                        {url}
                        <button
                          className="ml-2 text-gray-500 hover:text-red-500"
                          onClick={() => setCustomUrls(customUrls.filter((_, i) => i !== index))}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ready Toggle */}
            <div className="flex items-center justify-between space-x-2 pt-4">
              <Label htmlFor="ready" className="text-lg font-medium cursor-pointer">
                I'm ready to focus
              </Label>
              <Switch id="ready" checked={isReady} onCheckedChange={setIsReady} />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleStartSession}
              disabled={!isReady}
              className="w-full bg-[#43A047] hover:bg-[#2E7D32] text-white py-6 text-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              Start Session
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
