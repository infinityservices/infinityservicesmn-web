import { Component } from '@angular/core';

interface Product {
  name: string;
  tagline: string;
  description: string;
  features: string[];
  url: string;
}

@Component({
  selector: 'app-products',
  standalone: true,
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent {
  readonly products: Product[] = [
    {
      name: 'InfiniHerd',
      tagline: 'Livestock management for Minnesota feedlots',
      description:
        'A livestock management app covering animals, breeding, hay and feed inventory, health and vaccination tracking (including bulk/mass vaccination), reporting, and Minnesota/Goodhue County feedlot Animal Unit compliance.',
      features: [
        'Animal, breeding, and health records',
        'Feed and hay inventory tracking',
        'Bulk vaccination workflows',
        'MN feedlot Animal Unit compliance reporting',
      ],
      url: 'https://www.infiniherd.app',
    },
    {
      name: 'InfiniTrack',
      tagline: 'Inventory management with FIFO cost tracking',
      description:
        'Inventory management with FIFO COGS calculations and Wix integration, built to keep stock counts, costs, and online storefronts in sync automatically.',
      features: [
        'FIFO cost-of-goods-sold calculations',
        'Wix storefront integration',
        'Barcode generation and scanning',
        'Automated reporting exports',
      ],
      url: 'https://infinitrack.app',
    },
  ];
}
