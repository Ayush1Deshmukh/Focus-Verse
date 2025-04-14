document.addEventListener("DOMContentLoaded", () => {
  const statusDiv = document.getElementById("status")
  const statusText = document.getElementById("statusText")
  const sitesList = document.getElementById("sitesList")
  const clearAllBtn = document.getElementById("clearAllBtn")
  const openAppLink = document.getElementById("openApp")

  // Get the current list of blocked domains
  chrome.runtime.sendMessage({ action: "getBlockedDomains" }, (response) => {
    if (response && response.success) {
      const domains = response.domains

      if (domains.length > 0) {
        // Update status
        statusDiv.className = "status active"
        statusText.textContent = `${domains.length} site(s) currently blocked`

        // Update sites list
        sitesList.innerHTML = ""
        domains.forEach((domain) => {
          const li = document.createElement("li")
          li.textContent = domain
          sitesList.appendChild(li)
        })
      } else {
        // No sites blocked
        statusDiv.className = "status inactive"
        statusText.textContent = "No sites currently blocked"
        sitesList.innerHTML = "<li>No sites blocked</li>"
      }
    }
  })

  // Handle clear all button
  clearAllBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "unblock" }, (response) => {
      if (response && response.success) {
        // Update UI
        statusDiv.className = "status inactive"
        statusText.textContent = "No sites currently blocked"
        sitesList.innerHTML = "<li>No sites blocked</li>"
      }
    })
  })

  // Open the app
  openAppLink.addEventListener("click", (e) => {
    e.preventDefault()
    chrome.tabs.create({ url: "https://focus-rewards.vercel.app" })
  })
})
