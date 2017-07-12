ym.modules.define('shri2017.imageViewer.EventManager', [
], function (provide) {

    var EVENTS = {
        mousedown: 'start',
        mousemove: 'move',
        mouseup: 'end',

        mousewheel: 'wheel',
        DOMMouseScroll: 'wheel',

        touchstart: 'start',
        touchmove: 'move',
        touchend: 'end',
        touchcancel: 'end',

        pointerdown: 'start',
        pointermove: 'move',
        pointerup: 'end',
        pointercancel: 'end'
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

            if (window.PointerEvent) {
                //pointer Events
                console.log("Pointer events");
                this._pointerListener = this._pointerEventHandler.bind(this);
                this._addEventListeners('pointerdown', this._elem, this._pointerListener);
            } else if (window.TouchEvent) {
                // touch Events
                console.log("Touch events");
                this._touchListener = this._touchEventHandler.bind(this);
                this._addEventListeners('touchstart touchmove touchend touchcancel', this._elem, this._touchListener);
            } 

            if (window.MouseEvent) {
                // mouse
                console.log("Mouse events");
                this._mouseListener = this._mouseEventHandler.bind(this);
                this._addEventListeners('mousedown', this._elem, this._mouseListener);

                // mouse wheel
                this._mouseWheelListener = this._mouseWheelEventHandler.bind(this);
                this._addEventListeners('mousewheel DOMMouseScroll', this._elem, this._mouseWheelListener);
            }
        },

        _teardownListeners: function () {
            this._removeEventListeners('mousedown', this._elem, this._mouseListener);
            this._removeEventListeners('mousemove mouseup', this._elem, this._mouseListener);
            this._removeEventListeners('touchstart touchmove touchend touchcancel', this._elem, this._touchListener);
            this._removeEventListeners('pointerdown pointermove pointerup pointercancel', this._elem, this._pointerListener);
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

        _mouseWheelEventHandler: function(event) {
            // if firefox || ie
            if (!!event == false) event = window.event;
            event.preventDefault();
            var delta = Math.max(-1, Math.min(1, (event.wheelDelta ? event.wheelDelta : event.detail)));
            var elemOffset = this._calculateElementPreset(this._elem);

            var targetPoint = {
                x: event.pageX - elemOffset.x,
                y: event.pageY - elemOffset.y
            };
            
            this._callback({
                type: EVENTS[event.type],
                pointerType: "mouse",
                wheelDelta: delta,
                targetPoint: targetPoint
            });
        },

        _mouseEventHandler: function(event){
            event.preventDefault();

            if (event.type === 'mousedown') {
                this._addEventListeners('mousemove mouseup', document.documentElement, this._mouseListener);
            } else if (event.type === 'mouseup') {
                this._removeEventListeners('mousemove mouseup', document.documentElement, this._mouseListener);
            }

            var elemOffset = this._calculateElementPreset(this._elem);

            this._callback({
                type: EVENTS[event.type],
                pointerType: "mouse",
                targetPoint: {
                    x: event.pageX - elemOffset.x,
                    y: event.pageY - elemOffset.y
                }
            });
        },

        _touchEventHandler: function(event) {
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
                pointerType: "touch",
                targetPoint: targetPoint
            });
        },

        _pointerEventHandler: function(event) {
            // Отменяем стандартное поведение (последующие события мышки)
            event.preventDefault();
            if (event.type === 'pointerdown') {
                document.body.style.touchAction = "none";
                this._addEventListeners('pointermove pointerup', document.documentElement, this._pointerListener);
            } else if (event.type === 'pointerup') {
                document.body.style.touchAction = "auto";
                this._removeEventListeners('pointermove pointerup', document.documentElement, this._pointerListener);
            }

            var elemOffset = this._calculateElementPreset(this._elem);
            
            //
            var targetPoint = {
                x: event.pageX - elemOffset.x,
                y: event.pageY - elemOffset.y
            };

            this._callback({
                type: EVENTS[event.type],
                pointerType: "pointer",
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
