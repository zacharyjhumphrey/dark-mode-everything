let darkMode = false;

// WHEN THE USER REQUESTS A NEW PAGE
chrome.runtime.onConnect.addListener(function(port) {
    console.log("Connected to popup");

    // SEND THE CURRENT VALUE OF DARK MODE TO THE CONNECTION (POPUP OR CONTENT)
    port.postMessage({ event: "darkmode-status", data: darkMode });

    // LISTEN FOR CHANGE IN DARKMODE VALUE
    port.onMessage.addListener(function(msg) {
        if (msg.event == "dark-mode-on") {
            darkMode = true;

            // INSERT CSS
            insertDarkMode();

            // FIRE JS
            messageTabs(msg);
        } else if (msg.event == "dark-mode-off") {
            darkMode = false;

            // REMOVE CSS
            removeDarkMode();

            // REVERT JS
            messageTabs(msg);
        }
    });
});

// WHEN THE USER NAVIGATES TO A NEW PAGE
chrome.webNavigation.onCommitted.addListener(details => {
    // IF DARK MODE WAS TURNED ON IN THE POPUP
    if (darkMode) {
        // INSERT CSS INTO THE FILE
        // chrome.tabs.insertCSS(details.tabId, { file: '/content/content.css' });
    }
});

// LISTEN FOR MESSAGES FROM THE CONTENT SCRIPT
// chrome.tabs.onMessage(function() {})

// GIVE DARK MODE ALL EXISTING TABS
function insertDarkMode() {
    chrome.tabs.query({ currentWindow: true }, function(tabs) {
        for (var i=0; i<tabs.length; ++i) {
            // chrome.tabs.insertCSS(tabs[i].id, { file: '/content/content.css' });
        }
    });
}

// REMOVE DARK MODE FROM ALL EXISTING TABS
function removeDarkMode() {
    chrome.tabs.query({ currentWindow: true }, function(tabs) {
        for (var i=0; i<tabs.length; ++i) {
            // chrome.tabs.removeCSS(tabs[i].id, { file: '/content/content.css' });
        }
    });
}

// SEND MESSAGE TO EACH CONTENT SCRIPT
function messageTabs(msg) {
    chrome.tabs.query({ currentWindow: true }, function(tabs) {
        for (var i=0; i<tabs.length; ++i) {
            console.log('sending message');
            chrome.tabs.sendMessage(tabs[i].id, msg);
        }
    });
}
