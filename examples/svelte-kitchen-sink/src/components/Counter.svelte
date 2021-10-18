<script lang="ts">
  export let count = 0;

  function onIncrement() {
    count +=1 
  }

  function onDecrement() {
    count +=1 
  }
</script>

<div>
  <h1>Svelte - Counter</h1>
  <h2 data-testid="count">You clicked {count} times</h2>
  <button type="button" on:click={onDecrement}>Decrement</button>
  <button type="button" on:click={onIncrement}>Increment</button>
</div>
