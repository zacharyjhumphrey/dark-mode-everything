import $ from 'jquery';
import Color from 'color';

/*
    TODO: 
        FIND OUT WHY npmjs.com DOESNT WORK
        UNDERSTAND WHY WHITE-LINKS ARENT BEING INVERTED (IT'S WORKING HOW I WANT, BUT IT SHOULDN'T BE)
        ADJUST BOX SHADOWS
        WHEN I SCROLL TO THE BOTTOM OF THE PAGE, THERE IS A WHITE BACK-BACKGROUND, SEE IF I CAN CHANGE THAT TO BLACK
        FIND A WAY TO LOAD JAVASCRIPT IN FIRST, SO THE USER ISN'T BLINDED WHEN THEY VISIT A SITE AT FIRST
        CHANGE THE PRIMARY GOOGLE PAGE TO BE DARK
*/

console.log('showing up');

// Add dark mode to page
$('html').addClass('dark-mode');

// Revert dark mode on images and videos
$('img, video').addClass('dark-mode');

let lightBackgroundElements = $('*').filter(function(i) {
    // DON'T EVALUATE TRANSPARENT ELEMENTS
    if ($(this).css('background-color') === 'rgba(0, 0, 0, 0)'){
        return;
    }
    let oldBgColor = Color($(this).css("background-color"));
    let [hue, saturation, lightness] = oldBgColor.hsl().color;

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

    return this;
});

let darkTextElements = $('*').filter(function(i) {
        let oldColor = Color($(this).css("color"));
        let [hue, saturation, lightness] = oldColor.hsl().color;
    
        /*
            IF THE SATURATION IS FAINT ENOUGH, 
                DECREASE THE LIGHTNESS BY 10 (DONT LET IT GO BELOW 0)
        */
        if (saturation < 20) {
            (lightness-20 >= 0) ? lightness-=20 : lightness=0;
        }
    
        let newColor = Color.hsl([hue, saturation, lightness]);
    
        $(this).css("color", newColor.hex().toString());
    
    return this;
});

$('a').addClass('white-link');
