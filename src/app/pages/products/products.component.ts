import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PhotoComponent } from '../../shared/photo/photo.component';
import { BETA_TOPIC, PROJECTS } from '../../shared/projects';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [RouterLink, PhotoComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent {
  readonly projects = PROJECTS;
  readonly betaTopic = BETA_TOPIC;
}
