# NiceSlider
轻量级移动端滑动组件

目前组件仍有一些限制及缺陷：

- IE8及以下版本不支持；
- 依赖jQuery/Zepto。

## 用法

创建一个父元素，将需要滑动显示的内容放入父元素中，比如：

```
<ul id="slider1">
  <li>item 1 </li>
  <li>item 2 </li>
  <li>item 3 </li>
</ul>
```

然后基于父元素创建组件:

```
var slider = new NiceSlider('#slider1')
```

-------------------------------------

## 配置

`new NiceSlider('#slider1', ***config***)`

配置名 | 类型 | 默认值 | 说明
---- | ---- | ---- | ----
unlimit | Boolean | true | 是否实现无缝循环
ctrlBtn | Boolean | true | 是否加上左右控制按钮
indexBtn | Boolean | true | 是否加上索引元素
indexFormat | Function | - | 自定义索引元素内容
offset | Number | 0 | 偏移值
index | Number | 0 | 初始显示序号
dir | String | 'h' | 滑动方向
autoPlay | Boolean | false | 自动播放
duration | Number | 5000 | 自动播放间隔时间
bounce | Boolean | true | 非无缝循环时，是否支持边界回弹效果
drag | Boolean | true | 支持手势拖拽滑动
indexBind | Boolean | true | 索引元素点击触发定位
noAnimate | Boolean | false | 关闭动画
animation | String | ease-out-back | 指定动画效果，可选的有`ease-out-back`，`linear`
extendAnimate | Object | - | 用于扩展动画效果，比如增加`swing`，`ease-in`等
fullMode | Boolean | slider项大小与可视区域一样，且无偏移的情况下建议开启，性能更优

## 方法

方法名 | 参数 | 说明
---- | ---- | ----
prev | - | 滑向前一项
next | - | 滑向后一项
setIndexTo | index | 立即定位至某项，推荐使用moveTo
moveTo | index, isImmediate | 滑动至某项, 第二个参数决定是否跳过动画，立即定位
refresh | config | 刷新组件，可以重新设定配置项
destroy | - | 销毁组件

---------------

### [查看DEMO](http://ajccom.github.io/niceslider/)


