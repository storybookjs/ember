import { Component, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

class Hero {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    public id: number,
    public name: string,
    public power: string,
    public alterEgo?: string
  ) {}
}

@Component({
  selector: 'hero-form',
  templateUrl: './hero-form.component.html',
  styleUrls: ['./hero-form.component.css'],
})
export class HeroForm {
  model = new Hero(0, '', '', '');

  powers = ['Really Smart', 'Super Flexible', 'Super Hot', 'Weather Changer'];

  submitting = false;

  submitted = false;

  onSubmit(model) {
    // eslint-disable-next-line no-console
    console.log('Submitting hero', model);
    this.submitting = true;
    setTimeout(() => {
      this.submitted = true;
      this.submitting = false;
    }, 1000);
  }
}

@NgModule({
  declarations: [HeroForm],
  exports: [HeroForm],
  imports: [CommonModule, FormsModule],
})
export class HeroFormModule {}
