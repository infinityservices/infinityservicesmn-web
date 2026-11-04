import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface PriceRow {
  name: string;
  price: string;
  examples: string;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss',
})
export class PricingComponent {
  readonly rows: PriceRow[] = [
    {
      name: 'Quick fixes',
      price: 'From $125',
      examples: 'A bug fix, a small change, or a settings tweak',
    },
    {
      name: 'Small tasks and automations',
      price: 'From $300',
      examples: 'A report, an export, a form, or a spreadsheet automation',
    },
    {
      name: 'Integrations and custom tools',
      price: 'From $600',
      examples: 'Connecting two systems, or a simple dashboard or internal app',
    },
    {
      name: 'Monthly support',
      price: 'From $75/month',
      examples: 'Backups, updates, and help when you need it',
    },
  ];
}
