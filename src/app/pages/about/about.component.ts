import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PhotoComponent } from '../../shared/photo/photo.component';
import { PHOTOS } from '../../shared/photos';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, PhotoComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  readonly photos = PHOTOS;

  readonly values = [
    {
      title: 'Help, not hurt',
      text: "Software should make your day easier and help you grow. If a tool gets in the way, it's the wrong tool.",
    },
    {
      title: 'Keep it practical',
      text: 'I build the smallest, sturdiest thing that solves the real problem, then improve it from there.',
    },
    {
      title: 'Straight talk',
      text: "You'll get honest answers in plain English, including when something isn't worth building.",
    },
  ];
}
