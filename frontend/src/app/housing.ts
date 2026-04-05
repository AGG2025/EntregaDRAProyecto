import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Listing} from './housinglocation';

@Injectable({
  providedIn: 'root',
})
export class HousingService {
  private listingSubject = new BehaviorSubject<Listing[]>([]);
  listings$: Observable<Listing[]> = this.listingSubject.asObservable();
  private loadedSubject = new BehaviorSubject<boolean>(false);
  loaded$ = this.loadedSubject.asObservable();
  private loading = false;

  constructor(private http: HttpClient) {
    this.loadListings();
  }

  ensureLoaded() {
    if (!this.loadedSubject.value && !this.loading) {
      this.loadListings();
    }
  }

  private loadListings() {
    this.loading = true;
    this.http
      .get<Omit<Listing, 'id'>[]>('/assets/almeria_pisos.json')
      .pipe(
        map((data) =>
          data.map((item, idx) => {
            const details = item.detalles || '';
            const bedMatch = details.match(/(\d+)\s*hab/i);
            const bedrooms = bedMatch ? parseInt(bedMatch[1], 10) : undefined;
            const areaMatch = details.match(/(\d+)\s*m\s*(?:\u00b2|2)/i);
            const areaM2 = areaMatch ? parseInt(areaMatch[1], 10) : undefined;
            const discounted = /Ha bajado/i.test(item.precio);
            return {id: idx, ...item, bedrooms, areaM2, discounted};
          }),
        ),
      )
      .subscribe({
        next: (list) => {
          this.listingSubject.next(list);
          this.loadedSubject.next(true);
          this.loading = false;
        },
        error: (err) => {
          console.error('Failed to load listings', err);
          this.loadedSubject.next(true);
          this.loading = false;
        },
      });
  }

  getAllHousingLocations(): Listing[] {
    return this.listingSubject.value;
  }

  getHousingLocationById(id: number): Listing | undefined {
    return this.listingSubject.value.find((listing) => listing.id === id);
  }

  submitApplication(firstName: string, lastName: string, email: string) {
    console.log(
      `Homes application received: firstName: ${firstName}, lastName: ${lastName}, email: ${email}.`,
    );
  }
}
