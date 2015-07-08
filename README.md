# NiceSlider
轻量级移动端滑动组件

目前组件仍有一些限制及缺陷：

- 只支持左右滑动；
- PC现代浏览器中仅支持FF与chrome, IE 9+未测试；
- 在一屏多个滑动项暴露的情况下，索引值显示存在问题。

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

配置名 | 类型 | 默认值 | 说明
---- | ---- | ---- | ----
unlimit | Boolean | true | 是否实现无缝循环
ctrlBtn | Boolean | true | 是否加上左右控制按钮
indexBtn | Boolean | true | 是否加上索引元素
indexFormat | Function | - | 自定义索引元素内容
offset | Number | 0 | 偏移值
index | Number | 0 | 初始显示序号
autoPlay | Boolean | false | 自动播放
duration | Number | 5000 | 自动播放间隔时间
bounce | Boolean | true | 非无缝循环时，是否支持边界回弹效果
drag | Boolean | true | 支持手势拖拽滑动
indexBind | Boolean | true | 索引元素点击触发定位
noAnimate | Boolean | false | 关闭动画

## 方法

方法名 | 参数 | 说明
---- | ---- | ----
prev | - | 滑向前一项
next | - | 滑向后一项
setIndexTo | Number | 立即定位至某项
moveTo | Number | 滑动至某项
refresh | Object | 刷新组件，可以重新设定配置项
destroy | - | 销毁组件

---------------

### [查看DEMO](http://ajccom.sinaapp.com/demo/niceslider.html)


