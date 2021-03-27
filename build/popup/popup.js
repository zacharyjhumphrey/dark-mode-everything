console.log('POPUPJS');

let darkModeCheckbox = document.getElementById('toggle-dark-mode');

// SET UP A CONNECTION TO THE BACKGROUND SCRIPT
let port = chrome.runtime.connect({ name: "background-popup" });
port.onMessage.addListener(function({ event, data }) {
    // REQUEST THE CURRENT STATE OF DARK MODE
    if (event == "darkmode-status") {
        setCheckbox(data);
    }
});

// SET THE VALUE OF THE CHECKBOX ON THE PAGE TO THE VALUE DECLARED IN BACKGROUND
darkModeCheckbox.addEventListener("change", function(e) {
    // DARK MODE ON
    if (e.target.checked) {
        document.getElementsByTagName('html')[0].classList.add('dark-mode-on');
        port.postMessage({ event: "dark-mode-on" });
    } 

    // DARK MODE OFF
    else {
        document.getElementsByTagName('html')[0].classList.remove('dark-mode-on');
        port.postMessage({ event: "dark-mode-off" });
    }
});

// REPRESENT THE VALUE OF DARK MODE
function setCheckbox(value) {
    darkModeCheckbox.checked = value;
    if (value) {
        document.getElementsByTagName('html')[0].classList.add('dark-mode-on');
    } else {
        document.getElementsByTagName('html')[0].classList.remove('dark-mode-on');
    }

    document.getElementsByTagName('html')[0].classList.add('animate-dark-mode');
}
