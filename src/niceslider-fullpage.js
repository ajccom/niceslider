"use strict"
;(function ($) {  
  
  /**
   * NiceSlider
   */
  
  //兼容PC与移动端事件
  var _mobileCheck = 'ontouchend' in document,
    ev = {
      click: 'click',
      start: _mobileCheck ? 'touchstart' : 'mousedown',
      move: _mobileCheck ? 'touchmove' : 'mousemove',
      end: _mobileCheck ? 'touchend' : 'mouseup'
    }
  
  //获取浏览器前缀
  var _prefix = (function () {
    var div = document.createElement('div'),
      style = div.style
    if (style.webkitTransform) {
      return '-webkit-'
    } else if (style.mozTransform) {
      return '-moz-' 
    } else if (style.msTransform) {
      return '-ms-'
    } else {
      return ''
    }
  }())
  
  /**
   * 配置项
   * @param {Boolean} unlimit 是否执行无缝循环
   * @param {Boolean} ctrlBtn 是否加上左右控制按钮
   * @param {Boolean} indexBtn 是否加上序列标签
   * @param {Function} indexFormat indxBtn为true的情况下，序列标签内容的format函数。返回值将被插入标签元素中
   * @param {Number} index 初始项序号
   * @param {String} dir 移动方向
   * @param {Boolean} autoPlay 是否自动播放
   * @param {Number} duration 自动播放间隔时间
   * @param {Boolean} bounce 是否具有回弹效果
   * @param {Boolean} drag 是否支持拖拽
   * @param {Boolean} indexBind indxBtn为true的情况下，是否给序列标签添加滑动事件
   * @param {Function} onChange 定位动画执行完成后触发
   * @param {Boolean} noAnimate 关闭动画
   * @param {String} animation 指定动画效果
   */
  var _defaultConfig = {
    unlimit: true,
    ctrlBtn: true,
    indexBtn: true,
    /*indexFormat: function (i) {
      return '第' + i + '个'
    },
    extendAnimate: {
      'swing': function (t, b, c, d) {
        return t / d * c + b
      }
    }
    */
    index: 0,
    dir: 'h',
    autoPlay: false,
    duration: 5000,
    bounce: true,
    drag: true,
    indexBind: true,
    noAnimate: false,
    animation: 'ease-out-back'
  }
  
  /**
   * 处理配置项
   * @type {Function} 
   * @param {Object} cfg
   * @return {Object}
   */
  function _handleCfg (cfg) {
    return $.extend({}, _defaultConfig, cfg)
  }
  
  /**
   * 设置元素位移
   * @type {Function} 
   * @param {Object} jDom jQuery/Zepto对象
   * @param {Number} dist 位移值
   */
  function _setDist (jDom, dist, isVertical) {
    if (!isVertical) {
      jDom.css(_prefix + 'transform', 'translate3d(' + dist + 'px, 0, 0)')
    } else {
      jDom.css(_prefix + 'transform', 'translate3d(0, ' + dist + 'px, 0)')
    }
  }
  
  /**
   * 时间轴扭曲函数
   * @param {Number} t current time（当前时间）
   * @param {Number} b beginning value（初始值）置0，即b=0；
   * @param {Number} c change in value（变化量）置1，即c=1；
   * @param {Number} d duration（持续时间） 置1，即d=1。
   * @return {Number}
   */
  var _animationFunction = {
    'ease-out-back': function (t, b, c, d) {
      var s = 1.70158
      return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b
    },
    'linear': function (t, b, c, d) {
      return t / d * c + b
    }
  }
  
  /**
   * 添加动画函数
   * @param {Object} obj 新增函数
   */
  function _extendAnimate (obj) {
    $.extend(_animationFunction, obj)
  }
  
  /**
   * 动画函数
   * @param {Object} args
   */
  function _animate (args) {
    var start = args.start || 0,
      end = args.end || 0,
      jDom = args.dom,
      time = args.time,
      distence = end - start,
      current = start,
      smoothNumber = 10,
      pastTime = 0,
      isVertical = this.isVertical,
      that = this
    if (this._aniTimer) {clearInterval(this._aniTimer)}
    //_animating暂时没有作用
    this._animating = true
    this._aniTimer = setInterval(function () {
      if (_animationFunction[that.cfg.animation]) {
        current = _animationFunction[that.cfg.animation](pastTime, start, distence, time)
      } else {
        current = _animationFunction.linear(pastTime, start, distence, time)
      }
      _setDist(jDom, current, isVertical)
      
      //设置一下组件当前的位移值，方便手势操作时使用
      this.moveingDist = current
      
      pastTime += smoothNumber
      if (pastTime >= time) {
        clearInterval(that._aniTimer)
        args.cb && args.cb.apply(that)
        that._animating = false
        that.moveingDist = 0
        that.cfg.onChange && that.cfg.onChange.apply(that)
      }
    }, smoothNumber)
  }
  
  /**
   * 取消动画函数
   * @type {Function}
   */
  function _cancelAnimate () {
    if (this._animating) {clearInterval(this._aniTimer); this._animating = false; _setDom.apply(this)}
  }
  
  /**
   * 设置元素位移动画
   * @type {Function} 
   * @param {Object} jDom jQuery/Zepto对象
   * @param {Number} left 位移值
   */
  function _setAnimate (start, end, time) {
    _animate.call(this, {
      dom: this.jBox,
      start: start,
      end: end,
      time: time || 300,
      cb: _setDom
    })
  }
  
  /**
   * 滑动完成后重新设置DOM元素
   * @type {Function} 
   */
  function _setDom () {
    var isVertical = this.isVertical,
      dist = isVertical ? this.itemHeight : this.itemWidth,
      unlimit = this.cfg.unlimit,
      item = this.jItems,
      l = this.realLength,
      offset = 0,
      idx = this.currentIndex,
      dom = $(document.createDocumentFragment()),
      prev = null,
      next = null,
      current = null,
      i = 0
    
    if (idx > 0) {
      prev = item.eq(idx - 1).clone(true)
      offset = -dist
      i++
    } else if (unlimit) {
      prev = item.eq(l - 1).clone(true)
      offset = -dist
      i++
    }
    dom.append(prev)
    
    current = item.eq(idx).clone(true)
    dom.append(current)
    i++
    
    if (idx < l - 1) {
      next = item.eq(idx + 1).clone(true)
      i++
    } else if (unlimit) {
      next = item.eq(0).clone(true)
      i++
    }
    dom.append(next)
    
    isVertical ? this.jBox.height(dist * i) : this.jBox.width(dist * i)
    this.jBox.html('').append(dom)
    this.startPosition = offset
    _setDist(this.jBox, offset, isVertical)
  }
  
  /**
   * 为前后控制元素绑定事件
   * @type {Function} 
   * @param {Object} prevBtn 
   * @param {Object} nextBtn 
   */
  function _bindCtrlBtn (prevBtn, nextBtn) {
    var that = this
    prevBtn.on(ev.click, function () {
      that.prev()
    })
    nextBtn.on(ev.click, function () {
      that.next()
    })
    this.jPrevBtn = prevBtn
    this.jNextBtn = nextBtn
  }
  
  /**
   * 创建索引内容
   * @type {Function} 
   */
  function _createSteps () {
    var i = 0,
      l = this.realLength,
      html = '<ol class="slider-steps">',
      indexFormat = this.cfg.indexFormat,
      that = this,
      steps = null
    for (i; i < l; i++) {
      html += '<li class="step">' + (indexFormat ? indexFormat.call(that, i) : i) + '</li>'
    }
    html += '</ol>'
    this.jWrapper.append(html)
    if (this.cfg.indexBind) {
      steps = this.jWrapper.find('.slider-steps').on(ev.click, '.step', function () {
        var index = steps.find('.step').index($(this))
        that.moveTo(index)
      })
    } else {
      steps = this.jWrapper.find('.slider-steps')
    }
    this.jSteps = steps
  }
  
  /**
   * 创建组件DOM结构
   * @type {Function} 
   */
  function _create () {
    var html = '<div class="slider-wrapper"><div class="slider-content"></div></div>',
      cfg = this.cfg,
      box = this.jBox,
      items = null,
      wrapper = null,
      content = null,
      width = 0,
      height = 0,
      isVertical = cfg.dir === 'h' ? false : true
    
    this.isVertical = isVertical
    
    //处理refresh情况
    if (this.jWrapper) {
      items = this.jShadowBox.children()
      box.empty().append(items)
      delete this.jShadowBox
    } else {
      box.wrap(html)
    }
    
    this.jWrapper = wrapper = box.parents('.slider-wrapper')
    this.jItems = items = box.children()
    this.jContent = content = wrapper.find('.slider-content')
    this.realLength = items.length
    if (cfg.ctrlBtn) {
      wrapper.append('<div class="slider-control"><span class="prev"><span class="prev-s"></span></span><span class="next"><span class="next-s"></span></span></div>')
      _bindCtrlBtn.call(this, wrapper.find('.prev'), wrapper.find('.next'))
      this.jCtrl = this.jWrapper.find('.slider-control')
    }
    if (cfg.indexBtn) {
      _createSteps.apply(this)
    }
    this.itemWidth = width = items.width()
    this.itemHeight = height = items.height()
    
    if (!isVertical) {
      items.width(width)
      box.width(width)
      content.height(height)
    } else {
      items.height(height)
      box.height(height)
      content.width(width)
    }
    
    this.jShadowBox = $('<div></div>').append(items)
    this.moveTo(cfg.index, true)
    
  }

  var _origin = {},
    _currentPoint = {},
    _locked = false,
    _isChecked = false,
    _dir = true,
    _distance = 0,
    _currentSlider = null,
    _bound = false,
    _sliderCount = 0
  
  /**
   * 获取事件对象中的坐标值
   * @type {Function} 
   * @param {Object} e
   * @return {Object} 包含坐标值的对象
   */
  var _getXY = function (e) {
    var e = e.originalEvent ? e.originalEvent : e,
      touches = e.touches,
      x = 0,
      y = 0
    if (touches) {
      x = touches[0].pageX
      y = touches[0].pageY
    } else {
      x = e.clientX
      y = e.clientY
    }
    
    return {x: x, y: y} 
  }
  
  /**
   * 处理点击
   * @type {Function} 
   * @param {Object} e
   */
  function _touchstart (e) {
    _cancelAnimate.apply(this)
    //if (this._animating) {return}
    this.touched = true
    _origin = _getXY(e)
    _locked = false
    _isChecked = false
    _dir = 0
    _distance = 0
    _currentSlider = this
    if (this.timer) {clearTimeout(this.timer)}
  }
  
  /**
   * 处理滑动
   * @type {Function} 
   * @param {Object} e
   */
  function _touchmove (e) {
    if (_currentSlider && _currentSlider.cfg.drag) {
      if (_currentSlider.touched) {
        _currentPoint = _getXY(e)
        _handleMove.call(_currentSlider, _currentSlider.isVertical ? (_currentPoint.y - _origin.y) : (_currentPoint.x - _origin.x))
        if (_locked) {e.preventDefault()}
      }
    }
  }
  
  /**
   * 处理释放
   * @type {Function} 
   * @param {Object} e
   */
  function _touchend (e) {
    if (_currentSlider) {
      if (_currentSlider.cfg.drag) {
        _origin = {}
        _currentPoint = {}
        if (_locked) {_checkIndex.apply(_currentSlider)}
        _currentSlider.touched = false
        _locked = false
      }
      _setAutoPlay.apply(_currentSlider)
      _currentSlider = null
    }
  }
  
  /**
   * 判定上下/左右滑动
   * @type {Function} 
   * @param {Number} deltaX
   * @param {Number} deltaY
   */
  function _checkDir (deltaX, deltaY) {
    if (!_isChecked) {
      _isChecked = true
      
      if ((this.isVertical && Math.abs(deltaX) > Math.abs(deltaY))|| (!this.isVertical && Math.abs(deltaY) > Math.abs(deltaX))) {
        _locked = false
        this.touched = false
      } else {
        _locked = true
      }
    }
  }
  
  /**
   * 处理跟随移动
   * @type {Function} 
   * @param {Number} delta
   */
  function _handleMove (delta) {
    if (!_isChecked) {
      _checkDir.call(this, _currentPoint.x - _origin.x, _currentPoint.y - _origin.y)
    }
    //设置slider滑动方向
    _dir = delta > 0
    _distance = delta
    _move.call(this, delta)
  }
    
  /**
   * slider相对当前位置做移动
   * @type {Function} 
   * @param {Number} dist 位移距离
   */
  function _move (dist) {
    var isVertical = this.isVertical,
      unlimit = this.cfg.unlimit,
      origin = this.currentIndex === 0 && !unlimit ? 0 : (isVertical ? -this.itemHeight : -this.itemWidth),
      range = -origin * (this.currentIndex === this.realLength - 1 && !unlimit ? 1 : 2)
    dist = origin + dist
    if (!this.cfg.bounce && !unlimit) {
      dist = Math.min(0, Math.max(dist, -1 * range))
    }
    _setDist(this.jBox, dist, isVertical)
    this.moveingDist = dist
  }
  
  /**
   * 对slider的移动值做检测确定当前index
   * @type {Function} 
   */
  function _checkIndex () {
    var d = Math.abs(_distance),
      idx = this.currentIndex
    //未触发滑动事件 _dir是0 不是boolean值
    if (_dir === 0) {return}
    if (d > 20) {
      _dir ? this.moveTo(idx - 1) : this.moveTo(idx + 1)
    } else {
      this.moveTo(idx)
    }
  }
  
  /**
   * 对slider的控制按钮做检查
   * @type {Function} 
   */
  function _checkCtrlBtn () {
    var idx = this.currentIndex,
      cfg = this.cfg,
      l = this.realLength,
      pb = this.jPrevBtn,
      nb = this.jNextBtn
    
    if (!cfg.unlimit) { 
      //检查控制按钮状态
      if (idx === 0) {
        pb.addClass('disable')
      } else {
        pb.removeClass('disable')
      }
      if (idx === l - 1) {
        nb.addClass('disable')
      } else {
        nb.removeClass('disable')
      }
    } else {
      if (l === 1) {
        pb.addClass('disable')
        nb.addClass('disable')
      }
    }
  }
  
  /**
   * 高亮当前index
   * @type {Function} 
   */
  function _toggleStepTo () {
    var idx = this.currentIndex,
      cfg = this.cfg,
      l = this.realLength,
      pb = this.jPrevBtn,
      nb = this.jNextBtn
     
    this.jSteps.find('.step').removeClass('current').eq(idx % l).addClass('current')
  }
  
  /**
   * 执行自动播放
   * @type {Function} 
   */
  function _setAutoPlay () {
    var that = this,
      cfg = this.cfg
    if (cfg.autoPlay) {
      if (this.timer) {clearTimeout(this.timer)}
      this.timer = setTimeout(function () {
        
        var idx = that.currentIndex + 1
        that.moveTo(idx)
        
        _setAutoPlay.apply(that)
      }, this.cfg.duration)
    }
  }
  
  /**
   * slider定位到对应index
   * @type {Function} 
   * @param {Number} idx
   * @param {Boolean} isImmediate 是否立即定位
   */
  function _moveTo (idx, isImmediate) {
    var isVertical = this.isVertical,
      l = this.realLength,
      cIdx = this.currentIndex,
      unitDist = isVertical ? this.itemHeight : this.itemWidth,
      unlimit = this.cfg.unlimit,
      that = this,
      start = this.startPosition || 0,
      end = 0,
      i = 0
    
    if (unlimit) {
      if (idx < 0) {
        idx = l - 1
        end = 0
      } else if (idx >= l) {
        idx = 0
        end = start * 2
      } else {
        end = start + (idx - cIdx) * -unitDist
      }
    } else {
      if (idx < 0) {
        idx = 0
        end = start
      } else if (idx >= l) {
        idx = l - 1
        end = start
      } else {
        end = start + (idx - cIdx) * -unitDist
      }
    }
    
    if (!isImmediate && !this.cfg.noAnimate) {
      _setAnimate.call(this, this.touched ? this.moveingDist : start, end)
    } else {
      _setAnimate.call(this, end, end, 0)
    }
    this.currentIndex = idx
    
    if (this.jSteps) {_toggleStepTo.apply(this)}
    if (this.cfg.ctrlBtn) {_checkCtrlBtn.apply(this)}
    _setAutoPlay.apply(this)
  }
  
  /**
   * slider往前滑动一项
   * @type {Function} 
   */
  function _prev () {
    var idx = this.currentIndex - 1
    if (!this.cfg.unlimit && idx < 0) {return}
    this.moveTo(idx)
  }
  
  /**
   * slider往后滑动一项
   * @type {Function} 
   */
  function _next () {
    var idx = this.currentIndex + 1
    if (!this.cfg.unlimit && idx >= this.realLength) {return}
    this.moveTo(idx)
  }
  
  /**
   * 刷新slider
   * @type {Function} 
   * @param {Object}
   */
  function _refresh (cfg) {
    this.cfg = _handleCfg($.extend(this.cfg, cfg || {}))
    if (this.timer) {clearTimeout(this.timer)}
    _sliderCount--
    _init.apply(this)
  }
  
  /**
   * 回收实例对象
   * @type {Function} 
   */
  function _destroy () {
    var item = ''
    this.jWrapper.remove()
    for (item in this) {
      delete this[item]
    }
    
    this.__proto__ = null
    
    _sliderCount--
    if (_sliderCount === 0) {
      _unbind()
    }
  }
  
  /**
   * 绑定拖拽相关事件
   * @type {Function} 
   */
  function _bind () {
    var that = this
    this.jContent.on(ev.start, function (e) {_touchstart.call(that, e)})
    if (!_bound) {
      $(document).on(ev.move, _touchmove).on(ev.end, _touchend)
      _bound = true
    }
  }
  
  /**
   * 移除监听事件
   * @type {Function} 
   */
  function _unbind () {
    $(document).off(ev.move, _touchmove).off(ev.end, _touchend)
    _bound = false
  }
  
  /**
   * 初始化
   * @type {Function} 
   */
  function _init () {
    this.currentIndex = this.cfg.index
    if (this.cfg.extendAnimate) {_extendAnimate(this.cfg.extendAnimate)}
    _create.apply(this)
    _bind.apply(this)
    _setAutoPlay.apply(this)
    _sliderCount++
  }
  
  /**
   * NiceSlider函数
   * @type {Function}
   * @param {Object} dom 
   * @param {Object} cfg 配置项
   */
  function NiceSlider (dom, cfg) {
    this.jBox = $(dom)
    this.cfg = _handleCfg(cfg || {})
    _init.apply(this)
  }
  
  NiceSlider.prototype = {
    prev: _prev,
    next: _next,
    moveTo: _moveTo,
    refresh: _refresh,
    destroy: _destroy
  }
  
  if(typeof define === 'function' && define.amd) {
		define([], function () {
			return NiceSlider
		})
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = NiceSlider
	} else {
		window.NiceSlider = NiceSlider
	}
  
}(window.jQuery || window.Zepto))