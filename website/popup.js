document.addEventListener('DOMContentLoaded', function() {
  const addButton = document.getElementById('add-button');
  const websiteInput = document.getElementById('website-input');
  const blockedList = document.getElementById('blocked-list');
  
  // Load blocked websites when popup opens
  loadBlockedWebsites();
  
  // Add event listener to the add button
  addButton.addEventListener('click', function() {
    addWebsite();
  });
  
  // Add event listener for Enter key on input
  websiteInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addWebsite();
    }
  });
  
  // Function to add a website to the blocked list
  function addWebsite() {
    const website = websiteInput.value.trim();
    
    if (website === '') {
      return;
    }
    
    // Format the website (remove http://, https://, www. prefixes)
    let formattedWebsite = website.toLowerCase();
    formattedWebsite = formattedWebsite.replace(/^https?:\/\//, '');
    formattedWebsite = formattedWebsite.replace(/^www\./, '');
    
    // Add the website to the list via a message to the background script
    chrome.runtime.sendMessage({
      action: "block",
      domains: [formattedWebsite]
    }, function(response) {
      if (response && response.success) {
        // Clear the input
        websiteInput.value = '';
        
        // Reload the list
        loadBlockedWebsites();
      } else {
        alert('Failed to block the website. Please try again.');
      }
    });
  }
  
  // Function to load the blocked websites
  function loadBlockedWebsites() {
    chrome.runtime.sendMessage({ action: "getBlockedDomains" }, function(response) {
      if (response && response.success) {
        const blockedDomains = response.domains || [];
        const domainsWithTimes = response.domainsWithTimes || [];
        
        // Clear the current list
        blockedList.innerHTML = '';
        
        // Add each website to the list
        domainsWithTimes.forEach(function(item) {
          const li = document.createElement('li');
          li.className = 'list-item';
          
          const websiteText = document.createElement('span');
          
          // If there's an end time, show the remaining time
          if (item.endTime) {
            const now = Date.now();
            const timeLeft = item.endTime - now;
            
            if (timeLeft > 0) {
              // Format the time remaining
              const minutes = Math.floor(timeLeft / (1000 * 60));
              const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
              websiteText.innerHTML = `${item.domain} <small>(${minutes}m ${seconds}s remaining)</small>`;
            } else {
              websiteText.textContent = item.domain;
            }
          } else {
            websiteText.textContent = item.domain;
          }
          
          const removeButton = document.createElement('button');
          removeButton.className = 'remove-btn';
          removeButton.textContent = 'Remove';
          removeButton.addEventListener('click', function() {
            removeWebsite(item.domain);
          });
          
          li.appendChild(websiteText);
          li.appendChild(removeButton);
          blockedList.appendChild(li);
        });
        
        // If no websites are blocked, show a message
        if (domainsWithTimes.length === 0) {
          const li = document.createElement('li');
          li.textContent = 'No websites are currently blocked.';
          blockedList.appendChild(li);
        }
      }
    });
  }
  
  // Function to remove a website from the blocked list
  function removeWebsite(website) {
    chrome.runtime.sendMessage({
      action: "unblock",
      domains: [website]
    }, function(response) {
      if (response && response.success) {
        // Reload the list
        loadBlockedWebsites();
      } else {
        alert('Failed to unblock the website. Please try again.');
      }
    });
  }
}); 