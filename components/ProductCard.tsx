'use client';

import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useState } from 'react';

interface Props {
  product: Product;
  wishlistIds?: string[];
  onWishlistChange?: () => void;
}

export default function ProductCard({ product, wishlistIds = [], onWishlistChange }: Props) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const { t, currency } = useLanguage();
  const [adding, setAdding] = useState(false);
  const [inWishlist, setInWishlist] = useState(wishlistIds.includes(product.id));

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setAdding(true);
    addItem(product, 1);
    setTimeout(() => setAdding(false), 600);
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    setInWishlist((value) => !value);
    onWishlistChange?.();
  };

  const discountAmount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : product.discountPercent || 0;

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="bg-white rounded-xl overflow-hidden border border-beige-100 hover:border-beige-200 hover:shadow-lg transition-all duration-300">
        {/* Image */}
        <div className="relative overflow-hidden bg-beige-50 aspect-square">
          {product.thumbnailUrl ? (
            <img
              src={product.thumbnailUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-beige-100">
              <ShoppingBag size={40} className="text-beige-300" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {discountAmount > 0 && (
              <span className="badge-discount">-{discountAmount}%</span>
            )}
            {product.isNew && !discountAmount && (
              <span className="badge-new">{t('card_new')}</span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              inWishlist
                ? 'bg-burgundy-700 text-white'
                : 'bg-white text-muted-foreground hover:bg-burgundy-50 hover:text-burgundy-700'
            } shadow-sm`}
          >
            <Heart size={14} fill={inWishlist ? 'currentColor' : 'none'} />
          </button>

          {/* Add to cart overlay */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-full bg-burgundy-700 text-white py-2.5 text-sm font-sans font-medium hover:bg-burgundy-900 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
            >
              <ShoppingBag size={14} />
              {product.stock === 0 ? t('card_out_of_stock') : adding ? t('card_added') : t('card_add_to_cart')}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          {(product as any).brand && (
            <p className="text-[11px] font-sans font-medium text-muted-foreground uppercase tracking-wider mb-1">
              {(product as any).brand.name}
            </p>
          )}
          <h3 className="text-sm font-sans font-medium text-foreground line-clamp-2 leading-snug mb-2">
            {product.name}
          </h3>
          <div className="flex items-center justify-between mt-auto">
            <div>
              <span className="text-base font-semibold font-sans text-foreground">{product.price.toFixed(2)} {currency}</span>
              {product.originalPrice && (
                <span className="text-xs font-sans text-muted-foreground line-through ml-2">
                  {product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            {product.stock <= 5 && product.stock > 0 && (
              <span className="text-[10px] text-orange-600 font-sans font-medium">{t('card_only_left')} {product.stock} {t('card_left')}</span>
            )}
            {product.stock === 0 && (
              <span className="text-[10px] text-red-500 font-sans font-medium">{t('card_out_of_stock')}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
