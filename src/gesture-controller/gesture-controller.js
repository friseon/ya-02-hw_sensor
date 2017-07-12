ym.modules.define('shri2017.imageViewer.GestureController', [
    'shri2017.imageViewer.EventManager'
], function (provide, EventManager) {

    var Controller = function (view) {
        this._view = view;
        this._eventManager = new EventManager(
            this._view.getElement(),
            this._eventHandler.bind(this)
        );
        this._lastEventTypes = '';
    };

    Object.assign(Controller.prototype, {
        destroy: function () {
            this._eventManager.destroy();
        },

        _eventHandler: function (event) {
            var state = this._view.getState();

            this._lastEventTypes += ' ' + event.type;

            console.log(event.pointerType + " (" + event.type + "): " + this._lastEventTypes);
            // условия сброса // dblclick // новый жест - сброс
            if (!this._lastEventTypes ) {
                setTimeout(function () {
                    this._lastEventTypes = '';
                }.bind(this), 700);
            }

            //dblclick
            if (this._lastEventTypes.indexOf('start end start end') > -1) {
                this._lastEventTypes = '';
                this._view._resetImageManipulation();
                return;
            } else if (this._lastEventTypes.indexOf('move end') > -1) {
                // когда заканчивает движение и отпускаем (например, однопальцевый зум)
                this._lastEventTypes = '';
                return;
            }

            if (this._lastEventTypes.indexOf('start end start move') > -1 && event.pointerType !== 'mouse') {
                // one finger zoom
                this._oneTouchZoom(event);
            } else if (event.type === 'move') {
                // drag
                this._processDrag(event);
            } else {
                // получаем текущее положение
                this._initState = this._view.getState();
                // откуда div рассчитывается
                // конечная точка
                this._initEvent = event;
            }

            if (event.pointerType === 'mouse' && event.type === "wheel") {
                this._wheelZoom(event);
            }
        },
        // зум колесиком мышки
        _wheelZoom: function(event) {
            console.log(event.targetPoint.x)
            if (event.wheelDelta) {
                this._view.setState({
                    scale: this._initState.scale + event.wheelDelta/500,
                    positionX: this._initState.positionX - (event.targetPoint.x)*event.wheelDelta/50,
                    positionY: this._initState.positionY - (event.targetPoint.y)*event.wheelDelta/50
                });
            }
        },
        // зум жестом
        _oneTouchZoom: function(event) {
            this._view.setState({
                scale: this._initState.scale + (event.targetPoint.y - this._initEvent.targetPoint.y)/500,
            });
        },

        _processDrag: function(event) {
            this._view.setState({
                positionX: this._initState.positionX + (event.targetPoint.x - this._initEvent.targetPoint.x),
                positionY: this._initState.positionY + (event.targetPoint.y - this._initEvent.targetPoint.y)
            });
        }
    });

    provide(Controller);
});
