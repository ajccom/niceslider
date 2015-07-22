# NiceSlider
轻量级移动端滑动组件

目前NiceSlider的限制及缺陷：

- 依赖jQuery/Zepto。

目前NiceSlider具备的能力：

- 自带控制按钮与索引值；
- 自定义索引值；
- 支持多slider嵌套；
- 双向滑动锁定；
- 单向滑动锁定；
- 自定义偏移值；
- 支持无缝循环；
- 支持重置刷新；
- 自定义动画；
- 支持回弹；
- 自动播放；
- 手势拖拽。

使用NiceSlider的优势：

- 体积小，压缩后(开启gzip)文件大小只有3.5K；
- 配置丰富，能满足大多数slider需求；
- 完美支持桌面与移动端。

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

`new NiceSlider('#slider1', config)`

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

## 方法

方法名 | 参数 | 说明
---- | ---- | ----
prev | - | 滑向前一项
next | - | 滑向后一项
setIndexTo | index | 立即定位至某项，不推荐使用，建议用moveTo替代
moveTo | index, isImmediate | 滑动至某项, 第二个参数决定是否跳过动画，立即定位
getIndex | - | 获取组件当前的索引
checkLock | - | 获取组件双向锁定状态
lock | - | 锁定组件，锁定的组件将无法双向滑动
unlock | - | 解锁组件
checkLockPrev | - | 获取组件往前锁定状态
lockPrev | - | 锁定组件后将无法往前滑动
unlockPrev | - | 解锁组件
checkLockNext | - | 获取组件往后锁定状态
lockNext | - | 锁定组件后将无法往后滑动
unlockNext | - | 解锁组件
refresh | config | 刷新组件，可以重新设定配置项
destroy | - | 销毁组件

---------------

### [查看DEMO](http://ajccom.github.io/niceslider/)


