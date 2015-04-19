/**
 * Created by samfisher on 18/04/15.
 */
var utils = {
    clamp: function (value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    pointInRect: function (x, y, rect) {
        return utils.inRange(x, rect.x, rect.x + rect.width) &&
            utils.inRange(y, rect.y, rect.y + rect.height);
    },

    inRange: function (value, min, max) {
        return value >= Math.min(min, max) && value <= Math.max(min, max);
    }
};

var Range = (function ($) {

    var MouseEvent = {
        'MOUSE_DOWN': 'mousedown',
        'MOUSE_UP': 'mouseup',
        'MOUSE_MOVE': 'mousemove',
        'SELECT_START': 'selectstart'
    };


    var ui = {
        track: $('.range .track'),
        thumb: $('.range .thumb'),
        target: $('.target')
    };

    var rect = ui.track.position();
    rect.x = rect.left;
    rect.y = rect.top;
    rect.width = ui.track.width();
    rect.height = ui.track.height();

    var rectTarget = ui.target.position();
    rectTarget.x = rectTarget.left;
    rectTarget.y = rectTarget.top;
    rectTarget.width = ui.target.width();
    rectTarget.height = ui.target.height();



    var options = {
        maxValue: 2,
        minValue: 1,
        endPoint1 : rect.left,
        endPoint2 : rect.width - ui.thumb.width()
    };

    var offsetX;

    ui.thumb.on(MouseEvent.MOUSE_DOWN, onMouseDown);
    $(document).on(MouseEvent.SELECT_START, onCancelDocSelection);

    function onCancelDocSelection(event) {
        event.preventDefault && event.preventDefault();
        event.stopPropagation && event.stopPropagation();
        event.returnValue = false;
        return false;
    }

    function onMouseDown(event) {
        event.preventDefault();
        offsetX = event.clientX - ui.thumb.position().left;
        $(document).on(MouseEvent.MOUSE_MOVE, onMouseMove);
        $(document).on(MouseEvent.MOUSE_UP, onMouseUp);
    }

    function onMouseUp(event) {
        $(document).off(MouseEvent.MOUSE_MOVE);
        $(document).off(MouseEvent.MOUSE_UP);
    }

    function onMouseMove(event) {
        var mouse = {
            x: event.clientX || event.pageX,
            y: event.clientY || event.pageY
        };

        var intrinsicProportion = ( options.maxValue - options.minValue ) / ( options.endPoint2 - options.endPoint1);
        var thisPoint = (mouse.x - offsetX);
        var value = (thisPoint - options.endPoint1) * intrinsicProportion + options.minValue;

        var newWidth = value * rectTarget.width;
        var newH =  newHeight(rectTarget.width,rectTarget.height,newWidth);


        var left = utils.clamp(thisPoint, options.endPoint1, options.endPoint2);


        if (utils.pointInRect(mouse.x, mouse.y, rect)) {
            ui.thumb.css({'left': left});
            ui.target.css({
                'width': newWidth,
                'height' : newH
            });
        }
    }


    function newHeight ( originalWidth , originalHeight, newWidth ) {
        return newWidth * originalHeight / originalWidth;
    }


})(jQuery);