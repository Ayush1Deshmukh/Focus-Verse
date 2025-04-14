"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Check } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

declare global {
  interface Window {
    chrome?: any
    FOCUS_REWARDS_EXTENSION_INSTALLED?: boolean
  }
}

export function ExtensionCheck() {
  const [extensionInstalled, setExtensionInstalled] = useState<boolean | null>(null)
  const [checkAttempts, setCheckAttempts] = useState(0)

  useEffect(() => {
    // Check if extension is installed
    const checkExtension = () => {
      console.log("Checking for extension, attempt:", checkAttempts + 1);
      
      // Method 1: Check for global variable set by the extension
      if (window.FOCUS_REWARDS_EXTENSION_INSTALLED === true) {
        console.log("Extension detected via global variable");
        setExtensionInstalled(true);
        return;
      }
      
      // Method 2: Check for DOM marker without affecting hydration
      // We avoid checking document.documentElement attributes to prevent hydration errors
      if (document.getElementById('focus-rewards-extension-marker')) {
        console.log("Extension detected via DOM marker");
        setExtensionInstalled(true);
        return;
      }

      // Method 3: Try Chrome runtime API
      if (window.chrome && window.chrome.runtime && window.chrome.runtime.sendMessage) {
        try {
          console.log("Trying Chrome runtime API");
          window.chrome.runtime.sendMessage(
            { action: "ping" },
            (response: any) => {
              if (window.chrome?.runtime?.lastError) {
                console.log("Chrome runtime error:", window.chrome.runtime.lastError);
                // Continue with other methods
              } else if (response && response.success) {
                console.log("Extension detected via Chrome runtime API");
                setExtensionInstalled(true);
                return;
              }
            },
          )
        } catch (error) {
          console.log("Error with Chrome runtime API:", error);
          // Continue with other methods
        }
      }

      // Method 4: Check via window messaging
      const messageListener = (event: MessageEvent) => {
        console.log("Received message from window:", event.data?.type);
        
        // Check for various response formats
        if (event.data) {
          if (
            (event.data.type === "FOCUS_REWARDS_RESPONSE" && event.data.payload && event.data.payload.action === "pong") ||
            (event.data.type === "EXTENSION_PONG") ||
            (event.data.type === "EXTENSION_DETECTED") ||
            (event.data.type === "FOCUS_REWARDS_INSTALLED") ||
            (event.data.type === "FOCUS_REWARDS_INSTALLED_CONFIRMED")
          ) {
            console.log("Extension detected via window messaging:", event.data.type);
            setExtensionInstalled(true);
            window.removeEventListener("message", messageListener);
            return;
          }
        }
      };

      window.addEventListener("message", messageListener);

      // Send messages in multiple formats
      console.log("Sending ping messages to extension");
      
      // Format 1: Standard message
      window.postMessage(
        {
          type: "FOCUS_REWARDS_MESSAGE",
          payload: { action: "ping" },
        },
        "*"
      );
      
      // Format 2: Simple ping
      window.postMessage(
        {
          type: "PING_EXTENSION"
        },
        "*"
      );
      
      // Format 3: Detection request
      window.postMessage(
        {
          type: "DETECT_EXTENSION"
        },
        "*"
      );
      
      // Format 4: Focus rewards check
      window.postMessage(
        {
          type: "FOCUS_REWARDS_CHECK"
        },
        "*"
      );

      // Set a timeout to try again or give up
      setTimeout(() => {
        window.removeEventListener("message", messageListener);
        
        if (checkAttempts < 3) {
          setCheckAttempts(prev => prev + 1);
        } else {
          console.log("Giving up after multiple attempts");
          setExtensionInstalled(false);
        }
      }, 1500);
    };

    if (extensionInstalled === null || (extensionInstalled === false && checkAttempts < 3)) {
      checkExtension();
    }
  }, [extensionInstalled, checkAttempts]);

  if (extensionInstalled === null) {
    return (
      <Alert className="mb-6 bg-gray-100">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Detecting Extension</AlertTitle>
        <AlertDescription>
          Checking for the Focus Rewards extension...
        </AlertDescription>
      </Alert>
    );
  }

  if (extensionInstalled === false) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Extension Not Detected</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>The Focus Rewards extension is required to block distracting websites during your study sessions.</p>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => window.open("chrome://extensions/", "_blank")}
          >
            Install Extension
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Extension is installed, show a confirmation
  return (
    <Alert className="mb-6 bg-green-50 border-green-200">
      <Check className="h-4 w-4 text-green-500" />
      <AlertTitle className="text-green-700">Extension Detected</AlertTitle>
      <AlertDescription className="text-green-600">
        The Focus Rewards extension is installed and ready to block distractions.
      </AlertDescription>
    </Alert>
  )
}
