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
    /** Список Pointer Events */
    var pointers = {};

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
                console.log("Pointer events active");
                this._pointerListener = this._pointerEventHandler.bind(this);
                this._addEventListeners('pointerdown', this._elem, this._pointerListener);
                this._addEventListeners('touchstart touchmove touchend', this._elem, function(event) {
                    // отключаем поведение для Touch Events
                    event.preventDefault();
                });
            } else if (window.TouchEvent) {
                // touch Events
                console.log("Touch events active");
                this._touchListener = this._touchEventHandler.bind(this);
                this._addEventListeners('touchstart touchmove touchend touchcancel', this._elem, this._touchListener);
            } 

            if (window.MouseEvent) {
                // mouse
                console.log("Mouse events active");
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
            // 
            // if firefox || ie
            if (!!event === false) {
                event = window.event;
            }
            event.preventDefault();

            var delta = Math.max(-1, Math.min(1, (event.wheelDelta ? event.wheelDelta : event.detail)));

            var elemOffset = this._calculateElementPreset(this._elem);
            
            this._callback({
                type: EVENTS[event.type],
                pointerType: "mouse",
                wheelDelta: delta,
                targetPoint: {
                    x: event.clientX - elemOffset.x,
                    y: event.clientY - elemOffset.y
                },
                distance: 1
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
                    x: event.clientX - elemOffset.x,
                    y: event.clientY - elemOffset.y
                },
                distance: 1
            });
        },

        _touchEventHandler: function(event) {
            event.preventDefault();

            var touches = event.touches;
            // touchend/touchcancel
            if (touches.length === 0) {
                touches = event.changedTouches;
            }

            var targetPoint;
            var distance = 1;
            var elemOffset = this._calculateElementPreset(this._elem);

            if (touches.length === 1) {
                targetPoint = {
                    x: touches[0].clientX,
                    y: touches[0].clientY
                };
            } else {
                var firstTouch = touches[0];
                var secondTouch = touches[1];
                targetPoint = this._calculateTargetPoint(firstTouch, secondTouch);
                distance = this._calculateDistance(firstTouch, secondTouch);
            }

            targetPoint.x -= elemOffset.x;
            targetPoint.y -= elemOffset.y;

            this._callback({
                type: EVENTS[event.type],
                pointerType: "touch",
                targetPoint: targetPoint,
                distance: distance
            });
        },

        _pointerEventHandler: function(event) {
            event.preventDefault();
            // pointer ID
            var idEvent = event.pointerId;

            if (event.type === 'pointerdown') {
                document.body.style.touchAction = "none";
                pointers[idEvent] = event;
                this._addEventListeners('pointermove pointerup', document.documentElement, this._pointerListener);
            } else if (event.type === 'pointerup' || event.type === 'pointercancel') {
                document.body.style.touchAction = "auto";
                delete pointers[idEvent];
                // если больше не осталось активныйх касаний - снимаем все листенеры
                if (Object.keys(pointers).length === 0) {
                    this._removeEventListeners('pointermove pointerup', document.documentElement, this._pointerListener);
                }
            } else if (event.type === 'pointermove') {
                pointers[idEvent] = event;
            }

            var elemOffset = this._calculateElementPreset(this._elem);
            var targetPoint;
            var distance = 1;
            if (Object.keys(pointers).length === 1) {
                targetPoint = {
                    x: pointers[Object.keys(pointers)[0]].clientX,
                    y: pointers[Object.keys(pointers)[0]].clientY
                };
            } else if (Object.keys(pointers).length > 1) {
                var firstPointer = pointers[Object.keys(pointers)[0]];
                var secondPointer = pointers[Object.keys(pointers)[1]];
                targetPoint = this._calculateTargetPoint(firstPointer, secondPointer);
                distance = this._calculateDistance(firstPointer, secondPointer);
            } else {
                targetPoint = {
                    x: event.clientX,
                    y: event.clientY
                };
            }

            targetPoint.x -= elemOffset.x;
            targetPoint.y -= elemOffset.y;
            
            this._callback({
                type: EVENTS[event.type],
                pointerType: event.pointerType,
                targetPoint: targetPoint,
                distance: distance
            });
        },

        _calculateTargetPoint: function (firstTouch, secondTouch) {
            return {
                x: (secondTouch.clientX + firstTouch.clientX) / 2,
                y: (secondTouch.clientY + firstTouch.clientY) / 2
            };
        },
        /**
         * Рассчитываем дистанцию для мультитача
         * @param {Object} firstTouch
         * @param {Object} secondTouch
         * @returns {number}
         */
        _calculateDistance: function (firstTouch, secondTouch) {
            return Math.sqrt(
                Math.pow(secondTouch.clientX - firstTouch.clientX, 2) +
                Math.pow(secondTouch.clientY - firstTouch.clientY, 2)
            );
        },
        // рассчитываем положение элемента
        _calculateElementPreset: function (elem) {
            // !
            var bounds = elem.getBoundingClientRect();
            return {
                x: bounds.left,
                y: bounds.top
            };
        }
    });

    provide(EventManager);
});
