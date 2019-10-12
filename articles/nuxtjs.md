# 基于Nuxt.js项目的服务端性能优化与错误检测，容错处理

> [nuxt.js](https://zh.nuxtjs.org/guide/installation) 是一个基于 Vue.js 的服务端渲染应用框架，使用nuxt.js在做同构项目开发时，需要考虑的一些点总结如下：

## 一、node服务端性能优化（提高node应用程序处理高流量的能力）
> 基于nuxt.js的服务端渲染项目我们能做的服务端性能优化有以下几点（需要注意的是持久化缓存不应该在本地开发环境去做，这样在缓存期间不会暴露本地开发中代码的问题）

| 优化点 | 参考文档及思路 | 优化场景/条件 | 特别说明 | 检测方法 |
| ------- | ------- | ------- | ------- | ------- |
| 1. 页面缓存 | [vue官方文档](https://ssr.vuejs.org/zh/guide/caching.html#页面级别缓存-page-level-caching) | 页面内容不是用户特定（即对于相同的 URL，总是为所有用户渲染相同的内容） | 一般来说，一个页面在服务端做了持久化缓存，那么对应页面的存在的api缓存，组件缓存也就没有意义了，对于页面缓存与api缓存同时存在的情况下（有可能存在），api缓存的时间应该比页面缓存的时间小，这样是为了让api响应的内容保持最新 | 1、代码本地测试：在asyncData中打印测试日志，页面缓存后，刷新页面后服务端不会输出测试日志；2、比较html页面加载的DOMContentLoaded时间，刷新页面可以看到缓存后的值比首次页面加载(未缓存)的值要小
| 2. api缓存 | 在axios请求与响应拦截器中去做 | 接口响应内容不是用户特定（即对于相同的api接口URL，即总是为所有用户响应相同的内容) | 一般请求方式为GET的api请求 | 比较首次请求与缓存后的api接口响应的时间
| 3. 组件缓存 | [nuxtjs官网文档](https://zh.nuxtjs.org/faq/cached-components) <br> [vue 官网文档](https://ssr.vuejs.org/zh/guide/caching.html#组件级别缓存-component-level-caching) | 不依赖与全局状态，对渲染上下文不产生副作用的子组件 | 要缓存的组件name值必须唯一，serverCacheKey根据某个prop的值作为唯一key | 检测方法同页面缓存检测方法一致，这个可能几乎察觉不到
| 4. asyncData函数优化 | Promise.all | 该函数中请求api接口数超过1个，多的甚至达到10,20多个，这种情况我们不能使用async await，请求完一个再接着请求下一个(同步请求接口)；如果有10个接口需要请求，每个接口平均响应1s，那么至少需要10s才会响应html页面；如果使用Promise.all异步请求10个接口，那么最快接近1s响应html页面；| asyncData函数会在服务端执行代码，因此一定要做好容错处理；另外如果该函数代码一直未执行完，那么页面首次响应将会被挂起，一直处于加载中 | 对于页面首次加载，该函数执行耗时越短，页面响应时间就越短(页面加载越快)

### 1、页面缓存功能模块实现
> 我们在项目根目录中创建一个文件 `~/serverMiddleware/page-cache.js`
```js
import LRUCache from 'lru-cache'

const cache = new LRUCache({
  maxAge: 1000 * 60 * 2, // 有效期2分钟
  max: 1000 // 最大缓存数量
})

export default function(req, res, next) {
  // 本地开发环境不做页面缓存
  if (process.env.NODE_ENV !== 'development') {
    try {
      const cacheKey = req.url
      const cacheData = cache.get(cacheKey)
      if (cacheData) {
        return res.end(cacheData, 'utf8')
      }
      const originalEnd = res.end
      res.end = function(data) {
        cache.set(cacheKey, data)
        originalEnd.call(res, ...arguments)
      }
    } catch(error) {
      // console.log(`page-cache-middleware: ${error}`)
      next()
    }
  }
  next()
}
```

### 2、api缓存功能模块实现
> 我们在项目根目录中分别创建两个文件 `~/plugins/axios/createCacheKey.js` 与 `~/plugins/axios/cache.js`；特别坑的一点是nuxt.js开发环境cache.js插件代码在页面刷新，路由切换都相当于首次运行，因此你会发现缓存功能失效，只有在`process.env.NODE_ENV === 'production'`生产环境中测试有效

```js
// ～/plugins/axios/createCacheKey.js

import md5 from 'md5'

/**
 * 根据请求配置，是否是请求拦截器 创建缓存key
 * @param {Object} config
 * @param {Boolean} isRequest 
 */

export default function createCacheKey(
  config = {},
  isRequest = false
) {
  const {
    url,
    data,
    params,
    method,
    baseURL,
  } = config || {}

  let commonUrl = url

  /**
   * request拦截器中config.url是未拼接baseURL的，response拦截器中response.config.url是拼接过baseURL的，
   * 为了保持统一，使用统一拼接baseURL的commonUrl；注意下面的if条件判断
   */
  if (isRequest && !commonUrl.match(baseURL) && !commonUrl.match(/^https?/)) {
    commonUrl = !!baseURL.match(/.+\/$/) ? `${baseURL.replace(/\/$/, '')}${url}` : `${baseURL}${url}`
  }

  // 根据请求指令，url，body体，参数生成规则
  const rule = `method=${method}-url=${commonUrl}-data=${JSON.stringify(data || {})}-params=${JSON.stringify(params || {})}`

  // md5加密
  return md5(rule)
}
```

```js
// ～/plugins/axios/cache.js

import LRUCache from 'lru-cache'
import axios from 'axios'
import globalConfig from '../../global-config'
import createCacheKey from './createCacheKey'

const cache = new LRUCache({
  maxAge: 1000 * 60, // 有效期60秒，如果存在页面缓存，api缓存的时间应该比页面缓存的时间小，这样是为了让api响应的内容保持最新
  max: 1000 // 最大缓存数量
})

/**
 * matchCacheCondition 是否满足持久化缓存条件：服务端运行时 && 非本地开发环境 && api请求为get请求方式
 * @param {Object} config 请求配置
 */
function matchCacheCondition(config = {}) {
  return process.server && process.env.NODE_ENV !== 'development' && config.method.toLowerCase() === 'get'
}

/**
 * 如果所有页面都启用了缓存，api缓存就没有必要了
 */
export default function({ $axios, redirect }) {
  $axios.interceptors.request.use(config => {
    const { baseUrl } = globalConfig
    config.baseURL = baseUrl[process.env.environment] || baseUrl['other']

    // 不满足缓存条件直接return config
    if (!matchCacheCondition(config)) {
      return config
    }

    const cacheKey = createCacheKey(config, true)
    const cacheData = cache.get(cacheKey)

    if (cacheData) {
      const source = axios.CancelToken.source()
      config.cancelToken = source.token
      source.cancel({ cacheData, cacheKey, url: config.url })
      return config
    }

    return config
  })

  $axios.interceptors.response.use(response => {
    if (matchCacheCondition(response.config)) {
      cache.set(createCacheKey(response.config), response)
    }
    return response
  }, (error) => {
    if (axios.isCancel(error) && matchCacheCondition(response.config)) {
      // console.log(`当前页面组件asyncData或者fetch函数中被缓存的接口url为：${error.message.url}`)
      return Promise.resolve(error.message.cacheData)
    }

    // 服务端打印api接口请求错误日志
    if (process.server) {
      try {
        const {
          config: {
            url
          },
          message
        } = error || {}
        console.log(`请求url：${url}，错误消息：${message}`)
      } catch(error) {
        // console.log(error)
      }
    }

    // 服务端，客户端统一reject错误对象，因此页面组件asyncData，fetch函数请求api接口一定要做catch处理
    return Promise.reject(error)
  })
}
```

### 3、组件缓存
> vue官网文档原话：如果 renderer 在组件渲染过程中进行缓存命中，那么它将直接重新使用整个子树的缓存结果。这意味着在以下情况，你不应该缓存组件：
- 它具有可能依赖于全局状态的子组件。
- 它具有对渲染上下文产生副作用(side effect)的子组件。
> 因此，应该小心使用组件缓存来解决性能瓶颈。在大多数情况下，你不应该也不需要缓存单一实例组件。适用于缓存的最常见类型的组件，是在大的 v-for 列表中重复出现的组件。由于这些组件通常由数据库集合(database collection)中的对象驱动，它们可以使用简单的缓存策略：使用其唯一 id，再加上最后更新的时间戳，来生成其缓存键(cache key)：
```js
serverCacheKey: props => props.item.id + '::' + props.item.last_updated
```

### 4、页面组件asyncData函数优化
> 举一个简单的例子进行优化
```js
{
  async asyncData({ $axios }) {
    // 1、增加catch处理，是为了让服务端，客户端运行时不报错，特别是防止服务端运行时不报错，不然页面就挂了
    // 2、catch函数返回一个resolve空字面量对象的Promise，表明dataPromise1的状态未来始终是resolved状态
    const dataPromise1 = $axios.get('/api/data1').catch(() => Promise.resolve({}))

    const dataPromise2 = $axios.get('/api/data2').catch(() => Promise.resolve({}))
    const dataPromise3 = $axios.get('/api/data3').catch(() => Promise.resolve({}))
    const dataPromise4 = $axios.get('/api/data4').catch(() => Promise.resolve({}))
    const dataPromise5 = $axios.get('/api/data5').catch(() => Promise.resolve({}))
    const dataPromise6 = $axios.get('/api/data6').catch(() => Promise.resolve({}))
    const dataPromise7 = $axios.get('/api/data7').catch(() => Promise.resolve({}))
    const dataPromise8 = $axios.get('/api/data8').catch(() => Promise.resolve({}))

    // 保证apiData有数据
    const apiData = await new Promise(resolve => {
      Promise.all([
        dataPromise1, dataPromise2, dataPromise3, dataPromise4,
        dataPromise5, dataPromise6, dataPromise7, dataPromise8,
      ])
        .then(dataGather => {
          resolve({
            data1: dataGather[0],
            data2: dataGather[1],
            data3: dataGather[2],
            data4: dataGather[3],
            data5: dataGather[4],
            data6: dataGather[5],
            data7: dataGather[6],
            data8: dataGather[7],
          })
        })
    })

    return apiData
  }
}
```


## 二、node服务端错误检测，容错处理（提高node应用程序处理容错的能力）
> 首先确定使用nuxt.js框架，vue组件(页面/非页面组件)中以下函数都会在服务端执行，因此代码容错非常重要，函数代码执行一旦出错，页面就挂了
- fetch
- asyncData
- beforeCreate 
- created

### 1、看的见的错误
> 看的见的错误是指在开发环境中，你只要在fetch等以上函数中js执行错误，本地就会有错误提示，便于你发现纠正错误代码逻辑

### 2、未知/看不见的错误（让未知错误暴露出来）
> 看不见的错误是指一些异步回调中的错误代码不容易被发现，如果异步行为一直没有触发，那么处理该异步行为的回调代码也不会执行；但是对于处理所有页面的api接口请求回调的错误排查（主要是做容错处理，使代码更加健壮，java接口请求404、接口数据字段/结构的处理）我们能够做好，很简单，我们只需要在请求拦截器中把请求url更改就可以
```js
$axios.interceptors.request.use(config => {
  // TODO
  // 检测由于请求java接口失败而导致的node应用程序错误
  config.url += '/xxxx'

  return config
})
```

### 3、对于页面刷新加载不需要渲染的数据的处理
> 只有页面组件asyncData（函数返回的对象跟组件data融合），fetch（更新store操作）函数处理的数据跟页面绑定后，页面刷新加载服务端才会渲染；因此不建议组件在beforeCreate,created函数中通过请求api接口获取页面刷新加载不需要渲染的数据，只需要在mounted函数中处理即可，防止由于代码错误导致node应用程序出错
