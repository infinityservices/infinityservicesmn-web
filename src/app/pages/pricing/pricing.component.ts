import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

interface Job {
  name: string;
  price: string;
  scope: string;
  examples: string;
}

interface Plan {
  name: string;
  price: string;
  time: string;
  response: string;
  includes: string[];
  featured?: boolean;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss',
})
export class PricingComponent implements OnInit, OnDestroy {
  private readonly meta = inject(Meta);

  readonly jobs: Job[] = [
    {
      name: 'Quick fix',
      price: '$125',
      scope: 'About an hour of work',
      examples: 'A bug fix, a small change, or a settings tweak',
    },
    {
      name: 'Small task',
      price: '$300–500',
      scope: 'A few hours',
      examples: 'A report, an export, a form, a script, or a spreadsheet automation',
    },
    {
      name: 'Simple integration',
      price: '$600–1,200',
      scope: 'Half a day to a day',
      examples: 'Connecting two systems, like a web form to a spreadsheet or your store to your accounting',
    },
    {
      name: 'Small custom tool',
      price: '$1,200–2,500',
      scope: 'One to two days',
      examples: 'A simple web page, dashboard, or internal app',
    },
  ];

  readonly plans: Plan[] = [
    {
      name: 'Basic',
      price: '$75',
      time: '30 minutes',
      response: 'Within 3 business days',
      includes: ['Uptime checks', 'Backups', 'Security updates'],
    },
    {
      name: 'Standard',
      price: '$150',
      time: '1.5 hours',
      response: 'Within 2 business days',
      includes: ['Everything in Basic', 'Small changes and fixes'],
      featured: true,
    },
    {
      name: 'Plus',
      price: '$275',
      time: '3 hours',
      response: 'Next business day',
      includes: ['Everything in Standard', 'A quarterly check-in call'],
    },
  ];

  ngOnInit(): void {
    // Draft page: keep it out of search results until it's ready to go live.
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnDestroy(): void {
    this.meta.removeTag('name="robots"');
  }
}
