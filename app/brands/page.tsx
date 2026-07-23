'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Brand } from '@/lib/types';

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const data = await api.get<Brand[]>('/brands');
      setBrands(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-cream py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-10 place-items-center">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-full aspect-square bg-beige-100/70 rounded-full animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-10 place-items-center">
            {brands.map(brand => (
              <Link
                key={brand.id}
                href={`/brands/${brand.id}`}
                className="group flex items-center justify-center w-full aspect-square rounded-full transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5"
              >
                {brand.logo_url || brand.logoUrl ? (
                  <img
                    src={brand.logo_url || brand.logoUrl || ''}
                    alt={brand.name}
                    className="w-3/5 h-3/5 object-contain transition-transform duration-300 ease-out group-hover:scale-110"
                  />
                ) : (
                  <span className="font-serif text-4xl text-beige-300 transition-colors duration-300 ease-out group-hover:text-burgundy-700">
                    {brand.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
