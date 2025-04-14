// Set up a Set to store blocked domains
let blockedDomains = new Set();

// Track blocking timers
let blockingTimers = new Map();

// Debug logging when script first loads
console.log("Focus Rewards Blocker background script loaded");

// Load any previously blocked domains from storage
chrome.storage.local.get(["blockedDomains"], (result) => {
  if (result.blockedDomains) {
    blockedDomains = new Set(result.blockedDomains);
    console.log("Loaded blocked domains:", Array.from(blockedDomains));
  }
});

// Initialize or update when the extension is installed or updated
chrome.runtime.onInstalled.addListener(function() {
  console.log("Extension installed/updated");
  // Initialize blockedDomains if not already set
  chrome.storage.local.get(['blockedDomains'], function(result) {
    if (!result.blockedDomains) {
      chrome.storage.local.set({ blockedDomains: [] });
    }
  });
  
  // Clear any existing blocks
  clearAllBlocks();
});

// Function to clear all blocks
function clearAllBlocks() {
  console.log("Clearing all blocked domains");
  blockedDomains.clear();
  blockingTimers.clear();
  chrome.storage.local.set({ blockedDomains: [] }, function() {
    console.log("All blocks cleared");
  });
}

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log("Background script received message:", message, "from:", sender.url || sender.id);

  // Validate the sender is from an allowed origin (either our extension or the website)
  const isValidSender = sender.id === chrome.runtime.id || 
      (sender.origin && (
        sender.origin.includes("localhost") || 
        sender.origin.includes("focus-rewards")
      ));
  
  if (isValidSender) {
    // Handle different actions
    if (message.action === "ping") {
      // Respond to ping to check if extension is installed
      console.log("Received ping, responding with pong");
      sendResponse({ success: true, action: "pong" });
      return true;
    }

    if (message.action === "checkInstalled") {
      // Respond to check if extension is installed
      console.log("Received checkInstalled, responding with installed status");
      sendResponse({ success: true, installed: true });
      return true;
    }

    if (message.action === "block" && Array.isArray(message.domains)) {
      // Add domains to the blocked list
      message.domains.forEach((domain) => {
        // Clean the domain (remove http://, https://, www. prefixes)
        const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").trim();
        if (cleanDomain) {
          blockedDomains.add(cleanDomain);
        }
      });

      // Save to storage
      chrome.storage.local.set({ blockedDomains: Array.from(blockedDomains) });

      // Set up a timer if duration is provided
      if (message.duration && typeof message.duration === 'number') {
        const endTime = Date.now() + (message.duration * 60 * 1000); // Convert minutes to milliseconds
        
        message.domains.forEach(domain => {
          const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").trim();
          blockingTimers.set(cleanDomain, endTime);
        });
        
        // Set a timeout to unblock after duration
        setTimeout(() => {
          unblockDomainsAfterTimeout(message.domains);
        }, message.duration * 60 * 1000);
      }

      console.log("Updated blocked domains:", Array.from(blockedDomains));
      sendResponse({ success: true, message: "Domains blocked successfully" });
      return true;
    }

    if (message.action === "unblock") {
      console.log("Background script processing unblock request:", message.domains);
      
      if (Array.isArray(message.domains) && message.domains.length > 0) {
        // Remove specific domains from the blocked list
        message.domains.forEach((domain) => {
          const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").trim();
          blockedDomains.delete(cleanDomain);
          blockingTimers.delete(cleanDomain);
          console.log(`Domain unblocked: ${cleanDomain}`);
        });
      } else {
        // Clear all blocked domains if no specific domains provided
        console.log("Clearing all blocked domains");
        clearAllBlocks();
      }

      // Save to storage immediately to ensure changes persist
      chrome.storage.local.set({ blockedDomains: Array.from(blockedDomains) }, function() {
        console.log("Blocked domains list saved after unblocking:", Array.from(blockedDomains));
      });

      console.log("Updated blocked domains after unblock:", Array.from(blockedDomains));
      sendResponse({ success: true, message: "Domains unblocked successfully" });
      return true;
    }

    if (message.action === "getBlockedDomains") {
      // Return the current list of blocked domains with their end times
      const blockedDomainsWithTimes = Array.from(blockedDomains).map(domain => {
        return {
          domain: domain,
          endTime: blockingTimers.has(domain) ? blockingTimers.get(domain) : null
        };
      });
      
      sendResponse({ 
        success: true, 
        domains: Array.from(blockedDomains),
        domainsWithTimes: blockedDomainsWithTimes
      });
      return true;
    }
    
    // Emergency unblock - special case to handle urgent unblocking
    if (message.action === "emergencyUnblock" || message.action === "forceUnblock") {
      console.log("Emergency unblock requested");
      clearAllBlocks();
      sendResponse({ success: true, message: "All domains force-unblocked" });
      return true;
    }
  }

  // Default response for unhandled messages or unauthorized senders
  sendResponse({ success: false, message: "Invalid request or unauthorized sender" });
  return true;
});

// Function to unblock domains after timeout
function unblockDomainsAfterTimeout(domains) {
  const domainsToUnblock = [];
  
  domains.forEach(domain => {
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").trim();
    
    // Check if the domain is still supposed to be blocked
    if (blockingTimers.has(cleanDomain) && blockingTimers.get(cleanDomain) <= Date.now()) {
      blockedDomains.delete(cleanDomain);
      blockingTimers.delete(cleanDomain);
      domainsToUnblock.push(cleanDomain);
    }
  });
  
  if (domainsToUnblock.length > 0) {
    // Save updated list to storage
    chrome.storage.local.set({ blockedDomains: Array.from(blockedDomains) });
    console.log("Domains unblocked after timeout:", domainsToUnblock);
  }
}

// Listen for web navigation and check if the URL should be blocked
chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
  // Ignore subframes, only block main frame navigation
  if (details.frameId !== 0) {
    return;
  }
  
  // Get the hostname from the URL
  const url = new URL(details.url);
  let hostname = url.hostname;
  
  // Remove www. prefix if present
  hostname = hostname.replace(/^www\./, '');
  
  // Check if this hostname is in our blocked list and not expired
  const shouldBlock = checkIfShouldBlock(hostname);
  
  if (shouldBlock) {
    // If it should be blocked, redirect to a blocked page
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL('blocked.html') + "?site=" + encodeURIComponent(hostname)
    });
  }
});

// Function to check if a hostname should be blocked
function checkIfShouldBlock(hostname) {
  // Check direct match
  if (blockedDomains.has(hostname)) {
    const timer = blockingTimers.get(hostname);
    if (!timer || timer > Date.now()) {
      return true;
    } else {
      // Timer expired, remove from blocked list
      blockedDomains.delete(hostname);
      blockingTimers.delete(hostname);
      chrome.storage.local.set({ blockedDomains: Array.from(blockedDomains) });
      return false;
    }
  }
  
  // Check parent domains (e.g., example.com would block subdomain.example.com)
  const domainParts = hostname.split('.');
  for (let i = 1; i < domainParts.length - 1; i++) {
    const parentDomain = domainParts.slice(i).join('.');
    if (blockedDomains.has(parentDomain)) {
      const timer = blockingTimers.get(parentDomain);
      if (!timer || timer > Date.now()) {
        return true;
      }
    }
  }
  
  return false;
}

// Set up a check timer to periodically verify and clean up expired blocks
setInterval(() => {
  const now = Date.now();
  let hasChanges = false;
  
  // Check all timers and remove expired ones
  blockingTimers.forEach((endTime, domain) => {
    if (endTime <= now) {
      console.log(`Timer expired for ${domain}, removing block`);
      blockedDomains.delete(domain);
      blockingTimers.delete(domain);
      hasChanges = true;
    }
  });
  
  // Update storage if changes were made
  if (hasChanges) {
    chrome.storage.local.set({ blockedDomains: Array.from(blockedDomains) });
  }
}, 60000); // Check every minute 