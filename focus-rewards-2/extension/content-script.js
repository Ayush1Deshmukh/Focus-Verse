// Listen for messages from the webpage
window.addEventListener("message", (event) => {
  // Only accept messages from the same frame
  if (event.source !== window) return

  // Check if the message is from our application
  if (event.data && event.data.type === "FOCUS_REWARDS_MESSAGE") {
    console.log("Content script received message:", event.data)

    // Forward the message to the background script
    chrome.runtime.sendMessage(event.data.payload, (response) => {
      // Send the response back to the webpage
      window.postMessage(
        {
          type: "FOCUS_REWARDS_RESPONSE",
          payload: response,
        },
        "*",
      )
    })
  }
})

// Let the page know the extension is installed
window.postMessage(
  {
    type: "FOCUS_REWARDS_RESPONSE",
    payload: { action: "extensionInstalled", success: true },
  },
  "*",
)
