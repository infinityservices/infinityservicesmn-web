import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
})
export class ServicesComponent {
  readonly offerings = [
    {
      title: 'Custom Web Applications',
      description:
        'Purpose-built software for how your business actually operates — not a generic template stretched to fit. We handle everything from data modeling to the interface your team uses every day.',
    },
    {
      title: 'Systems Integration',
      description:
        'Your business already runs on a handful of tools — point of sale, accounting, e-commerce. We connect them so data moves automatically instead of getting re-typed by hand.',
    },
    {
      title: 'Workflow Automation',
      description:
        'If a task is repetitive, predictable, and currently done by a person in a spreadsheet, it is a candidate for automation. We find those tasks and build the software to replace them.',
    },
    {
      title: 'Ongoing Support & Maintenance',
      description:
        'Software is never really "done." We stay on as your team grows and your needs change, with the same people who built it in the first place.',
    },
  ];
}
