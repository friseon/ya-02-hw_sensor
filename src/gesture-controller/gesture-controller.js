ym.modules.define('shri2017.imageViewer.GestureController', [
    'shri2017.imageViewer.EventManager'
], function (provide, EventManager) {

    var DBL_TAB_STEP = 0.2;

    var Controller = function (view) {
        this._view = view;
        this._eventManager = new EventManager(
            this._view.getElement(),
            this._eventHandler.bind(this)
        );
        this._lastEventTypes = '';
        this._gestures = {
            dblClick: false,
            drag: false,
            whellZoom: false,
            oneTouchZoom: false,
            multiTouchZoom: false
        };
    };
    /**
     * Коэффициент для зума колесиком мыши
     */
    var SCALE_WHEEL_COEF = 200;
    /**
     * Коэффициент для зума тачем
     */
    var SCALE_TOUCH_COEF = 1000;
    /**
     * Минимальная дистанция, чтобы зафиксировать движение
     */
    var MIN_DISTANCE_FOR_MOVE = 30;
    /**
     * Вычисление расстояния между двумя точками
     * @param {x, y} A - координаты первой точки
     * @param {x, y} B - координаты второй точки
     */
    var distanceTwoPoints = function(A, B) {
        if (A && B)
            return Math.sqrt(Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2));
        else {
            return 0;
        }
    };

    Object.assign(Controller.prototype, {
        destroy: function () {
            this._eventManager.destroy();
        },
        /**
         * Сброс всех флагов жестов
         */
        _resetGestures: function() {
            for (var gesture in this._gestures) {
                this._gestures[gesture] = false;
            }
        },

        _eventHandler: function (event) {
            var state = this._view.getState();

            if (!this._lastEventTypes ) {
                setTimeout(function () {
                    this._lastEventTypes = '';
                }.bind(this), 700);
            }
            
            if (event.type === "move" && distanceTwoPoints(event.targetPoint, this._initEvent.targetPoint) > MIN_DISTANCE_FOR_MOVE) {
                this._lastEventTypes += ' ' + event.type;
            } else if (event.type !== "move") {
                this._lastEventTypes += ' ' + event.type;
            }

            console.log(event.pointerType + " (" + event.type + "): " + this._lastEventTypes);
            /**
             * DblClick
             * -> по двойному клику возврат к изначальным настройкам
             */
            if (this._lastEventTypes.indexOf('start end start end') > -1) {
                this._resetGestures();
                this._gestures.dblClick = true;
                this._lastEventTypes = '';
                this._processDbltab(event);
                // ->
                // this._view._resetImageManipulation();
                return;
            }
            /** One finger zoom (not mouse!) */
            if (this._lastEventTypes.indexOf('start end start') > -1 && event.pointerType !== 'mouse') {
                this._resetGestures();
                this._gestures.oneTouchZoom = true;
            }
            /** Multitouch zoom */
            if (event.distance > 1 && event.distance !== this._initEvent.distance) {
                this._resetGestures();
                this._gestures.multiTouchZoom = true;
            }
            /** Move event */
            if (event.type === 'move') {
                if (this._gestures.oneTouchZoom === true) {
                    this._oneTouchZoom(event);
                    return;
                }
                if (this._gestures.multiTouchZoom === true) {
                    this._processMultitouch(event);
                    return;
                }
                this._processDrag(event);
                return;
            } else {
                // по событиям start || end
                // получаем текущее положение
                this._initState = this._view.getState();
                // откуда div рассчитывается
                // конечная точка
                this._initEvent = event;
            }
            /** Mouse wheel */
            if (event.type === 'wheel' && event.pointerType === 'mouse') {
                this._wheelZoom(event);
                return;
            }
            /** Сброс флагов жестов, если пришел тип end */
            if (event.type === 'end') {
                this._resetGestures();
                return;
            }
        },
        /**
         * Wheel zoom
         */
        _wheelZoom: function(event) {
            if (event.wheelDelta) {
                var state = this._view.getState();
                this._scale(
                    event.targetPoint,
                    this._initState.scale + event.wheelDelta/SCALE_WHEEL_COEF
                );
            }
        },
        /**
         * One finger zoom
         */
        _oneTouchZoom: function(event) {
            var scaleDiff = (event.targetPoint.y - this._initEvent.targetPoint.y)/SCALE_TOUCH_COEF;
            var state = this._view.getState();
            this._scale(
                event.targetPoint,
                this._initState.scale + scaleDiff
            );
        },
        /**
         * Drag
         */
        _processDrag: function(event) {
            this._view.setState({
                positionX: this._initState.positionX + (event.targetPoint.x - this._initEvent.targetPoint.x),
                positionY: this._initState.positionY + (event.targetPoint.y - this._initEvent.targetPoint.y)
            });
        },
        /**
         * Multitouch zoom
         */
        _processMultitouch: function (event) {
            this._scale(
                event.targetPoint,
                this._initState.scale * (event.distance / this._initEvent.distance)
            );
        },
        /**
         * Double tap
         */
        _processDbltab: function (event) {
            var state = this._view.getState();
            this._scale(
                event.targetPoint,
                state.scale + DBL_TAB_STEP
            );
        },
        /**
         * Scale calculation
         */
        _scale: function (targetPoint, newScale) {
            var imageSize = this._view.getImageSize();
            var state = this._view.getState();
            // Позиция прикосновения на изображении на текущем уровне масштаба
            var originX = targetPoint.x - state.positionX;
            var originY = targetPoint.y - state.positionY;
            // Размер изображения на текущем уровне масштаба
            var currentImageWidth = imageSize.width * state.scale;
            var currentImageHeight = imageSize.height * state.scale;
            // Относительное положение прикосновения на изображении
            var mx = originX / currentImageWidth;
            var my = originY / currentImageHeight;
            // Размер изображения с учетом нового уровня масштаба
            var newImageWidth = imageSize.width * newScale;
            var newImageHeight = imageSize.height * newScale;
            // Рассчитываем новую позицию с учетом уровня масштаба
            // и относительного положения прикосновения
            state.positionX += originX - (newImageWidth * mx);
            state.positionY += originY - (newImageHeight * my);
            // Устанавливаем текущее положение мышки как "стержневое"
            state.pivotPointX = targetPoint.x;
            state.pivotPointY = targetPoint.y;
            // Устанавливаем масштаб и угол наклона
            state.scale = newScale;
            this._view.setState(state);
        }
    });

    provide(Controller);
});
