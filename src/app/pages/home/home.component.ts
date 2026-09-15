import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly services = [
    {
      title: 'Custom Web Applications',
      description: 'From internal tools to customer-facing products, built around how your business actually works.',
    },
    {
      title: 'Systems Integration',
      description: 'Connect the tools you already use — payments, e-commerce, accounting — into one coherent workflow.',
    },
    {
      title: 'Automation & Reporting',
      description: 'Replace manual spreadsheets and repetitive tasks with software that does it for you.',
    },
  ];
}
