import {Component} from '@angular/core';
import {Home} from './home/home';
import {RouterLink, RouterOutlet} from '@angular/router';
import {HttpClientModule} from '@angular/common/http';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, HttpClientModule],
  template: `
    <main>
      <header class="brand-name">
        <a [routerLink]="['/']">
          <span class="logo-text">FotoCasaScraper</span>
        </a>
      </header>
      <section class="content">
        <router-outlet />
      </section>
    </main>
  `,
  styleUrls: ['./app.css'],
})
export class App {
  title = 'homes';
}