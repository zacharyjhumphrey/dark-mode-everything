let darkMode = false;  

// FETCH THE VALUE OF DARK MODE AND UPDATE THE POPUP ICON
chrome.storage.local.get(['dmeEnabled'], function({ dmeEnabled }) {
    if (dmeEnabled != undefined) {
        darkMode = dmeEnabled; 
        chrome.browserAction.setIcon({ path: `images/${dmeEnabled ? "on" : "off"}_icon.svg` });
    }
});
  
// WHEN THE USER REQUESTS A NEW PAGE
chrome.runtime.onConnect.addListener(function(port) {
    console.log("BACKGROUND CONNECTED TO PORT");

    // SEND THE CURRENT VALUE OF DARK MODE TO THE CONNECTION (POPUP OR CONTENT)
    port.postMessage({ event: "darkmode-status", data: darkMode });

    // LISTEN FOR CHANGE IN DARKMODE VALUE
    port.onMessage.addListener(function(msg) {
        if (msg.event == "dark-mode-on") {
            darkMode = true;
            chrome.storage.local.set({ dmeEnabled: true });

            // INSERT CSS
            chrome.browserAction.setIcon({ path: "images/on_icon.svg" });

            // FIRE JS
            messageTabs(msg);
        } else if (msg.event == "dark-mode-off") {
            darkMode = false;
            chrome.storage.local.set({ dmeEnabled: false });

            chrome.browserAction.setIcon({ path: "images/off_icon.svg" });
            // REVERT JS
            messageTabs(msg);
        }
    });
});

// SEND MESSAGE TO EACH CONTENT SCRIPT
function messageTabs(msg) {
    chrome.tabs.query({ currentWindow: true }, function(tabs) {
        for (var i=0; i<tabs.length; ++i) {
            console.log('sending message');
            chrome.tabs.sendMessage(tabs[i].id, msg);
        }
    });
}
