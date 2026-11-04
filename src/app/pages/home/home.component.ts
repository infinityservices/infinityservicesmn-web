import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PhotoComponent } from '../../shared/photo/photo.component';
import { PHOTOS } from '../../shared/photos';
import { BETA_TOPIC, PROJECTS } from '../../shared/projects';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, PhotoComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly photos = PHOTOS;
  readonly projects = PROJECTS;
  readonly betaTopic = BETA_TOPIC;

  readonly facts = [
    { value: '20+ years', label: 'in IT and full-stack development' },
    { value: 'One person', label: 'you work with me directly, start to finish' },
    { value: 'Any size', label: 'from a quick fix to a full app' },
  ];

  readonly services = [
    {
      title: 'Custom web and desktop apps',
      description:
        'Tools built around how your business already works. That includes connecting the data you have scattered across spreadsheets, storefronts, and accounting so it all lines up.',
      examples: ['Internal tools and dashboards', 'Data integrations', 'Automating the busywork'],
    },
    {
      title: 'Ongoing support',
      description:
        "Software needs looking after once it's running. I'll keep it updated, fix what breaks, and add what you need as your business grows.",
      examples: ['Updates and fixes', 'New features as you grow', 'A real person to talk to'],
    },
  ];

  readonly steps = [
    {
      title: 'We talk',
      text: "You tell me what's slowing you down. I ask a lot of questions, and you get a plain answer about what I'd build.",
    },
    {
      title: 'I build',
      text: 'I design the system using 20+ years of experience, then use AI tools to speed up the routine work. That keeps costs down, and every piece is reviewed and tested by me before you see it.',
    },
    {
      title: 'I stick around',
      text: "Once it's live, I keep it running and keep improving it with you.",
    },
  ];
}
