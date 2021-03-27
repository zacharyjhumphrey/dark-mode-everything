const $ = require('jquery');
const Color = require('color');
import CSS from '!!raw-loader!./content.css';

const BLACK_WHITE_SATURATION_MINIMUM = 20;
const DARKEN_BACKGROUND = 12.5;
const DARKEN_TEXT = 20;
const DARKEN_BORDER = 20;
const SATURATE_LEVEL = 3;
const DARKEN_BRIGHTER_BACKGROUND = 50;


// // MUTATION OBSERVER --------------------
const htmlElement = document.getElementsByTagName('html')[0];
const mutationConfig = { attributes: true, childList: true, subtree: true };
const observer = createMutationObserver();


// // BACKGROUND SCRIPT CONNECTION ------------------------
let port = chrome.runtime.connect({ name: "background-content" });
port.onMessage.addListener(function({ event, data }) {
    // REQUEST THE CURRENT STATE OF DARK MODE
    if (event == "darkmode-status") {
        if (data) {
            // LOAD CSS ASAP
            document.addEventListener('DOMSubtreeModified', injectCSS, false);

            // WHEN THE DOCUMENT IS LOADED, FIRE THE JS 
            $(document).ready(function() { 
                addDarkMode();
                observer.observe(htmlElement, mutationConfig);
            });
        }
    }
});

// LISTEN FOR CHANGES IN THE STATE OF DARK MODE
chrome.runtime.onMessage.addListener(
    function(message, sender, sendResponse) {
        switch(message.event) {
            case "dark-mode-on":
                injectCSS();
                addDarkMode();
                observer.observe(htmlElement, mutationConfig);
                break;
            case "dark-mode-off": 
                removeCSS();
                removeDarkMode();
                observer.disconnect();    
                break;
        }
    }
);


/* INJECT CSS ------------------------------------------------------
    Injects extension CSS into the page

    Params: 
        none

    returns:
        none
------------------------------------------------------------ */
function injectCSS(){
    if(document.head){
        // @test MAY NEED TO REMOVE/CHANGE THIS LINE BECAUSE THE EVENT LISTENER IS NOT ALWAYS THERE
        document.removeEventListener('DOMSubtreeModified', injectCSS, false);
 
        var style = document.createElement("style");
        style.innerHTML = CSS;
        style.classList.add('dark-mode-css');
        document.head.appendChild(style);
    }
}

/* REMOVE CSS ------------------------------------------------------
    Removes css link from the page

    Params: 
        none

    returns:
        none
------------------------------------------------------------ */
function removeCSS() {
    document.getElementsByClassName('dark-mode-css')[0].remove();
}

/* ADD DARK MODE ------------------------------------------------------
    Starts recursive function that crawls the page
    JS portion of the styling

    Params: 
        none

    returns:
        none
------------------------------------------------------------ */
function addDarkMode() {
    console.log('DARK MODE ON');

    // MAKE ALL OF THE LINKS WHITE
    $('a').addClass('white-link');

    // RECURSE THE PAGE
    recursePage('html', false);
}

/* RECURSE PAGE ------------------------------------------------------
    Crawls an element and calls the same function on its children 

    Params: 
        elem: jQuery identifier
        parentIsDark (bool): whether the parent of the child was already dark before the extension ran

    returns:
        none
------------------------------------------------------------ */
function recursePage(elem, parentIsDark) {
    let $elem = $(elem);
    let children = $elem.children();
    let elemIsDark = isDark(elem) || parentIsDark;

    // IF THIS ELEMENT IS MADE DARK BY THE FILTER
    if (!elemIsDark) {
        // ADJUST THE COLORS TO BE MORE APPEALING
        darkModeElement(elem);
    } 

    // IF THIS ELEMENT IS DIFFERENT FROM IT'S PARENT
    // INVERT THE CHILD TO BECOME DARK
    if (parentIsDark != elemIsDark) {
        // HTML MUST BE INVERTED BY OVERWRITTING THE FILTER THAT THE EXTENSION ADDS BY DEFAULT
        if ($elem.is('html')) {
            $elem.addClass('dme-remove-filter');
        } else {
            $elem.addClass('dark-mode');
        }
    }

    // IF THIS ELEMENT IS A LINK AND WAS TURNED WHITE BY THE EXTENSION
    if (elemIsDark && $elem.hasClass('white-link')) {
        // REVERT THESE CHANGES BACK TO DEFAULTS
        $elem.removeClass('white-link');
    }

    // MOVE ON TO THE CHILDREN OF THE ELEMENT
    children.each((i, child) => {
        recursePage(child, elemIsDark);
    });
}

/* IS DARK ------------------------------------------------------
    Returns whether or not the element's background is dark or not

    Params: 
        jQuery identifier

    returns: (null || boolean)
        null: background is not visible
        boolean: true means the background is dark, false means the background is light
------------------------------------------------------------ */
function isDark(elem) {
    let CSSColor = (' ' + $(elem).css("background-color")).slice(1);
    let color = Color(CSSColor);
    if (color.alpha() == 0) return null;
    return color.isDark();
}


/* DARK MODE ELEMENT ------------------------------------------------------
    Adjusts the colors of an element to be more appealing. 
    By default most websites are soft black on hard white. When this is inverted, it doesn't look good. 
    This function adjusts the lightness of various attributes to be more appealing

    Params: 
        jQuery identifier

    returns: 
        none
------------------------------------------------------------ */
function darkModeElement(elem) {
    // REVERT ELEMENTS WITH BACKGROUND IMAGES
    if ($(elem).css('background-image') != 'none') {
        $(elem).addClass('dark-mode');
        return;
    }

    // INVERT THE FILL OF IMAGES THAT ARE NOT BLACK OR WHITE
    if ($(elem).is('path')) {
        handlePath(elem);
        return;
    }

    // DON'T CHANGE TRANSPARENT ELEMENTS
    if ($(elem).css('background-color') === 'rgba(0, 0, 0, 0)'){
        return;
    }
    
    handleText(elem);
    handleBackground(elem);
    // handleBorder(elem);
    // handleBoxShadow(elem);

    // MAKES BACKGROUNDS DARKER
    function handleBackground(elem) {
        let $elem = $(elem);
        let CSSColor = (' ' + $elem.css("background-color")).slice(1);
        let originalColor = Color(CSSColor);
        let [h, s, l] = originalColor.hsl().color;
        let darkerColor;

        // STORE THE OLD COLOR FOR TURNING OFF DARKMODE
        $elem.addClass("dark-mode-background");
        $elem.data("base-background-color", CSSColor);

        // MAKE THE TEXT DARKER IF IT IS BLACK OR WHITE
        if (s < BLACK_WHITE_SATURATION_MINIMUM) {
            (l-DARKEN_BACKGROUND >= 0) ? l-=DARKEN_BACKGROUND : l=0;
        }
    
        darkerColor = Color.hsl([h, s, l]);
    
        $elem.css("background-color", darkerColor.rgb().toString());
    }

    // MAKES TEXT DARKER
    function handleText(elem) {
        let $elem = $(elem);
        let CSSColor = (' ' + $elem.css("color")).slice(1);;
        let originalColor = Color(CSSColor);
        let [h, s, l] = originalColor.hsl().color;
        let darkerColor;

        // STORE THE OLD COLOR FOR TURNING OFF DARKMODE
        $elem.addClass("dark-mode-text");
        $elem.data("base-color", CSSColor);

        // MAKE THE TEXT DARKER IF IT IS BLACK OR WHITE
        if (s < BLACK_WHITE_SATURATION_MINIMUM) {
            (l-DARKEN_TEXT >= 0) ? l-=DARKEN_TEXT : l=0;
        }
    
        darkerColor = Color.hsl([h, s, l]);
    
        $elem.css("color", darkerColor.rgb().toString());
    }

    // MAKES BORDERS DARKER
    function handleBorder(elem) {
        let $elem = $(elem);
        let CSSColor = (' ' + $elem.css("border-color")).slice(1);;

        // USE REGEX TO PARSE THE DATA FROM CSS COLOR

        // console.log($elem.css("border-color"));
        // let originalColor = Color(CSSColor);
        // let [h, s, l] = originalColor.hsl().color;
        // let darkerColor;

        // // STORE THE OLD COLOR FOR TURNING OFF DARKMODE
        // $elem.addClass("dark-mode-border");
        // $elem.data("base-border-color", CSSColor);

        // // MAKE THE TEXT DARKER IF IT IS BLACK OR WHITE
        // if (s < BLACK_WHITE_SATURATION_MINIMUM) {
        //     (l-DARKEN_BORDER >= 0) ? l-=DARKEN_BORDER : l=0;
        // }
    
        // darkerColor = Color.hsl([h, s, l]);
    
        // $elem.css("border-color", darkerColor.rgb().toString());
    } 

    // MAKES BOX SHADOWS DARKER (might need to invert them)
    function handleBoxShadow(elem) {
        let $elem = $(elem);
        let boxShadow = $(elem).css("box-shadow");

        // DON'T EVALUATE IF THERE IS NO BOX SHADOW
        if (boxShadow.match(/none/)) return;
        // console.log(boxShadow);

        // // UPDATE BOX SHADOW
        // let boxShadow = $(this).css('box-shadow');
        // let boxShadowColor = null;
        // let boxShadowColorObj = null;
        // if (boxShadow != undefined) {
        //     // console.log(boxShadow);
        //     boxShadowColor = boxShadow.match(/^.*(rgba?\([^)]+\)).*/g);
        //     // boxShadow.replace(/^.*(rgba?\([^)]+\)).*$/,'$1');
        //     // boxShadow.match(/(-?\d+px)|(rgb\(.+\))/g)
        //     // match shortest: .*?
        // }
        // if (boxShadowColor != "none") { // boxShadowColor != null && 
        //     // console.log(boxShadow);
        //     // console.log(boxShadowColor);
        //     // boxShadowColorObj = invertColor(Color(boxShadowColor[3]));
        //     // let position = boxShadowColor[0-2].join(" ");
        //     // console.log(boxShadowColorObj.rgb().toString() + position);
        //     // $(this).css("box-shadow", ( + " " + boxShadowColorObj.rgb().toString()))
        // }
    }

    // INVERTS PATHS BACK TO THEIR ORIGINAL STATE IF THEY ARE SATURATED (THEY HAVE COLOR)
    function handlePath(elem) {
        let $elem = $(elem);
        let fill = (' ' + $elem.attr('fill')).slice(1);

        // DON'T INVERT IF FILL IS NONE OR UNDEFINED
        if (fill.match(/none|undefined|currentColor/)) return;

        // DON'T INVERT IF FILL IS UNDEFINED
        if (fill == undefined) return;

        // @FIX LEAVE ELEMENTS WITH VARIABLE CSS ALONE 
        if (fill.substr(0, 3) == "var") return;

        // INVERT IF FILL LEADS TO URL
        if (fill.substr(0, 3) == "url") {
            $elem.addClass('dark-mode');
            return;
        }

        // MAIN CASE: COLOR DEFINED, INVERT IF NOT BLACK OR WHITE
        let fillColor = Color(fill);
        let [fillHue, fillSat, fillLight] = fillColor.hsl().color;

        if (fillSat > BLACK_WHITE_SATURATION_MINIMUM) {
            $elem.addClass('dark-mode');
        }              
    }    
}

/* REMOVE DARK MODE ------------------------------------------------------
    Returns all elements on a page back to the state they were in before the page was styled

    Params: 
        none

    returns: 
        none
------------------------------------------------------------ */
function removeDarkMode() {
    console.log('DARK MODE OFF');

    // REMOVE CLASSES THAT WERE APPLIED BY THE EXTENSION
    $('.white-link').each(function() { $(this).removeClass('white-link') });
    $('.dark-mode').each(function() { $(this).removeClass('dark-mode') });

    // Revert to previous bg color
    $(".dark-mode-background").each(function(elem, i) {
        $(this).css("background-color", $(this).data("base-background-color"));
        $(this).removeClass("dark-mode-background");
    }); 

    // Revert to previous text color
    $(".dark-mode-text").each(function(elem, i) {
        $(this).css("color", $(this).data("base-color"));
        $(this).removeClass("dark-mode-text");
    });
}

/* INVERT COLOR ------------------------------------------------------
    Creates inverted color

    @note: consider adding this function to the open source package

    Params: 
        Color (obj): Color to be inverted

    returns: 
        Color (obj): Inverted color
------------------------------------------------------------ */
function invertColor(color) {
    let [r,g,b] = color.rgb().color;
    return Color.rgb([255-r,255-g,255-b]).alpha(color.alpha()); 
}

/* CREATE MUTATION OBSERVER ------------------------------------------------------
    Creates mutation observer to detect when new elements are added to the page and adjust their colors

    @fix: Current system assumes that elements put on the page are dark. Find a way to change that
    This will probably require importing code from the addDarkMode function

    Params: 
        none

    returns: 
        MutationObserver
------------------------------------------------------------ */
function createMutationObserver() {    
    // Callback function to execute when mutations are observed
    return new MutationObserver(function(mutationsList, observer) {
        // Use traditional 'for loops' for IE 11
        for(const mutation of mutationsList) {
            for (const node of mutation.addedNodes) {
                // IF IT IS AN HTML ELEMENT, DARK MODE THE ELEMENT
                // if (node instanceof HTMLElement) darkModeElement(node);
                try {
                    darkModeElement(node);
                } catch(err) {
                    // console.error(err);
                }
            }
        }
    });
}
