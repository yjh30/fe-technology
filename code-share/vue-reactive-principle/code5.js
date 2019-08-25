订阅数据更新的到底是谁，我们先看看如下场景

<!-- 场景1 -->
<div>名字：{{ userInfo.name }}，全名：{{ fullName }}</div>

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