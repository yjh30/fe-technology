从上面示例代码看，订阅数据更新的场景有：

模版插值 ：new Watcher(vm, updateComponent)数据发生变化，更新组件
vm.$watch ： 监听单个数据做一些逻辑操作
computed使用场景：计算属性
因此数据订阅者包含一个参数expOrFn([Function|String]),数据更新后需要执行的callback，如下：

class Watcher {
  constructor(vm, expOrFn, cb) {
    this.vm = vm
      if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
    }
    this.cb = cb || () => {}
    this.value = this.get()
  }

  get() {
    Dep.target = this
    const value = this.getter.call(this.vm, this.vm)
    Dep.target = undefined
    return value
  }

  update() {
    const val = this.value
    const newVal = this.get()
    this.cb.call(this.vm, newVal, val)
  }
}