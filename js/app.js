var APP = APP || {};



$(function(){

    var animateGoose;
    var bpm = 63.9;
    var curr = 0;

    var a = true;
    var r = 60/bpm; // ratio
    var b = 0;     // beat
    var n = r;     // next beat
    var t = r/2    // tier
    animateGoose = function() {

        if (!a) return;

        requestAnimationFrame(animateGoose);
        var time = Math.floor(APP.music.getTime());
        if (n < time) {
            n += r;

            TweenLite.to(APP.goose.settings,t,{
                y: 0.4,
                ease: Power4.easeInOut,
                delay: t
            });
            TweenLite.to(APP.goose.settings,t,{
                y: 0,
                ease: Power1.easeIn,
                delay: 2*t
            });
            TweenLite.to(APP.goose.settings,2*t,{
                x: b % 2 ? -0.4 : 0.4,
                ease: Power1.easeInOut,
                delay: t
            });

            b += 1;
        }
    }

    // Goose Manager
    APP.goose = new APP.Goose({
        debug: true
    });

    // // Sound Manager
    APP.music = new APP.SoundManager({
        src: ['sound/whitechristmas.mp3'],
        autoplay: true,
        onStart: animateGoose,
        onEnd: function(){ a = false }
    });
});