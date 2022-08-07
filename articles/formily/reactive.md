# 细聊@formily/reactive
> [@formily/reactive](https://reactive.formilyjs.org/zh-CN/api/observable) 借鉴了[mobx](https://zh.mobx.js.org/observable-state.html)，学习@formily/reactive，实际上你也在学习mobx，学习vue3

#### 1、基本原理图
> 可以结合下图仔细看[官网api文档](https://reactive.formilyjs.org/zh-CN/guide/concept)

![svg](./%40formily%3Areactive.svg)

#### 2、主要api方法
> 以解说为主，具体示例去看[官网api方法](https://reactive.formilyjs.org/zh-CN/api/autorun)

- autorun：自动执行回调tracker，触发代理对象属性get劫持，收集依赖reaction
  - autorun.memo：在autorun回调tracker中执行，创建根据依赖是否发生变化的持久引用数据，注意：autorun.memo中的回调不会产生新的reaction依赖函数，如果回调中触发了某个代理对象属性的get劫持，收集的依赖reaction还是在当前autorun执行中生成的，当autorun回调中某个代理属性更新时会触发autorun回调函数tracker执行.<br>

  - autorun.effect：autorun.effect回调会在autorun执行生成的reaction函数中执行，首次或者autorun.effect依赖发生变化时加入到当前事件循环的微任务队列中去执行，如果autorun收集的依赖被解绑(disponse已执行)，那么autorun.effect回调不会执行<br>

- reaction：
  - 接受三个参数：计算函数，订阅函数，自定义触发订阅函数的配置对象；计算函数返回值发生变化，触发订阅函数；类似vue3中的watch方法；
  - 内部实现原理：执行依赖函数reaction调度器：依赖函数reaction执行后(内部执行计算函数，获取计算值)，再执行脏检查检测，判断是否执行action订阅函数
- batch
  - batch：定义批量操作，在触发set劫持执行依赖reaction时，会将依赖reaction添加到PendingReactions(Set去重)中，最后一次执行依赖reaction（有点类似去防抖）
  - batch.bound：与batch类似，唯一区别是batch.bound可以为第一个参数回调绑定执行上下文，比batch多一个参数context
  - batch.scope：与batch类似，唯一就是不处理去防抖，如果batch.scope回调触发了代理对象属性的set劫持会立即执行reaction依赖函数，源码中有所体现：
```ts
export const batchEnd = () => {
  BatchCount.value--
  // 类似去防抖，最后一次执行
  if (BatchCount.value === 0) {
    const prevUntrackCount = UntrackCount.value
    UntrackCount.value = 0
    executePendingReactions()
    executeBatchEndpoints()
    UntrackCount.value = prevUntrackCount
  }
}

export const batchScopeEnd = () => {
  const prevUntrackCount = UntrackCount.value
  BatchScope.value = false
  UntrackCount.value = 0
  // 立即执行
  PendingScopeReactions.batchDelete((reaction) => {
    if (isFn(reaction._scheduler)) {
      reaction._scheduler(reaction)
    } else {
      reaction()
    }
  })
  UntrackCount.value = prevUntrackCount
}
```
> 备注：batch内部不生成reaction依赖函数，但是batch/batch.scope回调函数可以触发代理对象属性的get劫持，收集当前依赖reaction

- action：与batch基本相同，action，action.bound，action.scope只不过他们的回调在执行过程中触发代理属性的get劫持时，源码内部`isUntracking()`为true，不会收集依赖，一般是作为领域模型设计的action方法<br>

- Tracker(class类)：原型track方法本身就是一个依赖函数reaction，类构造器参数为track方法的调度器scheduler，内部调度器执行之前会先dispose，然后执行scheduler，当下次代理对象属性set劫持后，由于已解绑，不会再次执行track方法（reaction依赖）了；否则我们需要手动在实例化Tracker类时的参数scheduler函数中执行track方法；如官方示例：
```ts
import { observable, Tracker } from '@formily/reactive'

const obs = observable({
  aa: 11,
})

// 视图渲染 or 更新
const view = () => {
  console.log(obs.aa)
}

const tracker = new Tracker(() => {
  tracker.track(view)
})

tracker.track(view)

obs.aa = 22

tracker.dispose()
```

- define：手动定义领域模型，实际就是使用 observable（deep,shallow,ref,box,computed）声明一个对象的部分属性为一个Proxy代理对象，action,batch声明 对象某些属性为方法...，触发reaction依赖执行，看[官方示例](https://reactive.formilyjs.org/zh-CN/api/define)<br>


- model：与define类似，只不过一个是显式/手动定义，model是隐式定义，看[官方示例](https://reactive.formilyjs.org/zh-CN/api/model)


#### 3、@formily/reactive-vue
当代理对象(@formily/reactive observable...)属性值更新时，会触发视图的强制更新，同时不影响vue内部源码代码逻辑；用官方的话说就是将组件渲染方法变成 Reaction，每次视图重新渲染就会收集依赖，依赖更新会自动重渲染。

![svg](./%40formily%3Areactive-vue.svg)

#### 4、与主流框架api对比（似曾相识）

##### 4.1、响应性基础api
| @formily/reactive | vue3 | react16.x 及以上版本 |
| -- | -- | -- |
| observable.deep | reactive ||
| observable.shallow | shallowReactive | useState |
| observable.ref | ref | useRef |
| observable.box | customRef 或者 computed ||
| observable.computed | computed | useMemo |
| markRaw | markRaw ||
| raw | toRaw ||
| isObservable | isReactive ||

##### 4.2、副作用函数api
| @formily/reactive | vue3 | react16.x 及以上版本 |
| -- | -- | -- |
| autorun | watchEffect | useEffect |
| reaction | watch ||
|  | watchPostEffect | useLayoutEffect |




