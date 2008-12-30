/***********************************************************
 * RatingStars version 1.1.0
 *
 * (c) 2006 Lyo Kato <lyo.kato@gmail.com>
 *
 * RatingStars is freely distributable under
 * the terms of MIT-style license.
/***********************************************************/

var RatingStars = {
  Version: '1.1.0',
  create: function(options) {
    return new RatingStars.Container(options);
  }
};

RatingStars.Container = function (options) {
  options = options || {};
  var imageTypes = [
    'ratedStarImage',
    'unratedStarImage',
    'halfRatedStarImage',
    'userRatedStarImage'
  ];
  for (var i = 0; i < imageTypes.length; i++) {
    var imageType = imageTypes[i];
    var imageSrc  = options[imageType];
    if (imageSrc) {
      var img = new Image();
      img.src = imageSrc;
      options[imageType] = img;
    }
  }
  this.options = {
    ratedStarImage:     null,
    unratedStarImage:   null,
    halfRatedStarImage: null,
    userRatedStarImage: null,
    freezeOnClick:      true,
    maxRate:            5,
    userRate:           0,
    currentRate:        0
  };
  for (var prop in options)
    this.options[prop] = options[prop];
  this.checkEssentialOptions();
  this.element = null;
  this.stars   = [];
  this.images  = [];
  this.callbacks = {
    onClick:   [],
    onChange:  [],
    onDefault: []
  };
}
RatingStars.Container.prototype.setCurrentRate = function (rate) {
  this.options.currentRate = rate;
}

RatingStars.Container.prototype.getCurrentRate = function () {
  var rate = Math.floor(this.options.currentRate);
  if (this.options.harfRatedStarImage && (this.options.currentRate - rate >= 0.5))
    rate += 0.5;
  return rate;
}

RatingStars.Container.prototype.checkEssentialOptions = function () {
  if (!this.options.ratedStarImage)
    throw "set ratedStarImage.";
  if (!this.options.unratedStarImage)
    throw "set unratedStarImage.";
}

RatingStars.Container.prototype.setElement = function (element) {
  this.element = document.getElementById(element);
}

RatingStars.Container.prototype.getElement = function () {
  return this.element;
}

RatingStars.Container.prototype.setup = function (element) {
  if (element) this.setElement(element);
  try {
    this.checkEssentialOptions();
  } catch (e) {
    this.getElement().innerHTML = e;
    return;
  }
  var rating = this;
  for (var i = 1; i <= this.options.maxRate; i++) {
    (function(){
      var rate = i;
      var span = document.createElement('span');
      try { span.style.cursor = 'pointer' } catch (e) {
        try { span.style.cursor = 'hand' } catch (e) {}
      }
      var imgElement = document.createElement('img');
      imgElement.setAttribute('src', rating.options.unratedStarImage);
      imgElement.setAttribute('border', 0);
      rating.images.push(imgElement);
      span.appendChild(imgElement);
      span.onclick     = function () { rating.register(); return false; };
      span.onmouseover = function () { rating.changeRate(rate, true);   };
      span.onmouseout  = function () { if (rating.options.userRate == rate) rating.setDefaultRate(); };
      rating.stars.push(span);
    })();
  }
  element = this.getElement();
  for (var j = 0; j < this.stars.length; j++)
    element.appendChild(this.stars[j]);
  this.setDefaultRate();
}

RatingStars.Container.prototype.registerCallback = function (type, callback) {
  var callbacks = this.callbacks[type];
  if (!callbacks)
    throw "Unknown event, " + type;
  callbacks.push(callback);
}

RatingStars.Container.prototype.register = function () {
  var userRate = this.options.userRate || 0;
  if (this.options.freezeOnClick)
    this.freeze();
  else
    this.setCurrentRate(userRate);
  var callbacks = this.callbacks.onClick;
  for (var i = 0; i < callbacks.length; i++)
    callbacks[i](userRate);
};

RatingStars.Container.prototype.freeze = function () {
  for (var i = 0; i < this.stars.length; i++) {
    var star = this.stars[i];
    star.style.cursor = 'auto';
    star.onclick      = null;
    star.onmouseover  = null;
    star.onmouseout   = null;
  }
}

RatingStars.Container.prototype.setDefaultRate = function () {
  var currentRate = this.options.currentRate;
  this.changeRate(currentRate);
  var callbacks = this.callbacks.onDefault;
  for (var i = 0; i < callbacks.length; i++)
    callbacks[i](currentRate);
}

RatingStars.Container.prototype.changeRate = function (userRate, isUserMode) {
  useRate = this.options.maxRate > userRate ? userRate : this.options.maxRate;
  this.options.userRate = userRate;
  var callbacks = this.callbacks.onChange;
  for (var j = 0; j < callbacks.length; j++) {
    callbacks[j](userRate);
  }
  for (var i = 1; i <= this.options.maxRate; i++) {
    var rate = i;
    if (userRate >= rate) {
      this.images[rate - 1].src = (isUserMode && this.options.userRatedStarImage)
        ? this.options.userRatedStarImage.src
        : this.options.ratedStarImage.src;
    } else if (userRate + 0.5 >= rate) {
      this.images[rate - 1].src = (this.options.halfRatedStarImage)
        ? this.options.halfRatedStarImage.src
        : this.options.unratedStarImage.src;
    } else {
      this.images[rate - 1].src = this.options.unratedStarImage.src;
    }
  }
}

RatingStars.Container.prototype.loadPlugin = function (pluginName) {
  var pluginClass = RatingStars.Plugin[pluginName];
  if (!pluginClass)
    throw "Unknwon plugin," + pluginName;
  var plugin = new pluginClass();
  plugin.load(this);
  return plugin;
}

RatingStars.Plugin = {};
RatingStars.Plugin.MessageLabel = function () { }
RatingStars.Plugin.MessageLabel.prototype.load = function (rating) {
  var extention = {
    _defaultMessage:    '',
    _successfulMessage: '',
    _messages:          [],
    _messageElement:    null,
    setMessageElement: function (element) {
      this._messageElement = element;
    },
    setDefaultMessage: function (msg) {
      this._defaultMessage = msg;
    },
    setSuccessfulMessage: function (msg) {
      this._successfulMessage = msg;
    },
    setRateMessage: function (rate, msg) {
      this._messages[rate] = msg;
    },
    getRateMessage: function (rate) {
      return this._messages[rate] || '';
    }
  };
  for (var prop in extention)
    rating[prop] = extention[prop];
  rating.registerCallback('onClick', function (rate) {
    var elm = document.getElementById(rating._messageElement);
    elm.innerHTML = rating._successfulMessage;
  } );
  rating.registerCallback('onChange', function (rate) {
    var elm = document.getElementById(rating._messageElement);
    elm.innerHTML = rating.getRateMessage(rate);
  } );
  rating.registerCallback('onDefault', function (rate) {
    var elm = document.getElementById(rating._messageElement);
    elm.innerHTML = rating._defaultMessage;
  } );
}

