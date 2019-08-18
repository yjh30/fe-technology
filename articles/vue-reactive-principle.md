# 深入Vue.js响应式原理

## 一、创建一个Vue应用
```js
new Vue({
  data() {
    return {
      name: 'yjh',
    };
  },
  router,
  store,
  render: h => h(App),
}).$mount('#app');
```

## 二、实例化一个Vue应用到底发生了什么？
1. this._init()
2. callHook(vm, 'beforeCreate')
3. observe(vm._data)
```js
vm._data = vm.$options.data()
```
`proxy(vm, `_data`, key) 代理到vm上访问`
```js
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
```
4. callHook(vm, 'created')
5. mountComponent（vm.$mount执行后执行mountComponent）
6. callHook(vm, 'beforeMount')
7. new Watcher(vm, updateComponent)
```js
const updateComponent = () => {
  // 创建虚拟dom
  const vnode = vm._render()

  // 创建虚拟dom的过程等同于如下代码行
  // const vnode = vm.$options.render.call(vm, vm.$createElement)

  // 更新$el
  vm._update(vnode)
}
```
8. callHook(vm, 'mount')

在以上发生的行为当中，第3步与第7步两者相辅相成；也是我们最需要关心的，弄清楚这两者，vue响应式原理就基本掌握了


## 三、如何追踪数据变化
> 我们都知道 数据发生变化视图也随之更新，那么首先我们得知道如何监听数据的变化
```js
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
```

## 四、定义一个发布订阅的Dep类
> 当我们在创建虚拟dom的过程中，也就是执行vm.$createElement方法，可能会在多个地方使用到同一个数据字段(如：vm.name)，即多个订阅者订阅了name的更新，因此在Vue中定义了一个发布订阅的Dep类

```js
class Dep {
  constructor() {
    this.subs = []
  }

  addSub(sub) {
    this.subs.push(sub)
  }

  depend() {
    if (Dep.target) {
      this.addSub(Dep.target)
    }
  }

  notify() {
    this.subs.forEach(sub => sub.update())
  }

  removeSub(sub) {
    const i = this.subs.findIndex(sub)
    if (i > -1) {
      this.subs.splice(i, 1)
    }
  }
}
```

## 五、数据订阅者
> 订阅数据更新的到底是谁，我们先看看如下场景
```html
<!-- 场景1 -->
<div>名字：{{ userInfo.name }}，全名：{{ fullName }}</div>
```
```js
export default {
  data() {
    return {
      userInfo: {
        name: 'junhua',
      },
    }
  },
  mounted() {
    // 场景2
    this.$watch('name', (newVal, val) => {
      // ...
    })
  },
  // 场景2
  watch: {
    name(newVal, val) {
      // ...
    }
  },
  computed() {
    // 场景3
    fullName() {
      return `yang${this.userInfo.name}`
    }
  }
}
```
从上面示例代码看，订阅数据更新的场景有：
| 场景 | 详解
| ---------------- | -------- |
| 1. 模版插值 |		new Watcher(vm, updateComponent)数据发生变化，更新组件
| 2. vm.$watch |  监听单个数据做一些逻辑操作
| 3. computed使用场景 |  计算属性

因此数据订阅者包含一个参数expOrFn(`[Function|String]`),数据更新后需要执行的callback，如下：

```js
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
```

## 六、最终的观察者Observer
```js
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
```

## 七、总结
我们再来回顾下实例化Vue应用的最重要的两点
```js
observe(vm._data)
// vm.$mount()
const componentUpdateWatcher = new Watcher(vm, updateComponent)
```
updateComponent在更新渲染组件时，会访问1或多个数据模版插值，当访问数据时，将通过getter拦截器把componentUpdateWatcher作为订阅者添加到多个依赖中，每当其中一个数据有更新，将执行setter函数，对应的依赖将会通知订阅者componentUpdateWatcher执行update，即执行updateComponent；至此Vue数据响应式目的已达到，再来看官网的这张图片就很好理解了

<img width="700" height="438" src="https://cn.vuejs.org/images/data.png">
