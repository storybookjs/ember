import { Component } from '@angular/core';

@Component({
  selector: 'my-counter',
  template: `
    <div>
      <h1>Angular - Counter</h1>
      <h2 data-testid="count">You clicked {{ count }} times</h2>
      <button type="button" (click)="decrement()">Decrement</button>
      <button type="button" (click)="increment()">Increment</button>
    </div>
  `,
})
export class CounterComponent {
  count = 0;

  increment() {
    this.count += 1;
  }

  decrement() {
    this.count -= 1;
  }
}
