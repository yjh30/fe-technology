# 基于类的Vue组件开发分析
- [基于类的 Vue 组件开发文档](https://cn.vuejs.org/v2/guide/typescript.html#基于类的-Vue-组件)  
- [Vue支持JSX语法文档](https://cn.vuejs.org/v2/guide/render-function.html#JSX)

## 一、最佳实践示例
> 对于一个页面组件来说，一般除了抽离页面组件的公共组件以外，还应该将页面组件的 模版，数据，方法与主组件模块分离，便于项目代码可读及维护

```html
<!-- 组件模版（可以单独创建一个文件导入）-->
<div @click="printName">您好，{{aliasName}}先生！</div>
```

```jsx
import Vue from 'vue';
import Component, { mixins } from 'vue-class-component';

/**
 * 页面组件数据模型（可以单独创建一个文件导入）
 */
@Component
class Model extends Vue {
  public aliasName: string = '重华';
  // ... 其他数据模型定义
}

/**
 * 页面组件方法（可以单独创建一个文件导入）
 */
// tslint:disable-next-line:max-classes-per-file
@Component
class Actions extends mixins(Model) {
  public printName(): void {
    window.console.log(this.aliasName);
  }
  // ... 其他方法定义
}

/**
 * 页面组件逻辑
 */
Component.registerHooks([
  'beforeRouteEnter',
  'beforeRouteLeave',
  // 'beforeRouteUpdate' // for vue-router 2.2+
])

// tslint:disable-next-line:max-classes-per-file
@Component({
  // 所有的组件选项都可以放在这里
})
export default class Page extends mixins(Actions) {
  beforeRouteEnter(to: any, from: any, next: any) {
    // TODO
    next();
  }

  beforeRouteLeave(to: any, from: any, next: any) {
    // TODO
    next();
  }
}
```

## 二、[vue-class-component](https://github.com/vuejs/vue-class-component)模块分析
> Vue官方基于类的Vue组件开发就是使用[vue-class-component](https://github.com/vuejs/vue-class-component)模块的，下面具体分析该模块

### 装饰器模块 Component
> 具体使用见示例，主要职能是装饰class类
1. 处理类hooks成员，以下hooks成员将转换为Vue组件hooks
```js
const $internalHooks = [
  'data',
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeDestroy',
  'destroyed',
  'beforeUpdate',
  'updated',
  'activated',
  'deactivated',
  'render',
  'errorCaptured',
  'serverPrefetch' // 2.6
];
```
2. 处理类的方法，将函数成员转换成Vue组件的方法methods
3. 处理类的 拥有存储器(getter/setter)属性的成员，将拥有存储器属性的成员转换为Vue组件computed选项处理
4. 处理类的 值不为undefined的数据属性成员，将值不为undefined的成员通过混入(mixins)转换为Vue组件data选项处理；实现逻辑很有意思，因为数据属性成员是类的实例对象属性，因此在内部通过实例化Component组件类，通过实例对象获取Component组件类定义的数据属性成员，然后再通过混入(mixins)转换为要返回构造的Vue组件data选项处理
5. 
```js
@Component({
  props: {
    name: {
      type: String,
      default: '杨君华',
    }
  }
})
export default class Page extends mixins(Actions) {
  // ...
}
```
处理上述代码段中的props选项，装饰器Component将props中的成员通过混入(mixins)转换为Vue组件data选项处理；实现逻辑跟第4步相关，内部将props的成员代理proxy到第4步过程中的Component组件实例上，然后通过Object.keys遍历实例，将类的数据属性成员及props中的成员一起混入(mixins)转换为Vue组件data选项处理

6. 最后返回一个通过`Vue.extend`构造的Vue子组件

### 装饰器模块 mixins
> mixins给我们提供了一个混入组合的功能，具体使用见最佳实践示例，代码虽然很简单，然而在处理业务非常复杂的页面组件时却给我们提供了代码模块分离的机会，源码如下：
```js
function mixins() {
  var Ctors = [];
  for (var _i = 0; _i < arguments.length; _i++) {
    Ctors[_i] = arguments[_i];
  }
  return Vue.extend({ mixins: Ctors });
}
```

### 装饰器模块 createDecorator
> [JS装饰者模式及其应用](https://github.com/yjh30/js-decorator-and-apply)，createDecorator字面意思就是创建装饰器，一般用来修饰class类的成员，通过createDecorator创建的装饰者将保存在装饰函数Component.__decorators__属性队列中，伴随装饰函数Component一起运行，使用见如下示例：
```js
// decorators.js
import { createDecorator } from 'vue-class-component'

export const NoCache = createDecorator((options, key) => {
  // component options should be passed to the callback
  // and update for the options object affect the component
  options.computed[key].cache = false
})
import { NoCache } from './decorators'

@Component
class MyComp extends Vue {
  // the computed property will not be cached
  @NoCache
  get random () {
    return Math.random()
  }
}
```
