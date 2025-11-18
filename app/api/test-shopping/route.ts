import { NextRequest, NextResponse } from 'next/server';

/**
 * Test Shopping API Endpoint
 *
 * Returns mock shopping message for E2E testing.
 * This simulates what the chat API would return when products are found.
 */
export async function GET(request: NextRequest) {
  try {
    // Mock shopping products matching test expectations
    const mockProducts = [
    {
      id: '1',
      name: 'Wireless Headphones',
      price: 99.99,
      salePrice: 79.99,
      image: 'https://via.placeholder.com/400x400/000000/FFFFFF?text=Headphones',
      images: [
        'https://via.placeholder.com/400x400/000000/FFFFFF?text=Headphones',
        'https://via.placeholder.com/400x400/111111/FFFFFF?text=Side+View',
      ],
      permalink: 'wireless-headphones',
      stockStatus: 'instock' as const,
      shortDescription: 'Premium wireless headphones with noise cancellation',
    },
    {
      id: '2',
      name: 'Sport Earbuds',
      price: 49.99,
      image: 'https://via.placeholder.com/400x400/000000/FFFFFF?text=Earbuds',
      images: [
        'https://via.placeholder.com/400x400/000000/FFFFFF?text=Earbuds',
      ],
      permalink: 'sport-earbuds',
      stockStatus: 'instock' as const,
      shortDescription: 'Water-resistant earbuds for active lifestyles',
    },
    {
      id: '3',
      name: 'Studio Monitor Headphones',
      price: 199.99,
      salePrice: 149.99,
      image: 'https://via.placeholder.com/400x400/000000/FFFFFF?text=Studio',
      images: [
        'https://via.placeholder.com/400x400/000000/FFFFFF?text=Studio',
      ],
      permalink: 'studio-monitor-headphones',
      stockStatus: 'instock' as const,
      shortDescription: 'Professional-grade studio monitoring headphones',
    },
    {
      id: '4',
      name: 'Kids Headphones',
      price: 29.99,
      image: 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Kids',
      images: [
        'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Kids',
      ],
      permalink: 'kids-headphones',
      stockStatus: 'instock' as const,
      shortDescription: 'Safe volume-limited headphones for children',
    },
    {
      id: '5',
      name: 'Gaming Headset',
      price: 129.99,
      image: 'https://via.placeholder.com/400x400/000000/00FF00?text=Gaming',
      images: [
        'https://via.placeholder.com/400x400/000000/00FF00?text=Gaming',
      ],
      permalink: 'gaming-headset',
      stockStatus: 'instock' as const,
      shortDescription: '7.1 surround sound gaming headset with RGB lighting',
    },
  ];

    // Return mock chat response with shopping metadata
    return NextResponse.json({
      role: 'assistant',
      content: 'I found 5 great headphones for you!',
      metadata: {
        shoppingProducts: mockProducts,
        shoppingContext: 'Search results for "headphones"',
      },
    });
  } catch (error) {
    console.error('[Test Shopping] Error generating mock response:', error);
    return NextResponse.json(
      { error: 'Failed to generate test shopping data' },
      { status: 500 }
    );
  }
}
