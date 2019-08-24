## 小程序嵌h5页面交互逻辑（示例：小程序页面跳实名h5再返回小程序页面）
### 场景
- 场景1：页面1 -> 去实名(实名成功) -> 返回页面1(数据状态更新)
- 场景2：页面1 -> 中间页 -> 去实名(实名成功) -> 返回页面1(数据状态更新)

### 解决方案
- 场景1：页面1 -> wx.navigateTo(带参数webviewUrl) -> h5实名承载页(只有一个webview标签) -> h5页面实名成功后执行wx.miniProgram.navigateBack() -> 页面1更新数据状态

- 场景2：页面1 -> wx.navigateTo -> 中间页 -> wx.redirectTo(带参数webviewUrl，同时中间页路由不在堆栈中) -> h5实名承载页(只有一个webview标签) -> h5页面实名成功后执行wx.miniProgram.navigateBack() -> 页面1更新数据状态

### webview承载页
```html
<web-view wx:if="webviewUrl" src="{{webviewUrl}}" />
```
```js
Page({
  data: {
    webviewUrl: ''
  },
  onShow(query) {
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
      url: '/pages/webview/index?'
    })
  },
  getWebUrl() {
    return 'https://yjh.com/webview'
  }
})
```
