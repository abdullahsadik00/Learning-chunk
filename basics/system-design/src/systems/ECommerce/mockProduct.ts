import type { Product, Review } from '@/types';

export const MOCK_PRODUCT: Product = {
  id: 'prod-1',
  name: 'Premium Wireless Headphones',
  description:
    'Studio-quality sound with active noise cancellation powered by our proprietary dual-microphone array, delivering up to 35dB of noise reduction in any environment. ' +
    'Crafted with premium memory-foam ear cushions and an aircraft-grade aluminum headband, they are engineered for all-day comfort without fatigue. ' +
    'With a 30-hour battery life, multipoint Bluetooth 5.3 pairing, and lossless audio support via USB-C, these headphones redefine what wireless listening can be.',
  price: 299,
  images: [
    'https://picsum.photos/seed/head1/600/400',
    'https://picsum.photos/seed/head2/600/400',
    'https://picsum.photos/seed/head3/600/400',
    'https://picsum.photos/seed/head4/600/400',
    'https://picsum.photos/seed/head5/600/400',
  ],
  variants: [
    {
      id: 'v1',
      name: 'Color',
      options: ['Midnight Black', 'Pearl White', 'Navy Blue'],
      stock: 5,
      price: 299,
    },
    {
      id: 'v2',
      name: 'Style',
      options: ['Over-Ear', 'On-Ear'],
      stock: 3,
      price: 299,
    },
  ],
  rating: 4.7,
  reviewCount: 1284,
  stock: 8,
  category: 'Audio',
};

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    author: 'Priya Mehta',
    avatar: 'https://i.pravatar.cc/40?u=priya',
    rating: 5,
    content:
      'Absolutely blown away by the noise cancellation. I work in a busy open-plan office and these headphones are the only way I can get into deep focus. Sound quality is warm and detailed — miles ahead of my previous pair.',
    createdAt: '2026-06-15T09:14:00Z',
    helpful: 142,
  },
  {
    id: 'rev-2',
    author: 'Marcus Thompson',
    avatar: 'https://i.pravatar.cc/40?u=marcus',
    rating: 5,
    content:
      'Best headphones I have ever owned. The 30-hour battery is not a gimmick — I charged them once last week and they are still going. Multipoint pairing between my MacBook and phone works flawlessly.',
    createdAt: '2026-06-12T14:30:00Z',
    helpful: 98,
  },
  {
    id: 'rev-3',
    author: 'Lena Fischer',
    avatar: 'https://i.pravatar.cc/40?u=lena',
    rating: 4,
    content:
      'Great sound and comfort. The only reason I am giving 4 stars instead of 5 is that the companion app occasionally loses connection, though a restart always fixes it. Hardware is 5/5.',
    createdAt: '2026-06-08T18:45:00Z',
    helpful: 67,
  },
  {
    id: 'rev-4',
    author: 'James O\'Connor',
    avatar: 'https://i.pravatar.cc/40?u=james',
    rating: 5,
    content:
      'I am a professional audio engineer and I was skeptical about wireless headphones for studio use. These changed my mind. The latency is imperceptible and the frequency response is remarkably flat.',
    createdAt: '2026-05-30T11:00:00Z',
    helpful: 213,
  },
  {
    id: 'rev-5',
    author: 'Aisha Oduya',
    avatar: 'https://i.pravatar.cc/40?u=aisha',
    rating: 3,
    content:
      'Good headphones but I expected more given the price point. The noise cancellation is excellent but the highs feel slightly harsh at louder volumes. Returns are hassle-free, so I kept them.',
    createdAt: '2026-05-22T08:20:00Z',
    helpful: 34,
  },
  {
    id: 'rev-6',
    author: 'Dmitri Volkov',
    avatar: 'https://i.pravatar.cc/40?u=dmitri',
    rating: 4,
    content:
      'Superb build quality. The aluminum headband feels premium and the ear cushions are the most comfortable I have tried. Pairing was instant on every device I tested.',
    createdAt: '2026-05-18T16:55:00Z',
    helpful: 55,
  },
  {
    id: 'rev-7',
    author: 'Clara Ng',
    avatar: 'https://i.pravatar.cc/40?u=clara',
    rating: 2,
    content:
      'Had connectivity issues from day one. Returned them and received a replacement which had the same problem. Customer service was responsive but could not resolve it. Disappointing for the price.',
    createdAt: '2026-05-10T13:10:00Z',
    helpful: 88,
  },
  {
    id: 'rev-8',
    author: 'Tobias Bauer',
    avatar: 'https://i.pravatar.cc/40?u=tobias',
    rating: 5,
    content:
      'I travel every week for work and these have become essential. The noise cancellation on long-haul flights is genuinely life-changing. Folds flat into the included case perfectly. 10/10.',
    createdAt: '2026-05-02T07:00:00Z',
    helpful: 176,
  },
];
