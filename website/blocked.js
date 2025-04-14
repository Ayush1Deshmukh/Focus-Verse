// This script handles the functionality for the blocked.html page
document.addEventListener('DOMContentLoaded', function() {
  // Get the blocked site from the URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const blockedSite = urlParams.get('site');
  
  if (blockedSite) {
    document.getElementById('blocked-site').textContent = blockedSite;
  }

  // Check if this site has a timer
  chrome.runtime.sendMessage({ action: "getBlockedDomains" }, function(response) {
    if (response && response.success && response.domainsWithTimes) {
      // Find this domain in the list
      const domainInfo = response.domainsWithTimes.find(item => 
        item.domain === blockedSite || blockedSite.endsWith('.' + item.domain)
      );
      
      if (domainInfo && domainInfo.endTime) {
        const timerContainer = document.getElementById('timer-container');
        const timerElement = document.getElementById('timer');
        timerContainer.style.display = 'block';
        
        // Update the timer every second
        const timerInterval = setInterval(function() {
          const now = Date.now();
          const timeLeft = domainInfo.endTime - now;
          
          if (timeLeft <= 0) {
            timerElement.textContent = "Unblocked";
            clearInterval(timerInterval);
            // Refresh the page after a short delay
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          } else {
            // Format the time remaining
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            timerElement.textContent = 
              `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }
        }, 1000);
      }
    }
  });
}); 