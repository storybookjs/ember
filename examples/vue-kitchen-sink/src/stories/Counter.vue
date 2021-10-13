<template>
  <div>
    <h1>Vue - Counter</h1>
    <h2 data-testid="count">You clicked {{count}} times</h2>
    <button type="button" @click="decrement">Decrement</button>
    <button type="button" @click="increment">Increment</button>
  </div>
</template>

<script>
export default {
  name: 'Counter',
  data() {
    return { count: 0 };
  },
  methods: {
    increment() {
      this.count++;
    },
    decrement() {
      this.count--;
    },
  },
};
</script>
