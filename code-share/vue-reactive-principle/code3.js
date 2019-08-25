我们都知道 数据发生变化视图也随之更新，那么首先我们得知道如何监听数据的变化
class Observer {
  constructor(value) {
    this.value = value
    this.walk(value)
  }

  walk(obj) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }
}
function defineReactive(obj, key) {
  Object.defineProperty(obj, key, {
    get() {
      // 数据被访问
      return obj.key
    },
    set(val) {
      if (val === obj.key) {
        return
      }
      // 数据更新了
      obj.key = val
    }
  })
}
