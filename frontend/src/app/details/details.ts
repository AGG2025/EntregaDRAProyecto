import {Component, inject} from '@angular/core';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {HousingService} from '../housing';
import {Listing} from '../housinglocation';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
@Component({
  selector: 'app-details',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <article>
      <a class="back-link" [routerLink]="['/']">Volver</a>
      <section class="listing-description">
        <h2 class="listing-heading">{{ housingLocation?.titulo }}</h2>
        <p class="listing-price">{{ housingLocation?.precio }}</p>
      </section>
      <section class="listing-features">
        <h2 class="section-heading">Detalles</h2>
        <p>{{ housingLocation?.detalles }}</p>
      </section>
      <section class="listing-description">
        <p>{{ housingLocation?.descripcion_corta }}</p>
      </section>
      <section class="listing-external">
        <a [href]="housingLocation?.url" target="_blank" rel="noopener">Ver en Fotocasa</a>
      </section>
      <section class="listing-apply" *ngIf="housingLocation">
        <h2 class="section-heading">Contacta para más información</h2>
        <form [formGroup]="applyForm" (submit)="submitApplication()">
          <label for="first-name">Nombre</label>
          <input id="first-name" type="text" formControlName="firstName" />
          <label for="last-name">Apellidos</label>
          <input id="last-name" type="text" formControlName="lastName" />
          <label for="email">Email</label>
          <input id="email" type="email" formControlName="email" />
          <button type="submit" class="primary">Enviar</button>
        </form>
      </section>
    </article>
  `,
  styleUrls: ['./details.css'],
})
export class Details {
  route: ActivatedRoute = inject(ActivatedRoute);
  housingService = inject(HousingService);
  housingLocation: Listing | undefined;
  applyForm = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    email: new FormControl(''),
  });
  constructor() {
    const housingLocationId = parseInt(this.route.snapshot.params['id'], 10);
    this.housingLocation = this.housingService.getHousingLocationById(housingLocationId);
  }
  submitApplication() {
    this.housingService.submitApplication(
      this.applyForm.value.firstName ?? '',
      this.applyForm.value.lastName ?? '',
      this.applyForm.value.email ?? '',
    );
  }
}
