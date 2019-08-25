当我们在创建虚拟dom的过程中，也就是执行vm.$createElement方法，可能会在多个地方使用到同一个数据字段(如：vm.name)，即多个订阅者订阅了name的更新，因此在Vue中定义了一个发布订阅的Dep类
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