"use strict"
;(function ($) {
  /**
   * NiceSlider
   */
  
  //兼容PC与移动端事件
  var mobileCheck = 'ontouchend' in document,
    ev = {
      click: 'click',
      start: mobileCheck ? 'touchstart' : 'mousedown',
      move: mobileCheck ? 'touchmove' : 'mousemove',
      end: mobileCheck ? 'touchend' : 'mouseup'
    }
  
  //获取浏览器前缀
  var prefix = (function () {
    var div = document.createElement('div')
    return typeof div.style.webkitTransform !== 'undefined' ? '-webkit-' : (typeof div.style.mozTransform ? '-moz-' : '')
  }())
  
  /**
   * 配置项
   * @param {Boolean} unlimit 是否执行无缝循环
   * @param {Boolean} ctrlBtn 是否加上左右控制按钮
   * @param {Boolean} indexBtn 是否加上序列标签
   * @param {Function} indexFormat indxBtn为true的情况下，序列标签内容的format函数。返回值将被插入标签元素中
   * @param {Number} offset 偏移值
   * @param {Number} index 初始项序号
   * @param {Boolean} autoPlay 是否自动播放
   * @param {Number} duration 自动播放间隔时间
   * @param {Boolean} bounce 是否具有回弹效果
   * @param {Boolean} drag 是否支持拖拽
   * @param {Boolean} indexBind indxBtn为true的情况下，是否给序列标签添加滑动事件
   * @param {Function} onChange 定位动画执行完成后触发
   * @param {Boolean} noAnimate 关闭动画
   */
  var defaultConfig = {
    unlimit: true,
    ctrlBtn: true,
    indexBtn: true,
    /*indexFormat: function (i) {
      return '第' + i + '个'
    },*/
    offset: 0,
    index: 0,
    autoPlay: false,
    duration: 5000,
    bounce: true,
    drag: true,
    indexBind: true,
    noAnimate: false
  }
  
  /**
   * 处理配置项
   * @type {Function} 
   * @param {Object} cfg
   * @return {Object}
   */
  function _handleCfg (cfg) {
    return $.extend({}, defaultConfig, cfg)
  }
  
  /**
   * 设置元素位移
   * @type {Function} 
   * @param {Object} jDom jQuery/Zepto对象
   * @param {Number} left 位移值
   */
  function _setLeft (jDom, left) {
    //jDom.css({left: left})
    jDom.css(prefix + 'transform', 'translate3d(' + left + 'px, 0, 0)')        
  }
  
  /**
   * 时间轴扭曲函数
   * @param {Number} t current time（当前时间）
   * @param {Number} b beginning value（初始值）置0，即b=0；
   * @param {Number} c change in value（变化量）置1，即c=1；
   * @param {Number} d duration（持续时间） 置1，即d=1。
   * @return {Number}
   */
  function _easeOutBack (t, b, c, d) {
    var s = 1.70158
    return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
    //return t / d * c + b
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
      //speed = distence / (time || 300),
      smoothNumber = 10,
      //unitDistence = speed * smoothNumber,
      pastTime = 0,
      that = this
    if (this._aniTimer) {clearInterval(this._aniTimer)}
    //_animating暂时没有作用
    this._animating = true
    this._aniTimer = setInterval(function () {
      current = _easeOutBack(pastTime, start, distence, time)
      _setLeft(jDom, current)
      
      //设置一下组件当前的位移值，方便手势操作时使用
      _moveingLeft = current
      
      pastTime += smoothNumber
      if (pastTime >= time) {
        clearInterval(that._aniTimer)
        that._animating = false
        _setLeft(jDom, end)
        args.cb && args.cb.apply(that)
        that.cfg.onChange && that.cfg.onChange.apply(that)
      }
    }, smoothNumber)
  }
  
  /**
   * 取消动画函数
   * @type {Function}
   */
  function _cancelAnimate () {
    if (this._aniTimer) {clearInterval(this._aniTimer); this._animating = false}
  }
  
  /**
   * 设置元素位移动画
   * @type {Function} 
   * @param {Object} jDom jQuery/Zepto对象
   * @param {Number} left 位移值
   */
  function _setAnimate (start, end) {
    //jDom.animate(data, 300, 'swing', function () {})
    if (!this.cfg.noAnimate) {
      _animate.call(this, {
        dom: this.jBox,
        start: start,
        end: end,
        time: 200,
        cb: _resetIndex
      })
    } else {
      _animate.call(this, {
        dom: this.jBox,
        start: end,
        end: end,
        time: 0,
        cb: _resetIndex
      })
    }
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
      items = this.jItems,
      l = items.length,
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
      multiple = 1
    
    //处理refresh情况
    if (this.jWrapper) {
      var div = $('<div></div>')
      div.append(box)
      this.jWrapper.after(box)
      this.jWrapper.remove()
      delete this.jWrapper
    }
    
    box.wrap(html)
    this.jWrapper = wrapper = box.parents('.slider-wrapper')
    this.jItems = items = box.children()
    this.jContent = content = wrapper.find('.slider-content')
    if (cfg.ctrlBtn) {
      wrapper.append('<div class="slider-control"><span class="prev"><span class="prev-s"></span></span><span class="next"><span class="next-s"></span></span></div>')
      _bindCtrlBtn.call(this, wrapper.find('.prev'), wrapper.find('.next'))
      this.jCtrl = this.jWrapper.find('.slider-control')
    }
    if (items.length > 1) {
      if (cfg.indexBtn) {
        _createSteps.apply(this)
      }
      if (cfg.unlimit) {
        box.append(items.clone())
        multiple = 2
        if (items.length === 2) {
          box.append(items.clone())
          multiple = 3
        }
      
        //重新获取slider item
        this.jItems = items = box.children()
      }
      this.multiple = multiple
      this.realLength = items.length / multiple
      //Zepto对象没有outWidth方法，降级使用width
      this.itemWidth = width = items.width()
      this.jItems.width(width)
      box.width(width * items.length)
      this.boxWidth = parseInt(box.width() / multiple, 10)
      //_setLeft(box, -1 * this.boxWidth + cfg.offset)
      content.height(box.height())
      //设置滑动范围，仅在非无缝循环下使用
      this.rangeWidth = this.boxWidth - this.jWrapper.width() + cfg.offset
      this.currentLeft = cfg.index * this.itemWidth
      this.moveTo(cfg.index)
    } else {
      this.multiple = 1
      this.itemWidth = width = items.width()
      this.realLength = 1
      box.width(width)
      content.height(box.height())
      this.boxWidth = width
      this.rangeWidth = 0
      wrapper.addClass('slider-no-effect')
      this.currentLeft = 0
      this.moveTo(0)
    }
    
  }
  
  ////////////////////////darg相关
  var _origin = {},
    _currentPoint = {},
    _locked = false,
    _isChecked = false,
    _dir = true,
    _distance = 0,
    _currentSlider = null,
    _bound = false,
    _sliderCount = 0,
    _moveingLeft = 0
  
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
        _handleMove.call(_currentSlider, _currentPoint.x - _origin.x)
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
      //_setAutoPlay.apply(_currentSlider)
      _currentSlider = null
    }
    
    _moveingLeft = 0
  }
  
  /**
   * 处理滚动
   * @type {Function} 
   * @param {Object} e
   */
  function _handleScroll (e) {
    if (_currentSlider) {
      _currentSlider.touched = false
      _origin = {}
      _currentPoint = {}
      _locked = false
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
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
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
   * @param {Number} deltaX
   */
  function _handleMove (deltaX) {
    if (!_isChecked) {
      _checkDir.call(this, _currentPoint.x - _origin.x, _currentPoint.y - _origin.y)
    }
    //设置slider滑动方向
    _dir = deltaX > 0
    _distance = deltaX
    _move.call(this, deltaX)
  }
  
  ///////////////drag相关
  
  /**
   * slider相对当前位置做移动
   * @type {Function} 
   * @param {Number} x 位移距离
   */
  function _move (x) {
    var x = this.currentLeft + x
    if (!this.cfg.bounce && !this.cfg.unlimit) {
      x = Math.min(0, Math.max(x, -1 * this.rangeWidth))
    }
    _setLeft(this.jBox, x)
    _moveingLeft = x
  }
  
  /**
   * 对slider的移动值做检测确定当前index
   * @type {Function} 
   */
  function _checkIndex () {
    var idx = this.currentIndex,
      w = this.itemWidth,
      l = this.jItems.length,
      rl = this.realLength,
      d = Math.abs(_distance),
      deltaIndex = 0
    //未触发滑动事件 _dir是0 不是boolean值
    if (_dir === 0) {return}
            
    if (this.cfg.unlimit) {
      //idx = idx + (_dir ? -1 : 1)
      //this.moveTo(idx)
      _dir ? this.prev() : this.next()
    } else {
      //根据滑动距离判断划过了多少个item
      if (d > w / 2) {
        deltaIndex = (_dir ? -1 : 1) * Math.ceil(d / w)
      }
      idx = idx + deltaIndex
      idx = Math.max(0, Math.min(idx, this.realLength - 1))
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
        //that.next()
        
        var idx = that.currentIndex + 1
        if (that.cfg.unlimit) {
          that.moveTo(idx)
        } else {
          idx = idx % that.realLength
          that.moveTo(idx)
        }
        
        _setAutoPlay.apply(that)
      }, this.cfg.duration)
    }
  }
  
  /**
   * 无缝循环时，动画结束后设置合理的index
   * @type {Function} 
   */
  function _resetIndex () {
    var idx, rl, l
    if (this.cfg.unlimit && !this.touched) {
      idx = this.currentIndex
      rl = this.realLength
      l = this.jItems.length
      if (rl > 1) {
        if (idx <= 1) {
          idx = rl + 1
          this.setIndexTo(idx)
        } else if (idx >= l - 2) {
          idx = l - 2 - rl
          this.setIndexTo(idx)
        }
      }
    }
  }
  
  /**
   * slider定位到对应index，带动画效果
   * @type {Function} 
   * @param {Number} idx
   */
  function _moveTo (idx) {
    var l = this.jItems.length,
      w = this.itemWidth,
      offset = this.cfg.offset,
      multiple = this.multiple,
      rl = this.realLength,
      left = 0,
      that = this
      
    if (this.cfg.unlimit) {
      if (rl > 1) {
        if (idx <= 0) {
          idx = rl
          this.setIndexTo(idx + 1)
        } else if (idx >= l - 1) {
          idx = l - 1 - rl
          this.setIndexTo(idx - 1)
        }
        left = -1 * idx * w + offset
      } else {
        idx = 0
        left = offset
      }
    } else {
      idx = idx % l
      left = Math.max(-1 * idx * w + offset, -1 * this.rangeWidth)
    }
    
    //setTimeout(function () {_setLeft(that.jBox, left)}, 0)
    
    _setAnimate.call(this, this.touched ? _moveingLeft : this.currentLeft, left)
    this.currentIndex = idx
    this.currentLeft = left
    
    if (this.jSteps) {_toggleStepTo.apply(this)}
    if (this.cfg.ctrlBtn) {_checkCtrlBtn.apply(this)}
    _setAutoPlay.apply(this)
  }
  
  /**
   * slider立即显示为对应index项
   * @type {Function} 
   * @param {Number} idx
   */
  function _setIndexTo (idx) {
    var wrapper = this.jWrapper,
      l = this.jItems.length,
      w = this.itemWidth,
      offset = this.cfg.offset,
      left = 0
    if (idx.toString() === 'NaN') {return}
    idx = parseInt(idx, 10) % l
    left = -1 * idx * w + offset
    _setLeft(this.jBox, left)
    this.currentIndex = idx
    this.currentLeft = left
  }
  
  /**
   * slider往前滑动一项
   * @type {Function} 
   */
  function _prev () {
    var idx = this.currentIndex - 1
    if (this.cfg.unlimit) {
      this.moveTo(idx)
    } else {
      if (idx < 0) {return}
      this.moveTo(idx)
    }
  }
  
  /**
   * slider往后滑动一项
   * @type {Function} 
   */
  function _next () {
    var idx = this.currentIndex + 1
    if (this.cfg.unlimit) {
      this.moveTo(idx)
    } else {
      if (idx >= this.realLength) {return}
      this.moveTo(idx)
    }
  }
  
  /**
   * 刷新slider
   * @type {Function} 
   * @param {Object}
   */
  function _refresh (cfg) {
    
    if (this.cfg.unlimit === true) {
      _resetItems.apply(this)
    }
    
    var cfg = this.cfg = _handleCfg(cfg || {})
    if (this.timer) {clearTimeout(this.timer)}
    _init.apply(this)
  }
  
  /**
   * 重置slider项
   * @type {Function} 
   */
  function _resetItems () {
    var l = this.realLength - 1
    this.jItems.each(function (i, o) {
      if (i > l) {$(o).remove()}
    })
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
    //this.jBox.on(ev.move, function (e) {
      //if (_locked) {e.preventDefault()}
    //})
    if (!_bound) {
      $(document).on(ev.move, _touchmove).on(ev.end, _touchend)
      //$(window).on('scroll', _handleScroll)
      _bound = true
    }
  }
  
  /**
   * 移除监听事件
   * @type {Function} 
   */
  function _unbind () {
    $(document).off(ev.move, _touchmove).off(ev.end, _touchend)
    //$(window).off('scroll', _handleScroll)
    _bound = false
  }
  
  /**
   * 初始化
   * @type {Function} 
   */
  function _init () {
    this.currentIndex = this.cfg.index
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
    setIndexTo: _setIndexTo,
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