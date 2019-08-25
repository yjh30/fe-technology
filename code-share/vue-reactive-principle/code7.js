class Observer {
  constructor(value) {
    this.value = value
    this.walk(value)
  }

  walk(obj) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i],)
    }
  }
}

function defineReactive(obj, key) {
  const dep = new Dep()
  Object.defineProperty(obj, key, {
    get() {
      // 依赖收集，收集订阅者Watcher实例
      dep.depend()
      // 数据被访问
      return obj.key
    },
    set(val) {
      if (val === obj.key) {
        return
      }
      // 数据更新了
      obj.key = val
      // 通知订阅者Watcher实例更新
      dep.notify()
    }
  })
}