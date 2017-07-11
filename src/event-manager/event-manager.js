ym.modules.define('shri2017.imageViewer.EventManager', [
], function (provide) {

    var EVENTS = {
        mousedown: 'start',
        mousemove: 'move',
        mouseup: 'end',

        mousewheelforward: 'wheelforward',
        mousewheel: 'wheel',

        touchstart: 'start',
        touchmove: 'move',
        touchend: 'end',
        touchcancel: 'end'
    };

    function EventManager(elem, callback) {
        this._elem = elem;
        this._callback = callback;
        this._setupListeners();
    }

    Object.assign(EventManager.prototype, {
        destroy: function () {
            this._teardownListeners();
        },

        _setupListeners: function () {
            // mouse
            this._mouseListener = this._mouseEventHandler.bind(this);
            this._addEventListeners('mousedown', this._elem, this._mouseListener);

            // mouse wheel
            this._mouseWheelListener = this._mouseWheelEventHandler.bind(this);
            this._addEventListeners('mousewheel', this._elem, this._mouseWheelListener);

            //touch
            this._touchListener = this._mouseEventHandler.bind(this);
            this._addEventListeners('touchstart touchmove touchend touchcancel', this._elem, this._touchHandler);
        },

        _teardownListeners: function () {
            this._removeEventListeners('mousedown', this._elem, this._mouseListener);
            this._removeEventListeners('mouseve mouseup', this._elem, this._mouseListener);
            this._removeEventListeners('touchstart touchmove touchend touchcancel', this._elem, this._touchListener);
        },

        _addEventListeners: function (types, elem, callback) {
            types.split(' ').forEach(function (type) {
                elem.addEventListener(type, callback);
            }, this);
        },

        _removeEventListeners: function (types, elem, callback) {
            types.split(' ').forEach(function (type) {
                elem.removeEventListener(type, callback);
            }, this);
        },

        _mouseWheelEventHandler: function() {
            var delta = Math.max(-1, Math.min(1, (event.wheelDelta)));
            
            this._callback({
                type: EVENTS[event.type],
                wheelDelta: delta
            });
        },

        _mouseEventHandler: function(){
            event.preventDefault();

            if (event.type === 'mousedown') {
                this._addEventListeners('mousemove mouseup', document.documentElement, this._mouseListener);
            } else if (event.type === 'mouseup') {
                this._removeEventListeners('mousemove mouseup', document.documentElement, this._mouseListener);
            }

            var elemOffset = this._calculateElementPreset(this._elem);

            this._callback({
                type: EVENTS[event.type],
                targetPoint: {
                    x: event.pageX - elemOffset.x,
                    y: event.pageY - elemOffset.y
                }
            });
        },

        _touchHandler: function(event) {
            // Отменяем стандартное поведение (последующие события мышки)
            event.preventDefault();

            var touches = event.touches;
            // touchend/touchcancel
            if (touches.length === 0) {
                touches = event.changedTouches;
            }

            var elemOffset = this._calculateElementPreset(this._elem);
            
            //
            var targetPoint = {
                x: touches[0].pageX - elemOffset.x,
                y: touches[0].pageY - elemOffset.y
            };

            this._callback({
                type: EVENTS[event.type],
                targetPoint: targetPoint
            });
        },
        // рассчитываем положение элемента
        _calculateElementPreset: function (elem) {
            // !
            var result = {
                x: 0,
                y: 0
            };
            while (elem) {
                result.x += elem.offsetLeft;
                result.y += elem.offsetTop;
                elem = elem.offsetParent;
            }
            return result;
        }
    });

    provide(EventManager);
});
