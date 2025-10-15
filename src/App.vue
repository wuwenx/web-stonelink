<template>
  <div id="app">
    <DepthAggregatorV3 />
  </div>
</template>

<script>
import DepthAggregatorV3 from './components/DepthAggregatorV3.vue'

export default {
  name: 'App',
  components: {
    DepthAggregatorV3
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  min-height: 100vh;
}
</style>
