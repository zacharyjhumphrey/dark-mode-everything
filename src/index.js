const $ = require('jquery');
const Color = require('color');
import CSS from '!!raw-loader!./content.css';

// WHEN THIS SCRIPT RUNS
// REQUEST THE STATUS OF DARK MODE FROM BACKGROUND,
// IF ON, 
    // IMMEDIATELY SET A LISTENER FOR THE CSS
    // WHEN THE DOM IS DONE LOADING, FIRE JS

let port = chrome.runtime.connect({ name: "background-content" });
port.onMessage.addListener(function({ event, data }) {
    // REQUEST THE CURRENT STATE OF DARK MODE
    if (event == "darkmode-status") {
        if (data) {
            // LOAD CSS ASAP
            document.addEventListener('DOMSubtreeModified', injectCSS, false);

            // WHEN THE DOCUMENT IS LOADED, FIRE THE JS 
            $(document).ready(function() { addDarkMode() })
            // addDarkMode();
            // $.ready(function() { console.log('hey i loaded')});
        }
    }
});

// @TEST this may not fire any more, find a better way to fire it
chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        console.log('recieving message');
        switch(message.event) {
            case "dark-mode-on":
                injectCSS();
                addDarkMode();
            case "dark-mode-off": 
                removeDarkMode();
            break;
        }
    }
);

function injectCSS(){
    if(document.head){
        // @test MAY NEED TO REMOVE/CHANGE THIS LINE BECAUSE THE EVENT LISTENER IS NOT ALWAYS THERE
        document.removeEventListener('DOMSubtreeModified', injectCSS, false);
 
        var style = document.createElement("style");
        style.innerHTML = CSS;
        document.head.appendChild(style);
    }
}

function addDarkMode() {1
    console.log('DARK MODE ON');

    $('*').each(function(i) {
        // DON'T CHANGE TRANSPARENT ELEMENTS
        if ($(this).css('background-color') === 'rgba(0, 0, 0, 0)'){
            return;
        }

        // REVERT ELEMENTS WITH BACKGROUND IMAGES
        if ($(this).css('background-image') != 'none') {
            console.log('There is a background image');
            $(this).addClass('dark-mode');
            return;
        }
        
        // GET THE OLD BACKGROUND
        let oldBgColor = Color($(this).css("background-color"));
        let [hue, saturation, lightness] = oldBgColor.hsl().color;

        // STORE THE OLD BACKGROUND FOR TURNING OFF DARKMODE
        $(this).addClass("dark-mode-background");
        $(this).data("base-background-color", oldBgColor);

        /*
            IF THE SATURATION IS FAINT ENOUGH, 
                DECREASE THE LIGHTNESS BY 10 (DONT LET IT GO BELOW 0)
        */
        if (saturation < 20) {
            (saturation-8 >= 0) ? saturation-=8 : saturation=0;
            (lightness-10 >= 0) ? lightness-=10 : lightness=0;
        }

        let newBgColor = Color.hsl([hue, saturation, lightness]);

        $(this).css("background-color", newBgColor.hex().toString());

        // UPDATE BOX SHADOW
        let boxShadow = $(this).css('box-shadow');
        let boxShadowColor = null;
        let boxShadowColorObj = null;
        if (boxShadow != undefined) {
            // console.log(boxShadow);
            boxShadowColor = boxShadow.match(/^.*(rgba?\([^)]+\)).*/g);
            // boxShadow.replace(/^.*(rgba?\([^)]+\)).*$/,'$1');
            // boxShadow.match(/(-?\d+px)|(rgb\(.+\))/g)
            // match shortest: .*?
        }
        if (boxShadowColor != "none") { // boxShadowColor != null && 
            // console.log(boxShadow);
            // console.log(boxShadowColor);
            // boxShadowColorObj = invertColor(Color(boxShadowColor[3]));
            // let position = boxShadowColor[0-2].join(" ");
            // console.log(boxShadowColorObj.rgb().toString() + position);
            // $(this).css("box-shadow", ( + " " + boxShadowColorObj.rgb().toString()))
        }
    });

    $('*').each(function(i) {
        let oldColor = Color($(this).css("color"));
        let [hue, saturation, lightness] = oldColor.hsl().color;
    
        // STORE THE OLD COLOR FOR TURNING OFF DARKMODE
        $(this).addClass("dark-mode-text");
        $(this).data("base-color", oldColor);

        /*
            IF THE SATURATION IS FAINT ENOUGH, 
                DECREASE THE LIGHTNESS BY 10 (DONT LET IT GO BELOW 0)
        */
        if (saturation < 20) {
            (lightness-20 >= 0) ? lightness-=20 : lightness=0;
        }
    
        let newColor = Color.hsl([hue, saturation, lightness]);
    
        $(this).css("color", newColor.hex().toString());
    });
}

function removeDarkMode() {
    console.log('DARK MODE OFF');

    // Revert to previous bg color
    $(".dark-mode-background").each(function(elem, i) {
        $(elem).css("background-color", $(elem).data("base-background-color"));
        $(elem).removeClass("dark-mode-background");
    });

    // Revert to previous text color
    $(".dark-mode-text").each(function(elem, i) {
        $(elem).css("background-color", $(elem).data("base-color"));
        $(elem).removeClass("dark-mode-text");
    });
}

function invertColor(color) {
    let [r,g,b] = color.rgb().color;
    return Color.rgb([255-r,255-g,255-b]).alpha(color.alpha()); 
}