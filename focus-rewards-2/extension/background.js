// Set up a Set to store blocked domains
let blockedDomains = new Set()

// Load any previously blocked domains from storage
chrome.storage.local.get(["blockedDomains"], (result) => {
  if (result.blockedDomains) {
    blockedDomains = new Set(result.blockedDomains)
    console.log("Loaded blocked domains:", Array.from(blockedDomains))
  }
})

// Listen for messages from the content script or website
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message, "from:", sender)

  // Validate the sender is from an allowed origin
  if (sender.origin && (sender.origin.includes("localhost") || sender.origin.includes("focus-rewards.vercel.app"))) {
    // Handle different actions
    if (message.action === "ping") {
      // Respond to ping to check if extension is installed
      sendResponse({ success: true, action: "pong" })
      return true
    }

    if (message.action === "block" && Array.isArray(message.domains)) {
      // Add domains to the blocked list
      message.domains.forEach((domain) => {
        // Clean the domain (remove http://, https://, www. prefixes)
        const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").trim()
        if (cleanDomain) {
          blockedDomains.add(cleanDomain)
        }
      })

      // Save to storage
      chrome.storage.local.set({ blockedDomains: Array.from(blockedDomains) })

      console.log("Updated blocked domains:", Array.from(blockedDomains))
      sendResponse({ success: true, message: "Domains blocked successfully" })
      return true
    }

    if (message.action === "unblock") {
      if (Array.isArray(message.domains) && message.domains.length > 0) {
        // Remove specific domains from the blocked list
        message.domains.forEach((domain) => {
          const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").trim()
          blockedDomains.delete(cleanDomain)
        })
      } else {
        // Clear all blocked domains if no specific domains provided
        blockedDomains.clear()
      }

      // Save to storage
      chrome.storage.local.set({ blockedDomains: Array.from(blockedDomains) })

      console.log("Updated blocked domains after unblock:", Array.from(blockedDomains))
      sendResponse({ success: true, message: "Domains unblocked successfully" })
      return true
    }

    if (message.action === "getBlockedDomains") {
      // Return the current list of blocked domains
      sendResponse({ success: true, domains: Array.from(blockedDomains) })
      return true
    }
  }

  // Default response for unhandled messages or unauthorized senders
  sendResponse({ success: false, message: "Invalid request or unauthorized sender" })
  return true
})

// Set up the webRequest listener to block requests to blocked domains
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      // Extract the hostname from the URL
      const url = new URL(details.url)
      const hostname = url.hostname.replace(/^www\./, "")

      // Check if the hostname or any parent domain is in the blocked list
      const domainParts = hostname.split(".")
      for (let i = 0; i < domainParts.length - 1; i++) {
        const domain = domainParts.slice(i).join(".")
        if (blockedDomains.has(domain)) {
          console.log("Blocking request to:", hostname)

          // If this is a main_frame request, redirect to a blocked page
          if (details.type === "main_frame") {
            return {
              redirectUrl: chrome.runtime.getURL("blocked.html") + "?site=" + encodeURIComponent(hostname),
            }
          }

          // Otherwise just cancel the request
          return { cancel: true }
        }
      }
    } catch (error) {
      console.error("Error in webRequest listener:", error)
    }

    // Allow the request if no match or error
    return { cancel: false }
  },
  { urls: ["<all_urls>"] },
  ["blocking"],
)
