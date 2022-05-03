// Vue.jsでスタイルは同じで処理の内容だけ違うボタンを実装
// 子コンポーネントからのイベントをハンドルするためには, 子コンポーネントから$emitでイベントを定義する必要がある
<template>
  <button @click="onClick"> // ボタンが押されたときに子コンポーネント自身が持っているメソッドを呼び出す
    <span>{{ buttonName }}</span>
  </button>
</template>
<script>
export default {
  name: "Button",
  props: {
    buttonName: {
      type: String,
      default: "null",
    },
  },
  methods: {
    onClick(event) {
      this.$emit('click', event) // このメソッド内で$emitでイベントを定義する第一引数にイベント名, 以降の引数に追加の引数を渡す
    }
  }
};
</script>
