ym.modules.define('shri2017.imageViewer.View', [
    'shri2017.imageViewer.util.imageLoader',
    'view.css'
], function (provide, imageLoader) {
    var View = function (params) {
        this._resetData();
        this._setupDOM(params);
        this.setURL(params.url);
    };

    /**
     * Дефолтные значения
     * @constructor
     */
    function DefaultParams() {
        this.scale = 0;
        this.positionX = 0;
        this.positionY = 0;
        this.set = function(params) {
            this.scale = params.scale;
            this.positionX = params.positionX;
            this.positionY = params.positionY;
        };
        this.get = function() {
            return {
                scale: this.scale,
                positionX: this.positionX,
                positionY: this.positionY
            };
        };
    }
    
    var defaultParams = new DefaultParams();

    Object.assign(View.prototype, {
        setURL: function (url) {
            this._curURL = url;
            if (this._holderElem) {
                imageLoader(url).then(this._onImageLoaded, this);
            }
        },

        getElement: function () {
            return this._holderElem.parentElement;
        },

        getImageSize: function () {
            return {
                width: this._properties.image.width,
                height: this._properties.image.height
            };
        },
        // текущее состояние
        getState: function () {
            // !
            return Object.assign({}, this._state);
        },
        // изменение состояния изображения
        setState: function (state) {
            // !
            // Запрет сдвига изображения за границы
            // Zoom и Drag только в пределах самого изображения
            var scale = state.scale ? (state.scale > defaultParams.get().scale ? state.scale : defaultParams.get().scale) : this._state.scale;
            var x = (state.positionX || 0 - state.pivotPointX || 0);
            var y = (state.positionY || 0 - state.pivotPointY || 0);
            var diffWidth = this.getImageSize().width*scale - this._properties.size.width;
            var diffHeight = this.getImageSize().height*scale - this._properties.size.height;
            var positionX = x > 0 ? 
                            0 :
                            -x > diffWidth ?
                                -diffWidth :
                                x;
            var positionY = y > 0 ?
                            0 :
                            -y > diffHeight ?
                                -diffHeight :
                                y;
            
            state.scale = scale;
            state.positionX = positionX;
            state.positionY = positionY;
            // !

            this._state = Object.assign({}, this._state, state);
            this._setTransform(this._state);
        },

        destroy: function () {
            this._teardownDOM();
            this._resetData();
        },

        _onImageLoaded: function (data) {
            if (this._curURL === data.url) {
                var image = data.image;
                this._properties.image = image;
                // Рассчитываем такой масштаб,
                // чтобы сразу все изображение отобразилось
                var containerSize = this._properties.size;
                var zoom = (image.width > image.height) ?
                    containerSize.width / image.width :
                    containerSize.height / image.height;
                defaultParams.set({
                    positionX: - (image.width * zoom - containerSize.width) / 2,
                    positionY: - (image.height * zoom - containerSize.height) / 2,
                    scale: zoom
                });
                this.setState(defaultParams.get());
            }
        },
        // сброс всех манипуляций с картинкой
        _resetImageManipulation: function() {
            this.setState(defaultParams.get());
        },

        _setTransform: function (state) {
            var ctx = this._holderElem.getContext('2d');
            // Сбрасываем текущую трансформацию холста.
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, this._properties.size.width, this._properties.size.height);
            // Устаналиваем новую
            ctx.translate(state.pivotPointX, state.pivotPointY);
            ctx.scale(state.scale, state.scale);
            ctx.rotate(state.angle);
            // Отрисовываем изображение с учетом текущей "стержневой" точки
            ctx.drawImage(
                this._properties.image,
                (state.positionX - state.pivotPointX) / state.scale,
                (state.positionY - state.pivotPointY) / state.scale
            );
        },

        _setupDOM: function (params) {
            this._properties.size.width = params.size.width;
            this._properties.size.height = params.size.height;

            var containerElem = document.createElement('image-viewer');
            containerElem.className = 'image-viewer__view';
            containerElem.style.width = params.size.width + 'px';
            containerElem.style.height = params.size.height + 'px';

            this._holderElem = document.createElement('canvas');
            this._holderElem.setAttribute('width', params.size.width);
            this._holderElem.setAttribute('height', params.size.height);

            containerElem.appendChild(this._holderElem);
            params.elem.appendChild(containerElem);
        },

        _teardownDOM: function () {
            var containerElem = this._holderElem.parentElement;
            containerElem.parentElement.removeChild(containerElem);
            this._holderElem = null;
            this._curURL = null;
        },

        _resetData: function () {
            this._properties = {
                size: {
                    width: 0,
                    height: 0
                },
                image: {
                    width: 0,
                    height: 0
                }
            };

            this._state = {
                positionX: 0,
                positionY: 0,
                scale: 1,
                angle: 0,
                pivotPointX: 0,
                pivotPointY: 0
            };
        }
    });

    provide(View);
});