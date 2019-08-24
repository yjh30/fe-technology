## 小程序嵌h5页面交互逻辑（示例：小程序页面跳实名h5再返回小程序页面）

### 认识小程序webview
> 小程序web-view组件虽然会铺满整个页面，但可以理解为它类似小程序页面的一个浮层，它并不会往路由历史记录堆栈中添加记录；微信小程序web-viwe承载的web网页向小程序 postMessage 时，会在特定时机（小程序后退、组件销毁、分享）触发并收到消息。e.detail = { data }，data是多次 postMessage 的参数组成的数组

1. [微信小程序webview](https://developers.weixin.qq.com/miniprogram/dev/component/web-view.html)
2. [支付宝小程序webview](https://docs.alipay.com/mini/component/web-view)
3. [网友小程序webview开发记录](https://www.jianshu.com/p/da8d5ce5c8a7)


### 场景
- 场景1：页面1 -> 去实名(实名成功) -> 返回页面1(数据状态更新)
- 场景2：页面1 -> 页面2 -> 去实名(实名成功) -> 返回页面1(数据状态更新)

### 解决方案
- 场景1：页面1 -> wx.navigateTo(带参数webviewUrl) -> h5实名承载页(只有一个webview标签) -> h5页面实名成功后执行wx.miniProgram.navigateBack()退出/关闭webview承载页 -> 页面1更新数据状态

- 场景2：页面1 -> wx.navigateTo -> 页面2 -> wx.redirectTo(带参数webviewUrl，同时页面2路由不在堆栈中) -> h5实名承载页(只有一个webview标签) -> h5页面实名成功后执行wx.miniProgram.navigateBack()退出/关闭webview承载页 -> 页面1更新数据状态

### webview承载页
```html
<web-view wx:if="webviewUrl" src="{{webviewUrl}}" />
```
```js
Page({
  data: {
    webviewUrl: ''
  },
  onLoad(query) {
    const { url } = query
    if (url) {
      this.setData({
        webviewUrl: decodeURIComponent(url)
      })
    }
  }
})
```

### 数据更新状态逻辑处理
> 当h5实名成功后需要返回小程序页面，同时页面可能需要更新数据状态，这里提供自己认为较合理的思路：记录点击去实名按钮的状态isClickWebview，然后在页面显示/切入前台onShow钩子中判断isClickWebview，如果为true则更新数据状态逻辑，同时设置isClickWebview为false

```js
Page({
  data: {
    isClickWebview: false
  },
  onShow() {
    if (isClickWebview) {
      // 更新数据状态业务逻辑
      this.setData({
        isClickWebview: false
      })
    }
  },
  async gotoWebview() {
    // 这里不光只是记录isClickWebview，还可以记录操作数据的某些字段
    this.setData({
      isClickWebview: true
    })

    const webUrl = await this.getWebUrl()
    wx.navigateTo({
      url: `/pages/webview/index?url=${webUrl}`
    })
  },
  getWebUrl() {
    return 'https://yjh.com/webview'
  }
})
```
