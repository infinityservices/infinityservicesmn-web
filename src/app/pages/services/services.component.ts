import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PhotoComponent } from '../../shared/photo/photo.component';
import { PHOTOS } from '../../shared/photos';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink, PhotoComponent],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
})
export class ServicesComponent {
  readonly offerings = [
    {
      title: 'Custom web and desktop apps',
      photo: PHOTOS.servicesApps,
      intro:
        "If you're juggling spreadsheets, copying numbers between programs, or bending an off-the-shelf tool to fit, I can build something that fits how you actually work. It can run in a browser, on your desktop, or both.",
      points: [
        'Internal tools, dashboards, and customer-facing apps',
        'Data integrations that connect payments, storefronts, accounting, and the spreadsheets you already have',
        'Automating the repetitive stuff, like reports, reorders, and data entry',
        'Built small first, so you see it working early',
      ],
    },
    {
      title: 'Ongoing support',
      photo: PHOTOS.servicesSupport,
      intro:
        "Launching is the start, not the end. I'll keep your software healthy and keep it growing with your business, whether I built it or someone else did.",
      points: [
        'Updates, security patches, and bug fixes',
        'New features when your needs change',
        'Help when something looks off',
        "You talk to me, not a ticket queue",
      ],
    },
  ];
}
