"use strict"
;(function ($) {  
  var util = (function () {
    /**
     * _map 遍历对象，辅助函数
     * @param {Object|Array} arr 遍历对象
     * @param {Function} cb 回调函数，传入参数
          @param {Object} 数组子项
          @param {Number} 序号
     * @return {Array} 数组对象
     */
    function _map (arr, cb) {
      if (!arr) {return}
      return Array.prototype.map.call(arr, function (o, i) {
        return cb ? cb(o, i) : o
      })
    }

    /**
     * _addClass 添加类，辅助函数
     * @param {Object|Array} DOM 对象
     * @param {String} klass 类字符串
     */
    function _addClass (element, klass) {
      if (!element || !klass) {return}
      var arr = element.item ? _map(element) : [element]
      var reg = new RegExp('(\s*|^)' + klass + '(\s*|$)')
      arr.map(function (node) {
        var str = node.className
        if (!str) {
          node.className = klass
        } else {
          !reg.test(str) && (node.className += ' ' + klass)
        }
      })
    }

    /**
     * _removeClass 删除类，辅助函数
     * @param {Object} DOM 对象
     * @param {String} klass 类字符串
     */
    function _removeClass (element, klass) {
      if (!element || !klass) {return}
      var arr = element.item ? _map(element) : [element]
      var regs = klass.split(' ').map(function (str) {
        return new RegExp('(\s*|^)' + str + '(\s*|$)', 'g')
      })
      arr.map(function (node) {
        var str = node.className
        regs.map(function (reg) {
          str = str.replace(reg, '').trim()
        })
        node.className = str
      })
    }

    var _mobileCheck = 'ontouchend' in document,
      _pointCheck = window.PointerEvent || window.MSPointerEvent,
      _prefixPointerEvent = (pointerEvent) => window.MSPointerEvent ? 
          'MSPointer' + pointerEvent.charAt(9).toUpperCase() + pointerEvent.substr(10) : pointerEvent,
      ev = {
        click: 'click',
        start: _mobileCheck ? (_pointCheck ? _prefixPointerEvent('pointerdown') : 'touchstart' ) : 'mousedown',
        move: _mobileCheck ? (_pointCheck ? _prefixPointerEvent('pointermove') : 'touchmove') : 'mousemove',
        end: _mobileCheck ? (_pointCheck ? _prefixPointerEvent('pointerup') : 'touchend') : 'mouseup',
        cancel: _mobileCheck ? (_pointCheck ? _prefixPointerEvent('pointercancel') : 'touchcancel') : 'mousecancel'
      }
    
    /**
     * 事件处理对象 eventHandler
     * @usage eventHandler.on(ev.start, dom, fn) //绑定事件
     *        eventHandler.on(ev.start, dom, selector, fn) //事件委托
     *        eventHandler.off(ev.start, dom) //卸载指定事件 （仅通过 eventHandler 绑定的事件）
     *        eventHandler.off(dom) //卸载所有事件 （仅通过 eventHandler 绑定的事件）
     *        eventHandler.trigger(ev.start, dom, 'args1', 'args2') //模拟事件并触发，第 3 个参数起都是传入参数
     *  目前无法通过一次调用绑定多个事件, 如 eventHandler.on('touchstart touchmove', function () {...})
     */
    var eventHandler = (function () {
      /**
       * store 存储 eventHandler 中的 dom 与 绑定事件
       * 形如：
         {
           click: [{
             dom: dom1,
             fn: [fn1, fn2, ...]
           }, {
             dom: dom2,
             fn: [...]
           }]
         }
       */
      var store = {}
      
      /**
       * check 冒泡方式查找对应元素是否与 selector 匹配
       * @param {String} selector 选择器字符串
       * @param {Object} e 事件对象
       * @param {Object} 父元素
       * @param {Object|Null} 返回查找到的元素或 null
       */
      function check (selector, e, parentNode) {
        if (!selector || !parentNode) {return null}
        var nodes = [], target = e.target
        
        _map(parentNode.querySelectorAll(selector), function (node) {
          nodes.push(node)
        })
        
        while (target && nodes.indexOf(target) === -1 && target !== parentNode) {
          target = target.parentNode
        }
        if (target === parentNode) {return null}
        return target
      }
      
      /**
       * on 绑定方法
       * @param eventName 事件名称
       * @param dom 绑定事件的 DOM 元素
       * @param selector 委托元素的 selector
       * @param callback 回调函数
       * @usage on('click', document.body, 'a', function () {console.log('click a link')})
       */
      function on (eventName, dom, selector, callback) {
        if (!eventName || !dom) {return new Error('arguments wrong in on function. eventName:' + eventName + ' element: ' + dom)}
        
        var i = 0, item = null, l = 0, target = null
        
        if (typeof selector === 'function') {
          callback = selector
          selector = ''
        }
        
        var arr = dom.item ? _map(dom) : [dom]
        arr.map(function (dom) {
          /**
           * fn 需要进行委托处理后执行回调函数
           */
          var fn = function (e) {
            if (selector) {
              var node = check(selector, e, dom)
              node && callback.call(node, e)
            } else {
              callback.call(dom, e)
            }
          }
          
          dom.addEventListener(eventName, fn)
          
          var temp = null
          if (!store[eventName]) {
            store[eventName] = [{
              dom: dom,
              fn: [fn]
            }]
          } else {
            l = store[eventName].length
            
            for (i = 0; i < l; i++) {
              temp = store[eventName][i]
              if (temp.dom === dom) {
                target = dom
                temp.fn.push(fn)
                break
              }
            }
            
            //not find dom in store[eventName]
            if (!target) {
              store[eventName].push({
                dom: dom,
                fn: [fn]
              })
            }
          }
        })
        
      }
      
      /**
       * off 移除绑定方法
       * @param eventName 事件名称
       * @param dom 绑定事件的 DOM 元素
       * @usage off('click', document.body)
       */
      function off (eventName, dom) {
        if (!eventName) {return new Error('arguments wrong in on function. first arguments:' + eventName)}
        
        if (typeof eventName === 'object') {
          dom = eventName
          eventName = ''
        }
        
        var temp = null, i = 0, j = 0, l = 0, len = 0, arr = []
        arr = dom.item ? _map(dom) : [dom]
        len = arr.length
        if (eventName) {
          if (!store[eventName]) {return}
          l = store[eventName].length
          for (i = 0; i < l; i++) {
            temp = store[eventName][i]
            for (j = 0; j < len; j++) {
              if (arr[j] === temp.dom) {
                removeEvent(arr[j], eventName, temp.fn)
                break
              }
            }
          }
        } else {
          for (eventName in store) {
            l = store[eventName].length
            for (i = 0; i < l; i++) {
              temp = store[eventName][i]
              for (j = 0; j < len; j++) {
                if (arr[j] === temp.dom) {
                  removeEvent(arr[j], eventName, temp.fn)
                  break
                }
              }
            }
          }
        }
        
        /**
         * removeEvent 移除事件
         * @param {Object} dom 
         * @param {String} eventName 
         * @param {Array} fnArray 回调事件数组
         */
        function removeEvent (dom, eventName, fnArray) {
          var i = 0, l = 0, index = 0, temp = null
          fnArray.map(function (fn) {
            try {
              dom.removeEventListener(eventName, fn)
              
              l = store[eventName].length
              for (i; i < l; i++) {
                temp = store[eventName][i]
                index = temp.fn.indexOf(fn)
                if (temp.dom === dom && index > -1) {
                  temp.fn.splice(index, 1)
                }
              }
            } catch (e) {}
          })
        }
        
        // beauty store
        for (eventName in store) {
          i = 0, l = store[eventName].length, target = []
          for (i; i < l; i++) {
            temp = store[eventName][i]
            if (temp.fn && temp.fn.length !== 0) {
              target.push(temp)
            }
          }
          store[eventName] = target
        }
      }
      
      /**
       * TODO
       */
      function trigger (eventName, dom) {
        return
      }
      
      return {on: on, off: off}
      
    })()
    
    
    return {
      map: _map,
      addClass: _addClass,
      removeClass: _removeClass,
      ev: ev,
      eventHandler: eventHandler
    }
  })()
  
  /////////////////////////////////////////////////
  /////////////////////////////////////////////////
  var ev = util.ev
  
  /**
   * _append 插入字符串
   * @param {Object} DOM 元素
   * @param {String} 字符串
   */
  function _append (dom, str) {
    if (!dom || !str) {return}
    
    var arr = dom.item ? util.map(dom) : [dom],
      div = document.createElement('div')
    div.innerHTML = str
    arr.map(function (dom) {
      var arr = util.map(div.childNodes)
      
      arr.map(function (child) {
        dom.appendChild(child.cloneNode(true))
      })
      
    })
    
    div = null
    
    return dom
  }
  
  /**
   * _wrap 字符串包裹元素
   * @param {Object} DOM 元素
   * @param {String} 字符串
   */
  function _wrap (dom, str) {
    if (!dom || !str) {return}
    
    var div = document.createElement('div'),
      target = document.createElement('div'),
      p = dom.parentNode,
      oldNode = div
    div.innerHTML = str
    
    while(div.children.length > 0) {
      div = div.children[0]
    }
    
    p.insertBefore(target, dom)
    
    div.appendChild(dom)
    
    util.map(oldNode.children, function (node) {
      p.insertBefore(node ,target)
    })
    
    p.removeChild(target)
    
    target = null
    div = null
  }
  
  /**
   * _parent 查找父元素
   * @param {Object} DOM 元素
   * @param {String} 字符串
   */
  function _parent (dom, selector) {
    if (!dom || !selector) {return}
    
    var oldNode = dom
    
    while (dom && !check(dom, selector)) {
      dom = dom.parentNode
    }
    
    /**
     * 检查元素是否能够对应 selector
     */
    function check (dom, selector) {
      var p = dom.parentNode, result = false
      if (p) {
        util.map(p.querySelectorAll(selector), function (node) {
          if (node === dom) {
            result = true
          }
        })
      }
      
      return result
    }
    
    if (oldNode === dom) {return}

    return dom
  }
  
  /**
   * _css 设置元素样式
   * @type {Function} 
   * @param {Object} dom DOM 元素或 NodeList 对象
   * @param {Object} obj 样式数据
   */
  function _css (dom, obj) {
    var arr = dom.item ? util.map(dom) : [dom]
    arr.map(function (dom) {
      for (var item in obj) {
        dom.style[item] = obj[item]
      }
    })
  }
  
  
  var _prefix = (function () {
    var div = document.createElement('div'),
      style = div.style,
    /*  arr = ['WebkitT', 'MozT', 'MsT'],
      temp = '',
      i = 0,
      l = 3,*/
      
      result = ''
      
    /*for (i; i < l; i++) {
      temp = arr[i]
      if (typeof style[temp + 'ransform'] !== 'undefined') {
        result = '-' + temp.replace('T', '').toLowerCase() + '-'
        break
      }
    }*/
    if (style.WebkitTransform === '') {
      result = '-webkit-'
    } else if (style.MozTransform === '') {
      result = '-moz-'
    } else if (style.MsTransform === '') {
      result = '-ms-'
    }
    return result
  }())
  
  var _mobileCheck = 'ontouchend' in document
  
  /**
   * 配置项
   * @param {Boolean} unlimit 是否执行无缝循环
   * @param {Boolean} ctrlBtn 是否加上左右控制按钮
   * @param {Boolean} indexBtn 是否加上序列标签
   * @param {Function} indexFormat indxBtn为true的情况下，序列标签内容的format函数。返回值将被插入标签元素中
   * @param {Number} unit 滑动个数（默认1，设0表示按屏滚动）
   * @param {Number} offset 偏移值
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
    unit: 1,
    offset: 0,
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
    //存在 unit 时，设置 unlimit 为 false，原因是作者不会处理 unlimit 的 Carousel
    if (typeof cfg.unit !== 'undefined') {cfg.unlimit = false}
    return Object.assign({}, _defaultConfig, cfg)
  }
  
  /**
   * 设置元素位移
   * @type {Function} 
   * @param {Object} dom DOM 对象或 NodeList 对象
   * @param {Number} dist 位移值
   */
  var _setDist = function (dom, dist, isVertical) {
    var d = {}
    if (_mobileCheck) {
      if (!isVertical) {
        d[_prefix + 'transform'] = 'translate3d(' + dist + 'px, 0, 0)'
      } else {
        d[_prefix + 'transform'] = 'translate3d(0, ' + dist + 'px, 0)'
      }
      _css(dom, d)
    } else {
      if (!isVertical) {
        d.left = dist + 'px'
      } else {
        d.top = dist + 'px'
      }
      _css(dom, d)
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
  var _aniFn = {
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
    Object.assign(_aniFn, obj)
  }
  
  /**
   * 使用requestAnimationFrame替代setTimeout/setInterval
   * @param {Object} obj 新增函数
   */
  function _rAF (fn) {
    var a = (window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    setTimeout)(fn)
    return a
  }
  
  function _cAF (id) {
    (window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    clearTimeout)(id)
    return null
  }
  
  /**
   * 动画函数
   * @param {Object} args
   */
  function _animate (args) {
    var start = args.start || 0,
      end = args.end || 0,
      dom = args.dom,
      time = args.time,
      distence = end - start,
      current = start,
      startTime = +new Date,
      pastTime = 0,
      isVertical = this.isVertical,
      that = this
    if (this._at) {_cAF(this._at)}
    
    function _step () {
      that._at = _rAF(function () {
        pastTime = +new Date - startTime
        current = (_aniFn[that.cfg.animation] || _aniFn.linear)(pastTime, start, distence, time)
        _setDist(dom, current, isVertical)
        
        //设置一下组件当前的位移值，方便手势操作时使用
        //that.moveDist = current
        
        if (pastTime >= time) {
          _cAF(that._at)
          _setDist(dom, end, isVertical)
          args.cb && args.cb.apply(that)
          that._isAni = false
          that.cfg.onChange && that.cfg.onChange.apply(that)
        } else {
          _step()
        }
      })
    }
    
    this._isAni = true
    _step()
    
  }
  
  /**
   * 取消动画函数
   * @type {Function}
   */
  function _cancelAnimate () {
    if (this._isAni) {_cAF(this._at); this._isAni = false; _resetIndex.apply(this)}
  }
  
  /**
   * 设置元素位移动画
   * @type {Function} 
   * @param {Object} jDom jQuery/Zepto对象
   * @param {Number} left 位移值
   */
  function _setAni (start, end, time) {
    //jDom.animate(data, 300, 'swing', function () {})
    _animate.call(this, {
      dom: this.DOMBox,
      start: start,
      end: end,
      time: typeof time === 'number' ? time : 300,
      cb: _resetIndex
    })
  }
  
  /**
   * 为前后控制元素绑定事件
   * @type {Function} 
   * @param {Object} prevBtn 
   * @param {Object} nextBtn 
   */
  function _bindCtrlBtn (prevBtn, nextBtn) {
    var that = this
    this.DOMPrev = util.eventHandler.on(ev.click, prevBtn, function () {
      that.prev()
    })
    this.DOMNext = util.eventHandler.on(ev.click, nextBtn, function () {
      that.next()
    })
  }
  
  /**
   * 创建索引内容
   * @type {Function} 
   */
  function _createSteps () {
    var i = 0,
      l = this.stepLength,
      html = '<ol class="slider-steps">',
      indexFormat = this.cfg.indexFormat,
      that = this,
      steps = null,
      cfg = this.cfg
    
    for (i; i < l; i++) {
      html += '<li class="step">' + (indexFormat ? indexFormat.call(that, i) : i) + '</li>'
    }
    html += '</ol>'
    _append(this.DOMWrap, html)
    if (this.cfg.indexBind) {
      steps = this.DOMWrap.querySelector('.slider-steps')
      util.eventHandler.on(ev.click, steps, '.step', function () {
        var str = this.className, index, items = util.map(steps.querySelectorAll('.step'))
        if (str.indexOf('disable') > -1) {return}
        var delta = items.indexOf(steps.querySelector('.current')) - items.indexOf(this)
        that.moveTo(that.currentIndex - delta)
      })
    } else {
      steps = this.DOMWrap.querySelector('.slider-steps')
    }
    this.DOMStepBox = steps
  }
  
  /**
   * 创建组件DOM结构
   * @type {Function} 
   */
  function _create () {
    var html = '<div class="slider-wrapper"><div class="slider-content"></div></div>',
      cfg = this.cfg,
      box = null,
      items,
      wrapper,
      content,
      width,
      height,
      multiple = 1,
      isVertical = cfg.dir === 'h' ? false : true,
      rangeWidth, rangeHeight, realLength, size
    
    this.isVertical = isVertical
    
    //处理refresh情况
    if (this.DOMWrap) {
      box = this.fragmentDom.cloneNode(true)
      
      this.DOMWrap.parentNode.insertBefore(box, this.DOMWrap)
      this.DOMWrap.parentNode.insertBefore(this.DOMWrap, box)
      this.DOMWrap.remove()
      delete this.DOMWrap
      this.DOMBox = box
    } else {
      box = this.DOMBox
      this.fragmentDom = box.cloneNode(true)
    }
    _wrap(box, html)
    this.DOMWrap = wrapper = _parent(box, '.slider-wrapper')
    this.DOMItem = items = box.children
    this.DOMContent = content = wrapper.querySelector('.slider-content')
    if (cfg.ctrlBtn) {
      _append(wrapper, '<div class="slider-control"><span class="prev"><span class="prev-s"></span></span><span class="next"><span class="next-s"></span></span></div>')
      _bindCtrlBtn.call(this, wrapper.querySelector('.prev'), wrapper.querySelector('.next'))
      this.DOMCtrl = this.DOMWrap.querySelector('.slider-control')
    }
    if (items.length > 1) {
      width = items[0].clientWidth
      height = items[0].clientHeight
      
      if (cfg.unlimit) {
        
        util.map(items, function (item) {
          box.appendChild(item.cloneNode(true))
        })
        
        multiple = 2
        if (items.length === 2) {
          util.map(items, function (item) {
            box.appendChild(item.cloneNode(true))
          })
          multiple = 3
        }
      
        //重新获取slider item
        this.DOMItem = items = box.children
      }
      realLength = items.length / multiple
      
      if (!isVertical) {
        _css(this.DOMItem,{width: width + 'px'})
        box.style.width = width * items.length + 'px'
        size = Math.ceil(width * items.length / multiple)
        content.style.height = box.clientHeight + 'px'
        rangeWidth = size - this.DOMWrap.clientWidth + cfg.offset
        this.current = cfg.index * width
      } else {
        _css(this.DOMItem,{height: height + 'px'})
        box.style.height = height * items.length + 'px'
        size = Math.ceil(height * items.length / multiple)
        content.style.width = box.clientWidth + 'px'
        content.style.height = height + 'px'
        rangeHeight = size - this.DOMWrap.clientHeight + cfg.offset
        this.current = cfg.index * height
      }
      this.wrapperSize = isVertical ? wrapper.clientHeight : wrapper.clientWidth
      this.itemSize = isVertical ? height : width
      this.moveUnit = cfg.unit > 0 ? this.itemSize * cfg.unit : this.wrapperSize
      this.scope = isVertical ? rangeHeight : rangeWidth
      this.stepLength = cfg.unit > 0 ? Math.round(this.scope / this.moveUnit + 1) : Math.round(this.itemSize * realLength / this.wrapperSize)
      if (cfg.unlimit && cfg.unit) {this.stepLength += Math.round((this.wrapperSize - cfg.offset - this.itemSize) / this.moveUnit)}
      if (cfg.indexBtn) {
        _createSteps.apply(this)
      }
      this.moveTo(cfg.index, 0)
    } else {
      width = items[0].clientWidth
      height = items[0].clientHeight
      realLength = 1
      this.wrapperSize = isVertical ? wrapper.clientHeight : wrapper.clientWidth
      this.itemSize = isVertical ? height : width
      this.moveUnit = 0
      this.scope = 0
      this.stepLength = 1
      if (!isVertical) {
        box.style.width = width + 'px'
        content.style.height = box.clientHeight + 'px'
        rangeWidth = 0
        util.addClass(wrapper, 'slider-no-effect')
        this.current = 0
        this.moveTo(0, 0)
      } else {
        box.style.height = height + 'px'
        content.style.width = box.clientWidth + 'px'
        rangeHeight = 0
        util.addClass(wrapper, 'slider-no-effect')
        this.current = 0
        this.moveTo(0, 0)
      }
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
    _sliderArray = [],
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
      x,
      y
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
    _sliderArray.push(this)
    if (_mobileCheck && this.timer) {clearTimeout(this.timer)}
  }
    
  /**
   * 处理滑动
   * @type {Function} 
   * @param {Object} e
   */
  function _touchmove (e) {
    _currentSlider = _sliderArray[0]
    if (_currentSlider && _currentSlider.cfg.drag && !_currentSlider.checkLock()) {
      if (_currentSlider.touched) {
        if (_currentSlider.timer) {clearTimeout(_currentSlider.timer)}
        _currentPoint = _getXY(e)
        _handleMove.call(_currentSlider, _currentSlider.isVertical ? (_currentPoint.y - _origin.y) : (_currentPoint.x - _origin.x))
        if (_locked) {e.preventDefault()}
      }
    } else {
      _sliderArray.shift()
    }
  }
    
  /**
   * 处理释放
   * @type {Function} 
   * @param {Object} e
   */
  function _touchend (e) {
    //有时候不会触发touchmove，比如 touchstart 后直接 touchcancel 了，所以判断下 _sliderArray[0]
    _currentSlider = _currentSlider || _sliderArray[0] || null
    if (_currentSlider) {
      if (_currentSlider.cfg.drag) {
        _origin = {}
        _currentPoint = {}
        if (_locked) {_checkIndex.apply(_currentSlider)}
        _currentSlider.touched = false
        _locked = false
      }
      //如果遇到在webview下出现一帧滑动多个图片时候，尝试启用下面的代码
      //if (_currentSlider.timer) {clearTimeout(_currentSlider.timer)}
      _setAutoPlay.apply(_currentSlider)
      _currentSlider.moveDist = 0
    }
    _currentSlider = null
    _sliderArray = []
  }
  
  /**
   * 判定上下/左右滑动
   * @type {Function} 
   * @param {Number} deltaX
   * @param {Number} deltaY
   */
  function _checkDir (deltaX, deltaY) {
    if ((this.isVertical && Math.abs(deltaX) > Math.abs(deltaY))|| (!this.isVertical && Math.abs(deltaY) > Math.abs(deltaX))) {
      _sliderArray.shift()
      if (_sliderArray.length) {
        _currentSlider = _sliderArray[0]
        _checkDir.call(_currentSlider, deltaX, deltaY)
        return
      } else {
        _locked = false
        this.touched = false
      }
    } else {
      _locked = true
    }
    _isChecked = true
  }
  
  /**
   * 处理跟随移动
   * @type {Function} 
   * @param {Number} delta
   */
  function _handleMove (delta) {
    if (!_isChecked) {
      _checkDir.call(this, _currentPoint.x - _origin.x, _currentPoint.y - _origin.y)
      return
    }
    //设置slider滑动方向
    _dir = delta > 0
    
    if (_dir && this.checkLockPrev()) {
      delta = 0
    }
    if (!_dir && this.checkLockNext()) {
      delta = 0
    }
    
    _distance = delta
    _move.call(this, delta)
  }
  
  ///////////////drag相关
  
  /**
   * slider相对当前位置做移动
   * @type {Function} 
   * @param {Number} dist 位移距离
   */
  function _move (dist) {
    var isVertical = this.isVertical,
      origin = this.current,
      range = this.scope
    var dist = origin + dist
    if (!this.cfg.bounce && !this.cfg.unlimit) {
      dist = Math.min(0, Math.max(dist, -1 * range))
    }
    _setDist(this.DOMBox, dist, isVertical)
    this.moveDist = dist
  }
  
  /**
   * 对slider的移动值做检测确定当前index
   * @type {Function} 
   */
  function _checkIndex () {
    var isVertical = this.isVertical,
      idx = this.currentIndex,
      unitDist = this.moveUnit,
      l = this.DOMItem.length,
      rl = this.stepLength,
      d = Math.abs(_distance),
      deltaIndex = 0
    //未触发滑动事件 _dir是0 不是boolean值
    if (_dir === 0) {return}
            
    if (this.cfg.unlimit) {
      _dir ? this.prev() : this.next()
    } else {
      //根据滑动距离判断划过了多少个item
      if (d > unitDist / 4) {
        deltaIndex = (_dir ? -1 : 1) * Math.ceil(d / unitDist)
      }
      idx = idx + deltaIndex
      idx = Math.max(0, Math.min(idx, this.stepLength - 1))
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
      l = this.stepLength,
      pb = this.DOMPrev,
      nb = this.DOMNext
      
    if (!cfg.unlimit) {
      //检查控制按钮状态
      if (idx === 0) {
        util.addClass(pb, 'disable')
      } else {
        util.removeClass(pb, 'disable')
      }
      if (idx === l - 1) {
        util.addClass(nb, 'disable')
      } else {
        util.removeClass(nb, 'disable')
      }
    } else {
      if (l === 1) {
        util.addClass(pb, 'disable')
        util.addClass(nb, 'disable')
      }
    }
  }
  
  /**
   * 高亮当前 index
   * @type {Function}
   */
  function _toggleStepTo () {
    var idx = this.currentIndex,
      l = this.stepLength,
      steps = this.DOMStepBox.querySelectorAll('.step')
     
    util.removeClass(steps, 'current')
    util.addClass(steps.item(idx % l), 'current')
  }
  
  /**
   * 提供一个接口让用户获得正确的当前索引
   * @type {Function} 
   */
  function _getIndex () {
    return this.currentIndex % this.stepLength
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
          idx = idx % that.stepLength
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
      rl = this.stepLength
      l = Math.ceil(this.DOMItem.length * this.itemSize / this.moveUnit)
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
   * slider定位到对应index
   * @type {Function} 
   * @param {Number} idx
   * @param {Number} duration 是否立即定位
   */
  function _moveTo (idx, duration) {
    var l = this.DOMItem.length,
      unitDist = this.moveUnit,
      range = this.scope,
      offset = this.cfg.offset,
      rl = this.stepLength,
      dist = 0
    
    if (this.cfg.unlimit) {
      if (rl > 1) {
        if (idx <= 0) {
          idx = rl
          this.setIndexTo(idx + 1)
        } else if (idx >= l - 1) {
          idx = l - 1 - rl
          this.setIndexTo(idx - 1)
        }
        dist = -1 * idx * unitDist + offset
      } else {
        idx = 0
        dist = offset
      }
    } else {
      idx = idx % l
      dist = Math.max(-1 * idx * unitDist + offset, -1 * range)
    }
    
    //if (!isImmediate && !this.cfg.noAnimate) {
      _setAni.call(this, this.touched ? this.moveDist : this.current, dist, this.cfg.noAnimate ? 0 : duration)
    //} else {
      //_setAni.call(this, dist, dist, 0)
    //}
    
    this.currentIndex = idx
    this.current = dist
    
    if (this.DOMStepBox) {_toggleStepTo.apply(this)}
    if (this.cfg.ctrlBtn) {_checkCtrlBtn.apply(this)}
    _setAutoPlay.apply(this)
    return this
  }
  
  /**
   * slider立即显示为对应index项
   * @type {Function} 
   * @param {Number} idx
   */
  function _setIndexTo (idx) {
    var isVertical = this.isVertical,
      l = this.stepLength,
      unitDist = this.moveUnit,
      offset = this.cfg.offset,
      dist
    if (idx.toString() === 'NaN') {return}
    dist = -1 * idx * unitDist + offset
    _setDist(this.DOMBox, dist, isVertical)
    this.currentIndex = idx
    this.current = dist
    return this
  }
  
  /**
   * slider往前滑动一项
   * @type {Function} 
   */
  function _prev () {
    var idx = this.currentIndex - 1
    var isLocked = this.checkLock() || this.checkLockPrev()
    if (isLocked) {return}
    if (this.cfg.unlimit) {
      this.moveTo(idx)
    } else {
      if (idx < 0) {return}
      this.moveTo(idx)
    }
    return this
  }
  
  /**
   * slider往后滑动一项
   * @type {Function} 
   */
  function _next () {
    var idx = this.currentIndex + 1
    var isLocked = this.checkLock() || this.checkLockNext()
    if (isLocked) {return}
    if (this.cfg.unlimit) {
      this.moveTo(idx)
    } else {
      if (idx >= this.stepLength) {return}
      this.moveTo(idx)
    }
    return this
  }
  
  /**
   * 刷新slider
   * @type {Function} 
   * @param {Object}
   */
  function _refresh (cfg) {
    
    this.cfg = _handleCfg(Object.assign(this.cfg, {index: this.currentIndex}, cfg))
    if (this.timer) {clearTimeout(this.timer)}
    _sliderCount--
    _init.apply(this)
    return this
  }
  
  /**
   * 回收实例对象
   * @type {Function} 
   */
  function _destroy () {
    var item = ''
    this.DOMWrap.off().remove()
    this.timer && clearTimeout(this.timer)
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
    this.cfg.drag && util.eventHandler.on(ev.start, this.DOMContent, function (e) {_touchstart.call(that, e)})
    if (!_bound) {
      this.cfg.drag && (
        util.eventHandler.on(ev.move, document, _touchmove),
        util.eventHandler.on(ev.end, document, _touchend),
        util.eventHandler.on(ev.cancel, document, _touchend)
      )
      _bound = true
    }
    !_mobileCheck && (
      util.eventHandler.on('mouseenter', this.DOMWrap, function () {
        that.timer && clearTimeout(that.timer)
      }),
      util.eventHandler.on('mouseleave', this.DOMWrap, function () {
        _setAutoPlay.apply(that)
      })
    )
  }
  
  /**
   * 移除监听事件
   * @type {Function} 
   */
  function _unbind () {
    util.eventHandler.off(ev.move, document)
    util.eventHandler.off(ev.end, document)
    util.eventHandler.off(ev.cancel, document)
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
    this.DOMBox = typeof dom === 'string' ? document.querySelector(dom) : (dom.item ? dom.item(0) : dom)
    this.cfg = _handleCfg(cfg || {})
    
    var _islocked = false
    
    /**
     * 检查当前是否锁定
     * @type {Function}
     */
    function _checkLock () {
      return _islocked
    }
    
    /**
     * 设置当前为锁定状态
     * @type {Function}
     */
    function _lock () {
      _islocked = true
      return this
    }
    
    /**
     * 解锁
     * @type {Function}
     */
    function _unlock () {
      _islocked = false
      return this
    }
    
    this.checkLock = _checkLock
    this.lock = _lock
    this.unlock = _unlock
    
    //锁定单方向
    var _isLockPrev = false,
      _isLockNext = false
      
    /**
     * 是否锁定前一项
     * @type {Function}
     */
    function _checkLockPrev () {
      return _isLockPrev
    }
    
    /**
     * 是否锁定后一项
     * @type {Function}
     */
    function _checkLockNext () {
      return _isLockNext
    }
    
    /**
     * 锁定前一项
     * @type {Function}
     */
    function _lockPrev () {
      _isLockPrev = true
      return this
    }
    
    /**
     * 解锁前一项
     * @type {Function}
     */
    function _unlockPrev () {
      _isLockPrev = false
      return this
    }
    
    /**
     * 锁定后一项
     * @type {Function}
     */
    function _lockNext () {
      _isLockNext = true
      return this
    }
    
    /**
     * 解锁后一项
     * @type {Function}
     */
    function _unlockNext () {
      _isLockNext = false
      return this
    }
    
    this.checkLockPrev = _checkLockPrev
    this.lockPrev = _lockPrev
    this.unlockPrev = _unlockPrev
    this.checkLockNext = _checkLockNext
    this.lockNext = _lockNext
    this.unlockNext = _unlockNext
    
    _init.apply(this)
    return this
  }
  
  NiceSlider.prototype = {
    prev: _prev,
    next: _next,
    setIndexTo: _setIndexTo,
    moveTo: _moveTo,
    getIndex: _getIndex,
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