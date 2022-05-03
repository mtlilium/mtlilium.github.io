<template>
  <div id="app2">
    <hello-world-component></hello-world-component>
  </div>
</template>

<script>


export default {
  data: function () {
    return {
      text: ""
    }
  },
  methods: {
    onclick: function () {
      console.log("おしたおｌ！！");
    }
  }
}
</script>
