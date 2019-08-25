提问：我的公司地址，公司列表中第一个公司名 会展示吗？


<div class="test">
  <div>我的公司名：{{ myCompany.name }}</div>
  <div>我的公司地址：{{ myCompany.city }}</div>

  <div>公司列表中第一个公司名{{ companyList[0].name }}</div>
</div>

export default {
  data() {
    return {
      myCompany: {
        name: '杭州天谷信息科技有限公司',
      },
      companyList: [{
        name: '',
      }]
    }
  },

  created() {
    this.myCompany.city = '杭州'
    this.companyList[0].name = '杭州天谷信息科技有限公司'
  }
}
