import {Component, input} from '@angular/core';
import {Listing} from '../housinglocation';
import {RouterLink} from '@angular/router';
@Component({
  selector: 'app-housing-location',
  imports: [RouterLink],
  template: `
    <section class="listing">
      <div class="listing-header">
        <p class="listing-price">{{ housingLocation().precio }}</p>
      </div>
      <div class="listing-info">
        <h2 class="listing-heading">{{ housingLocation().titulo }}</h2>
        <p class="listing-details">{{ housingLocation().detalles }}</p>
        <a [routerLink]="['/details', housingLocation().id]">Ver detalles</a>
      </div>
    </section>
  `,
  styleUrls: ['./housing-location.css'],
})
export class HousingLocation {
  housingLocation = input.required<Listing>();
}