// Immediately announce that the extension is installed when loaded
console.log("Focus Rewards Extension content script loaded");

// Define a global variable to mark extension presence
window.FOCUS_REWARDS_EXTENSION_INSTALLED = true;

// Check if DOM is ready
function isDOMReady() {
  return document.readyState === 'complete' || document.readyState === 'interactive';
}

// Function to safely add marker element to DOM
function addMarkerElement() {
  // Only add if body exists and marker doesn't exist yet
  if (document.body && !document.getElementById('focus-rewards-extension-marker')) {
    try {
      const marker = document.createElement('div');
      marker.id = 'focus-rewards-extension-marker';
      marker.style.display = 'none';
      marker.dataset.extensionInstalled = 'true';
      document.body.appendChild(marker);
      console.log("Extension marker added to DOM");
    } catch (error) {
      console.error("Error adding marker to DOM:", error);
    }
  } else {
    // If body isn't ready yet, wait and try again
    if (!document.body) {
      console.log("Document body not ready yet, will retry later");
    }
  }
}

// Function to announce extension presence in multiple ways
function announceExtensionPresence() {
  // Method 1: Post a message
  window.postMessage(
    {
      type: "FOCUS_REWARDS_RESPONSE",
      payload: { action: "extensionInstalled", success: true },
    },
    "*"
  );
  
  // Method 2: Set DOM attribute safely after React hydration
  // We'll delay this to avoid hydration errors
  setTimeout(() => {
    // Only set the attribute if it's not already set
    if (document.documentElement.getAttribute('data-focus-rewards-extension') !== 'installed') {
      document.documentElement.setAttribute('data-focus-rewards-extension', 'installed');
    }
  }, 2000); // Delay by 2 seconds to allow React hydration to complete
  
  // Method 3: Dispatch a custom event
  const installedEvent = new CustomEvent('focus-rewards-extension-installed', {
    detail: { installed: true }
  });
  document.dispatchEvent(installedEvent);
  
  // Method 4: Insert a hidden element as marker (only when DOM is ready)
  if (isDOMReady() && document.body) {
    addMarkerElement();
  } else {
    // If DOM isn't ready, wait a bit and try again
    setTimeout(addMarkerElement, 1000);
  }
}

// Initially call announceExtensionPresence immediately
announceExtensionPresence();

// Set up event listeners for different DOM ready states
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', announceExtensionPresence);
}

// Also listen for load event as a fallback
window.addEventListener('load', announceExtensionPresence);

// Announce on regular intervals to ensure the page detects it, but not too frequently
const announceInterval = setInterval(() => {
  if (document.body) {
    announceExtensionPresence();
  }
}, 3000);

// After 15 seconds, reduce the frequency to once every 10 seconds
setTimeout(() => {
  clearInterval(announceInterval);
  setInterval(() => {
    if (document.body) {
      announceExtensionPresence();
    }
  }, 10000);
}, 15000);

// Function to handle unblocking requests and ensure they go through
function processUnblockRequest(domains) {
  console.log("Processing unblock request for domains:", domains);
  
  // Ensure domains is an array
  if (!Array.isArray(domains)) {
    console.error("Domains is not an array:", domains);
    return;
  }
  
  // Send to background script with retry logic
  function sendUnblockMessage(retriesLeft = 3) {
    chrome.runtime.sendMessage({ action: "unblock", domains }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending unblock message:", chrome.runtime.lastError);
        if (retriesLeft > 0) {
          console.log(`Retrying unblock... (${retriesLeft} attempts left)`);
          setTimeout(() => sendUnblockMessage(retriesLeft - 1), 500);
        }
      } else if (response && response.success) {
        console.log("Unblock successful:", response);
        // Confirmation message back to webpage
        window.postMessage(
          {
            type: "UNBLOCK_CONFIRMED",
            payload: { domains, success: true }
          },
          "*"
        );
      } else {
        console.warn("Unexpected response from unblock:", response);
        if (retriesLeft > 0) {
          setTimeout(() => sendUnblockMessage(retriesLeft - 1), 500);
        }
      }
    });
  }
  
  // Start the unblock process
  sendUnblockMessage();
}

// Listen for messages from the webpage
window.addEventListener("message", (event) => {
  // Only accept messages from the same frame
  if (event.source !== window) return;

  console.log("Content script received event type:", event.data?.type);

  // Handle different types of messages from the website
  
  // Type 1: FOCUS_REWARDS_MESSAGE - standard format
  if (event.data && event.data.type === "FOCUS_REWARDS_MESSAGE") {
    console.log("Content script received FOCUS_REWARDS_MESSAGE:", event.data);
    
    // Special handling for unblock action
    if (event.data.payload && event.data.payload.action === "unblock") {
      processUnblockRequest(event.data.payload.domains);
    } else {
      // Forward other messages to the background script
      chrome.runtime.sendMessage(event.data.payload, (response) => {
        // Send the response back to the webpage
        window.postMessage(
          {
            type: "FOCUS_REWARDS_RESPONSE",
            payload: response || { success: true },
          },
          "*"
        );
      });
    }
  }
  
  // Type 2: PING_EXTENSION - simple ping
  else if (event.data && event.data.type === "PING_EXTENSION") {
    console.log("Received ping from website");
    window.postMessage(
      {
        type: "EXTENSION_PONG",
        payload: { installed: true },
      },
      "*"
    );
  }
  
  // Type 3: DETECT_EXTENSION - another detection method
  else if (event.data && event.data.type === "DETECT_EXTENSION") {
    console.log("Received extension detection request");
    window.postMessage(
      {
        type: "EXTENSION_DETECTED",
        installed: true,
      },
      "*"
    );
  }
  
  // Type 4: FOCUS_REWARDS_CHECK - yet another format
  else if (event.data && event.data.type === "FOCUS_REWARDS_CHECK") {
    console.log("Received focus rewards check");
    window.postMessage(
      {
        type: "FOCUS_REWARDS_INSTALLED",
        installed: true,
      },
      "*"
    );
    
    // Also forward to background script to ensure it's aware
    chrome.runtime.sendMessage({ action: "checkInstalled" }, (response) => {
      window.postMessage(
        {
          type: "FOCUS_REWARDS_INSTALLED_CONFIRMED",
          payload: response || { success: true, installed: true },
        },
        "*"
      );
    });
  }
  
  // Special type: Direct unblock request 
  else if (event.data && event.data.type === "UNBLOCK_SITES" && event.data.domains) {
    console.log("Received direct unblock request");
    processUnblockRequest(event.data.domains);
  }
});

// Also listen for page unload/tab close to ensure unblocking
window.addEventListener("beforeunload", () => {
  // Try to get any session data from localStorage
  try {
    const sessionDataStr = localStorage.getItem("focusSession");
    if (sessionDataStr) {
      const sessionData = JSON.parse(sessionDataStr);
      if (sessionData && sessionData.blockedSites) {
        const blockedSites = sessionData.blockedSites;
        
        // Prepare domains to unblock
        const domainsToUnblock = [];
        if (blockedSites.facebook) domainsToUnblock.push("facebook.com");
        if (blockedSites.instagram) domainsToUnblock.push("instagram.com");
        if (blockedSites.twitter) domainsToUnblock.push("twitter.com");
        if (blockedSites.youtube) domainsToUnblock.push("youtube.com");
        if (blockedSites.custom && Array.isArray(blockedSites.custom)) {
          blockedSites.custom.forEach((url) => domainsToUnblock.push(url));
        }
        
        // Try to unblock as the page is closing
        if (domainsToUnblock.length > 0) {
          chrome.runtime.sendMessage({ action: "unblock", domains: domainsToUnblock });
        }
      }
    }
  } catch (error) {
    console.error("Error cleaning up blocks on page unload:", error);
  }
}); 