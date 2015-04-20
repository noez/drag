/**
 * Created by samfisher on 19/04/15.
 */
!window.addEventListener && (function (WindowPrototype, DocumentPrototype, ElementPrototype, addEventListener, removeEventListener, dispatchEvent, registry) {
  WindowPrototype[addEventListener] = DocumentPrototype[addEventListener] = ElementPrototype[addEventListener] = function (type, listener) {
    var target = this;

    registry.unshift([target, type, listener, function (event) {
      event.currentTarget = target;
      event.preventDefault = function () { event.returnValue = false };
      event.stopPropagation = function () { event.cancelBubble = true };
      event.target = event.srcElement || target;

      listener.call(target, event);
    }]);

    this.attachEvent("on" + type, registry[0][3]);
  };

  WindowPrototype[removeEventListener] = DocumentPrototype[removeEventListener] = ElementPrototype[removeEventListener] = function (type, listener) {
    for (var index = 0, register; register = registry[index]; ++index) {
      if (register[0] == this && register[1] == type && register[2] == listener) {
        return this.detachEvent("on" + type, registry.splice(index, 1)[0][3]);
      }
    }
  };

  WindowPrototype[dispatchEvent] = DocumentPrototype[dispatchEvent] = ElementPrototype[dispatchEvent] = function (eventObject) {
    return this.fireEvent("on" + eventObject.type, eventObject);
  };
})(Window.prototype, HTMLDocument.prototype, Element.prototype, "addEventListener", "removeEventListener", "dispatchEvent", []);


var Range = (function () {
  var
      touchEvents = ('ontouchstart' in window),
      dragClass = 'drag',
      events = (touchEvents ? {
        start: 'touchstart',
        move: 'touchmove',
        end: 'touchend'
      } : {
        start: 'mousedown',
        move: 'mousemove',
        end: 'mouseup'
      }
      ),
      options = {},
      ui = {},
      step = 1,
      range = {},
      bound = {},
      offsetX,
      parseOptions = function (opts) {
        options = opts || {};
        options.ui = opts.ui;
        range.min = opts.range[0];
        range.max = opts.range[1];
        options.step = opts.step;

        return options;
      },
      getPos = function (elem, from) {
        var pos = parseFloat(getStyle(elem, from));
        return (isNaN(pos) ? 0 : pos);
      },
      getStyle = function (elem, prop) {
        if (elem.currentStyle) {
          return elem.currentStyle[prop];
        } else if (window.getComputedStyle) {
          return document.defaultView.getComputedStyle(elem, null).getPropertyValue(prop);
        } else if (elem.style) {
          return elem.style[prop];
        }
      },
      getOffset = function (elem) {
        var x = 0,
            y = 0;

        if (elem.offsetParent) {
          do {
            x += elem.offsetLeft;
            y += elem.offsetTop;
          } while (elem = elem.offsetParent);
        }

        return {x: x, y: y};
      },
      stopEvent = function (evt) {
        if (evt.preventDefault) {
          evt.preventDefault();
        }
        if (evt.stopPropagation) {
          evt.stopPropagation();
        }

        evt.returnValue = false;
        return false;
      },
      cnRegexes = {},
      removeClass = function (elem, cn) {
        if (!cnRegexes[cn]) {
          cnRegexes[cn] = new RegExp('(^|\\s)+' + cn + '(\\s|$)+');
        }
        elem.className = elem.className.replace(cnRegexes[cn], ' ');
      },
      addClass = function (elem, cn) {
        removeClass(elem, cn);
        elem.className += ' ' + cn;
      },

      isObject = function (value) {
        return !!(value && typeof value === 'object');
      },

      getEventTarget = function (evt) {
        var target;
        if (evt.target) {
          target = evt.target;
        } else if (evt.srcElement) {
          target = evt.srcElement;
        }
        if (target.nodeType === 3) {
          target = target.parentNode;
        }
        return target;
      },

      getElementRect = function (elem) {
        return  {
          left :getPos(elem,'left'),
          top: getPos(elem,'top'),
          right: getPos(elem,'right'),
          bottom: getPos(elem,'bottom'),

          width : elem.offsetWidth || elem.clientWidth,
          height : elem.offsetHeight || elem.clientHeight,

          x : this.left,
          y : this.top
        };
      },
      clamp = function (value, min, max) {
        return Math.min(Math.max(value, min), max);
      },
      pointInRect = function (x, y, rect) {
        return utils.inRange(x, rect.x, rect.x + rect.width) &&
            utils.inRange(y, rect.y, rect.y + rect.height);
      },

      inRange = function (value, min, max) {
        return value >= Math.min(min, max) && value <= Math.max(min, max);
      };

  function getPosition(evt) {
    var posX = 0,
        posY = 0;
    if (evt.targetTouches) {
      posX = evt.targetTouches[0].pageX;
      posY = evt.targetTouches[0].pageY;
    } else if (evt.pageX || evt.pageY) {
      posX = evt.pageX;
      posY = evt.pageY;
    } else if (evt.clientX || evt.clientY) {
      posX = evt.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      posY = evt.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }

    return {x: posX, y: posY};
  }

  function create(opts) {
    parseOptions(opts);
    cacheElements();
    bindEvents();
  }

  function cacheElements () {
    ui.track = document.getElementById(options.ui.track);
    ui.thumb = document.getElementById(options.ui.thumb);
    ui.btnPlus = document.getElementById(options.ui.btnPlus);
    ui.btnSubstract = document.getElementById(options.ui.btnSubtract);

    bound = {
      min : getElementRect(ui.track).left,
      max : getElementRect(ui.track).width - getElementRect(ui.thumb).width
    };
  }

  function bindEvents() {
    ui.btnPlus.addEventListener('click', function (evt) {
      stopEvent(evt);
      step += options.step;
      step = clamp(step,range.min, range.max);
      updatePosition();
    });

    ui.btnSubstract.addEventListener('click', function (evt) {
      stopEvent(evt);
      step -= options.step;
      step = clamp(step,range.min, range.max);
      updatePosition();
    });

    ui.thumb.addEventListener(events.start, onStart);
  }

  function onStart(evt) {
    stopEvent(evt);
    offsetX = evt.clientX - getOffset(ui.thumb).x;

    document.addEventListener(events.move, onMove);
    document.addEventListener(events.end, onEnd);
  }

  function onMove(evt) {
    var position = getPosition(evt),
        ratio = (range.max - range.min) / (bound.max - bound.min),
        thisPoint = position.x - offsetX,
        left = clamp(thisPoint, bound.min, bound.max);

   ui.thumb.style['left'] = left + 'px';

    console.log(offsetX + ' ' + position.x + ' ' + thisPoint);
  }

  function onEnd(evt) {
    document.removeEventListener(events.move,onMove);
    document.removeEventListener(events.end,onEnd);
  }

  function updatePosition () {
    var amout = step * (bound.max / range.max);
    amout = clamp(amout,bound.min, bound.max);

    ui.thumb.style['left'] = amout + 'px';
  }

  return {
    create: create
  }

})();

Range.create({
  ui: {
    'thumb': 'thumb',
    'track' : 'track',
    'btnPlus' : 'btn-plus',
    'btnSubtract' : 'btn-substract'
  },
  range: [0, 10],
  step: 1
});