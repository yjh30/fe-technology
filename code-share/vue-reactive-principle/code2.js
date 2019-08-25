1. this._init()
2. callHook(vm, 'beforeCreate')
3. observe(vm._data)
// vm._data 解释
vm._data = vm.$options.data()
proxy(vm, _data, key) // 代理到vm上访问

function proxy(vm, _data, key)() {
  Object.defineProperty(target, key, {
    get() {
      return vm._data.key
    },
    set(val) {
      vm._data.key = val
    }
  })
}

4. callHook(vm, 'created')
5. mountComponent（vm.$mount执行后执行mountComponent）
6. callHook(vm, 'beforeMount')
7. new Watcher(vm, updateComponent)
const updateComponent = () => {
  // 创建虚拟dom
  const vnode = vm._render()

  // 创建虚拟dom的过程等同于如下代码行
  // const vnode = vm.$options.render.call(vm, vm.$createElement)

  // 更新$el
  vm._update(vnode)
}
8. callHook(vm, 'mount')
在以上发生的行为当中，第3步与第7步两者相辅相成；也是我们最需要关心的，弄清楚这两者，vue响应式原理就基本掌握了