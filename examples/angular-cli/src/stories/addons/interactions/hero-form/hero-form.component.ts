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
  /**
   * This does not work on addon-controls as it is turned into a string
   * @ignore
   */
  model = new Hero(0, '', '', '');

  /**
   * This does not work on addon-controls as it is turned into a string
   * @ignore
   */
  powers = ['Really Smart', 'Super Flexible', 'Super Hot', 'Weather Changer'];

  submitting = false;

  submitted = false;

  onSubmit() {
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
