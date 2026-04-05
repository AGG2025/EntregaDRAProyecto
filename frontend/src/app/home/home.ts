import {ChangeDetectorRef, Component, inject, OnInit, OnDestroy} from '@angular/core';
import {HousingLocation} from '../housing-location/housing-location';
import {Listing} from '../housinglocation';
import {HousingService} from '../housing';
import {Subscription} from 'rxjs';
@Component({
  selector: 'app-home',
  imports: [HousingLocation],
  template: `
    <section>
      <form (submit)="filterResults(filter.value, filterBarrio.value); $event.preventDefault()">
        <input
          type="text"
          placeholder="Buscar por palabra clave"
          #filter
          (input)="filterResults(filter.value, filterBarrio.value)"
          (keyup.enter)="filterResults(filter.value, filterBarrio.value)"
        />
        <input
          type="text"
          placeholder="Buscar por barrio"
          #filterBarrio
          (input)="filterResults(filter.value, filterBarrio.value)"
          (keyup.enter)="filterResults(filter.value, filterBarrio.value)"
        />
        <input
          type="number"
          placeholder="Min habitaciones"
          min="0"
          step="1"
          #beds
          (input)="minBedrooms = sanitizeNumberInput(beds); filterResults(filter.value, filterBarrio.value)"
        />
        <input
          type="number"
          placeholder="Min m²"
          min="0"
          step="1"
          #area
          (input)="minArea = sanitizeNumberInput(area); filterResults(filter.value, filterBarrio.value)"
        />
        <label class="discount-checkbox">
          <input type="checkbox" #disc (change)="showDiscountedOnly = disc.checked; filterResults(filter.value, filterBarrio.value)" />
          Sólo rebajados
        </label>
        <button class="primary" type="button" (click)="filterResults(filter.value, filterBarrio.value)">Buscar</button>
      </form>
    </section>
    <section class="results">
      @if(isLoading) {
        <p class="loading">Cargando inmuebles...</p>
      }
      @if(!isLoading && !filteredLocationList.length) {
        <p class="no-results">No se han encontrado inmuebles.</p>
      }
      @for (listing of filteredLocationList; track $index) {
        <app-housing-location [housingLocation]="listing" />
      }
    </section>
  `,
  styleUrls: ['./home.css'],
})
export class Home implements OnInit, OnDestroy {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  housingLocationList: Listing[] = [];
  housingService: HousingService = inject(HousingService);
  filteredLocationList: Listing[] = [];
  isLoading = true;

  currentFilter = '';
  currentBarrioFilter = '';
  minBedrooms?: number;
  minArea?: number;
  showDiscountedOnly = false;
  private subscription?: Subscription;
  private loadingSubscription?: Subscription;

  ngOnInit() {
    this.housingService.ensureLoaded();
    // subscribe to the service observable so we react to data load
    this.subscription = this.housingService.listings$.subscribe((list) => {
      this.housingLocationList = list;
      // reapply any filter text the user has already entered
      this.applyFilter(this.currentFilter, this.currentBarrioFilter);
    });
    this.loadingSubscription = this.housingService.loaded$.subscribe((loaded) => {
      this.isLoading = !loaded;
      this.changeDetectorRef.detectChanges();
    });
  }

  filterResults(text: string, barrio: string) {
    this.currentFilter = text;
    this.currentBarrioFilter = barrio;
    this.applyFilter(text, barrio);
  }

  sanitizeNumberInput(input: HTMLInputElement) {
    const raw = input.value.trim();
    if (!raw) {
      return undefined;
    }
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) {
      input.value = '';
      return undefined;
    }
    const clamped = Math.max(0, Math.floor(numeric));
    if (numeric !== clamped) {
      input.value = clamped ? String(clamped) : '';
    }
    return clamped || undefined;
  }

  private applyFilter(text: string, barrio: string) {
    const trimmed = (text || '').trim();
    const trimmedBarrio = (barrio || '').trim();
    const minBedrooms = this.minBedrooms != null ? Math.max(0, this.minBedrooms) : undefined;
    const minArea = this.minArea != null ? Math.max(0, this.minArea) : undefined;
    let results = this.housingLocationList;
    if (trimmed) {
      const lower = trimmed.toLowerCase();
      results = results.filter((listing) =>
        listing.titulo.toLowerCase().includes(lower) || listing.detalles.toLowerCase().includes(lower),
      );
    }
    if (trimmedBarrio) {
      const lowerBarrio = trimmedBarrio.toLowerCase();
      results = results.filter((listing) =>
        listing.barrio?.toLowerCase().includes(lowerBarrio),
      );
    }
    if (minBedrooms != null) {
      results = results.filter((l) => (l.bedrooms ?? 0) >= minBedrooms);
    }
    if (minArea != null) {
      results = results.filter((l) => (l.areaM2 ?? 0) >= minArea);
    }
    if (this.showDiscountedOnly) {
      results = results.filter((l) => l.discounted);
    }
    this.filteredLocationList = results;
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.loadingSubscription?.unsubscribe();
  }
}
