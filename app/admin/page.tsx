'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Package, Tag, ShoppingBag, Users, Star, Settings,
  TrendingUp, AlertTriangle, Plus, Pencil, Trash2, Eye, Check, X, ChevronDown,
  Globe, LayoutGrid, Calendar, Hash, ArrowUpRight, Truck, FileText, Search,
  Image as ImageIcon, ChevronUp, Film
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Product, Category, Brand, Order } from '@/lib/types';
import MediaManager, { MediaItem } from '@/components/MediaManager';

type AdminTab = 'dashboard' | 'products' | 'categories' | 'brands' | 'orders' | 'factures' | 'shipping' | 'hero';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 border border-amber-200 text-amber-700',
  confirmed: 'bg-sky-50 border border-sky-200 text-sky-700',
  paid: 'bg-teal-50 border border-teal-200 text-teal-700',
  processing: 'bg-indigo-50 border border-indigo-200 text-indigo-700',
  shipped: 'bg-purple-50 border border-purple-200 text-purple-700',
  delivered: 'bg-emerald-50 border border-emerald-200 text-emerald-700',
  cancelled: 'bg-rose-50 border border-rose-200 text-rose-700',
  refunded: 'bg-slate-50 border border-slate-200 text-slate-700',
};

const ORDER_STATUSES = ['pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { t, locale, setLocale, currency, isRTL } = useLanguage();
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState({ orders: 0, revenue: 0, products: 0, customers: 0, brands: 0, categories: 0, low_stock: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [factures, setFactures] = useState<any[]>([]);
  const [factureFormOpen, setFactureFormOpen] = useState(false);
  const [factureForm, setFactureForm] = useState({ customerName: '', customerPhone: '', customerEmail: '', notes: '', items: [] as any[] });
  const [factureProductSearch, setFactureProductSearch] = useState('');
  const [factureQuantity, setFactureQuantity] = useState(1);
  const [facturePrice, setFacturePrice] = useState('0');
  const [factureSelectedProduct, setFactureSelectedProduct] = useState<any>(null);

  // Shipping Form State
  const [shippingFormOpen, setShippingFormOpen] = useState(false);
  const [shippingFormMode, setShippingFormMode] = useState<'create' | 'edit'>('create');
  const [shippingFormData, setShippingFormData] = useState({
    id: '',
    name: '',
    description: '',
    price: '0',
    isActive: true,
  });

  // Hero Slide Form State
  const [heroFormOpen, setHeroFormOpen] = useState(false);
  const [heroFormMode, setHeroFormMode] = useState<'create' | 'edit'>('create');
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroFormData, setHeroFormData] = useState({
    id: '',
    url: '',
    type: 'image' as 'image' | 'video',
    title: '',
    subtitle: '',
    ctaLabel: '',
    ctaHref: '',
    linkProductId: '',
    isActive: true,
  });

  // Product Form State
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [productFormMode, setProductFormMode] = useState<'create' | 'edit'>('create');
  const [productFormData, setProductFormData] = useState({
    id: '',
    name: '',
    description: '',
    shortDescription: '',
    brandId: '',
    categoryId: '',
    price: '0',
    originalPrice: '',
    discountPercent: '0',
    stock: '0',
    weight: '',
    dimensions: '',
    tags: '',
    thumbnailUrl: '',
    isFeatured: false,
    isNew: false,
    isActive: true,
    metaTitle: '',
    metaDescription: '',
    images: [] as MediaItem[],
  });

  const [tagInput, setTagInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Category Form State
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [categoryFormMode, setCategoryFormMode] = useState<'create' | 'edit'>('create');
  const [categoryFormData, setCategoryFormData] = useState({
    id: '',
    name: '',
    description: '',
    imageUrl: '',
    parentId: '',
    sortOrder: '0',
    isActive: true,
  });

  // Brand Form State
  const [brandFormOpen, setBrandFormOpen] = useState(false);
  const [brandFormMode, setBrandFormMode] = useState<'create' | 'edit'>('create');
  const [brandFormData, setBrandFormData] = useState({
    id: '',
    name: '',
    description: '',
    logoUrl: '',
    sortOrder: '0',
    isFeatured: false,
    isActive: true,
  });

  const resetProductForm = () => {
    setProductFormMode('create');
    setProductFormData({
      id: '',
      name: '',
      description: '',
      shortDescription: '',
      brandId: '',
      categoryId: '',
      price: '0',
      originalPrice: '',
      discountPercent: '0',
      stock: '0',
      weight: '',
      dimensions: '',
      tags: '',
      thumbnailUrl: '',
      isFeatured: false,
      isNew: false,
      isActive: true,
      metaTitle: '',
      metaDescription: '',
      images: [],
    });
    setTagInput('');
  };

  const openProductForm = (product?: Product) => {
    if (!product) {
      resetProductForm();
      setProductFormMode('create');
      setProductFormOpen(true);
      return;
    }

    setProductFormMode('edit');
    setProductFormData({
      id: product.id,
      name: product.name || '',
      description: product.description || '',
      shortDescription: (product as any).shortDescription || '',
      brandId: product.brandId || '',
      categoryId: product.categoryId || '',
      price: String(product.price ?? 0),
      originalPrice: product.originalPrice !== undefined && product.originalPrice !== null ? String(product.originalPrice) : '',
      discountPercent: String(product.discountPercent ?? 0),
      stock: String(product.stock ?? 0),
      weight: product.weight !== undefined && product.weight !== null ? String(product.weight) : '',
      dimensions: product.dimensions || '',
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      thumbnailUrl: product.thumbnailUrl || product.thumbnail_url || '',
      isFeatured: Boolean(product.isFeatured || product.is_featured),
      isNew: Boolean(product.isNew || product.is_new),
      isActive: Boolean(product.isActive || product.is_active),
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      images: Array.isArray(product.images)
        ? product.images.map((img) => ({
            id: img.id,
            url: img.url,
            type: img.type || 'image',
            isMain: Boolean(img.isMain),
            altText: img.altText || undefined,
            sortOrder: img.sortOrder ?? 0,
          }))
        : [],
    });
    setTagInput('');
    setProductFormOpen(true);
  };

  const resetCategoryForm = () => {
    setCategoryFormMode('create');
    setCategoryFormData({ id: '', name: '', description: '', imageUrl: '', parentId: '', sortOrder: '0', isActive: true });
  };

  const openCategoryForm = (category?: Category) => {
    if (!category) {
      resetCategoryForm();
      setCategoryFormMode('create');
      setCategoryFormOpen(true);
      return;
    }

    setCategoryFormMode('edit');
    setCategoryFormData({
      id: category.id,
      name: category.name,
      description: category.description || '',
      imageUrl: category.imageUrl || category.image_url || '',
      parentId: (category as any).parentId || '',
      sortOrder: String(category.sortOrder ?? category.sort_order ?? 0),
      isActive: Boolean(category.isActive || category.is_active),
    });
    setCategoryFormOpen(true);
  };

  const resetBrandForm = () => {
    setBrandFormMode('create');
    setBrandFormData({ id: '', name: '', description: '', logoUrl: '', sortOrder: '0', isFeatured: false, isActive: true });
  };

  const openBrandForm = (brand?: Brand) => {
    if (!brand) {
      resetBrandForm();
      setBrandFormMode('create');
      setBrandFormOpen(true);
      return;
    }

    setBrandFormMode('edit');
    setBrandFormData({
      id: brand.id,
      name: brand.name,
      description: brand.description || '',
      logoUrl: brand.logoUrl || brand.logo_url || '',
      sortOrder: String(brand.sortOrder ?? brand.sort_order ?? 0),
      isFeatured: Boolean(brand.isFeatured || brand.is_featured),
      isActive: Boolean(brand.isActive || brand.is_active),
    });
    setBrandFormOpen(true);
  };

  const saveProduct = async () => {
    const payload = {
      name: productFormData.name,
      description: productFormData.description,
      shortDescription: productFormData.shortDescription,
      brandId: productFormData.brandId || null,
      categoryId: productFormData.categoryId || null,
      price: Number(productFormData.price),
      originalPrice: productFormData.originalPrice ? Number(productFormData.originalPrice) : null,
      discountPercent: Number(productFormData.discountPercent),
      stock: Number(productFormData.stock),
      weight: productFormData.weight ? Number(productFormData.weight) : null,
      dimensions: productFormData.dimensions,
      tags: productFormData.tags,
      thumbnailUrl: productFormData.thumbnailUrl,
      isFeatured: productFormData.isFeatured,
      isNew: productFormData.isNew,
      isActive: productFormData.isActive,
      metaTitle: productFormData.metaTitle,
      metaDescription: productFormData.metaDescription,
      images: productFormData.images,
    };

    try {
      const saved = productFormMode === 'create'
        ? await api.post<Product>('/products', payload)
        : await api.patch<Product>(`/products/${productFormData.id}`, payload);

      setProducts((prev) => {
        if (productFormMode === 'create') return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
      setProductFormOpen(false);
    } catch (error) {
      console.error(error);
      alert(t('admin_unauthorized'));
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm(t('admin_delete_confirm'))) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      alert('Unable to delete.');
    }
  };

  const saveCategory = async () => {
    const payload = {
      name: categoryFormData.name,
      description: categoryFormData.description,
      imageUrl: categoryFormData.imageUrl,
      parentId: categoryFormData.parentId || null,
      sortOrder: Number(categoryFormData.sortOrder),
      isActive: categoryFormData.isActive,
    };

    try {
      const saved = categoryFormMode === 'create'
        ? await api.post<Category>('/categories', payload)
        : await api.patch<Category>(`/categories/${categoryFormData.id}`, payload);

      setCategories((prev) => {
        if (categoryFormMode === 'create') return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
      setCategoryFormOpen(false);
    } catch (error) {
      console.error(error);
      alert('Unable to save category.');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm(t('admin_delete_confirm'))) return;
    try {
      await api.delete(`/categories/${id}`);
      setCategories((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      alert('Unable to delete category.');
    }
  };

  const saveBrand = async () => {
    const payload = {
      name: brandFormData.name,
      description: brandFormData.description,
      logoUrl: brandFormData.logoUrl,
      sortOrder: Number(brandFormData.sortOrder),
      isFeatured: brandFormData.isFeatured,
      isActive: brandFormData.isActive,
    };

    try {
      const saved = brandFormMode === 'create'
        ? await api.post<Brand>('/brands', payload)
        : await api.patch<Brand>(`/brands/${brandFormData.id}`, payload);

      setBrands((prev) => {
        if (brandFormMode === 'create') return [saved, ...prev];
        return prev.map((item) => (item.id === saved.id ? saved : item));
      });
      setBrandFormOpen(false);
    } catch (error) {
      console.error(error);
      alert('Unable to save brand.');
    }
  };

  const deleteBrand = async (id: string) => {
    if (!confirm(t('admin_delete_confirm'))) return;
    try {
      await api.delete(`/brands/${id}`);
      setBrands((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      alert('Unable to delete brand.');
    }
  };

  const uploadFile = async (file: File, field: 'logoUrl' | 'imageUrl') => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const data = await api.post<{ url: string }>('/uploads', formData);
      if (field === 'logoUrl') setBrandFormData((prev) => ({ ...prev, logoUrl: data.url }));
      if (field === 'imageUrl') setCategoryFormData((prev) => ({ ...prev, imageUrl: data.url }));
    } catch (error) {
      console.error(error);
      alert('Upload failed.');
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push('/');
    }
  }, [user, isAdmin, authLoading]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchAll = async () => {
      const [ordersData, productsResponse, categoriesData, brandsData, shippingData, facturesData, heroData] = await Promise.all([
        api.get<Order[]>('/orders?all=true'),
        api.get<{ data: Product[]; total: number }>('/products?all=true'),
        api.get<Category[]>('/categories?all=true'),
        api.get<Brand[]>('/brands?all=true'),
        api.get<any[]>('/shipping-methods?all=true'),
        api.get<any[]>('/factures'),
        api.get<any[]>('/homepage-hero/all'),
      ]);

      const allOrders = ordersData || [];
      const allProducts = productsResponse?.data || [];
      const allCats = categoriesData || [];
      const allBrands = brandsData || [];
      const allShipping = shippingData || [];
      const allFactures = facturesData || [];
      const allHeroSlides = heroData || [];

      const revenue = allOrders.filter(o => o.status !== 'cancelled' && o.status !== 'refunded').reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const low_stock = allProducts.filter(p => p.stock <= 5 && p.stock > 0).length;

      setStats({
        orders: allOrders.length,
        revenue,
        products: allProducts.length,
        customers: new Set(allOrders.filter(o => o.email).map(o => o.email)).size,
        brands: allBrands.length,
        categories: allCats.length,
        low_stock,
      });
      setOrders(allOrders);
      setRecentOrders(allOrders.slice(0, 8));
      setProducts(allProducts);
      setCategories(allCats);
      setBrands(allBrands);
      setShippingMethods(allShipping);
      setFactures(allFactures);
      setHeroSlides(allHeroSlides);
      setLoading(false);
    };
    fetchAll();
  }, [isAdmin]);

  useEffect(() => {
    if (tab === 'factures' && isAdmin) {
      api.get<any[]>('/factures').then((data) => setFactures(data || []));
    }
  }, [tab, isAdmin]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await api.patch<Order & { updatedProducts?: { id: string; stock: number }[] }>(
        `/orders/${orderId}`,
        { status }
      );
      if (!response) return;

      const { updatedProducts, ...updatedOrder } = response;

      const newOrders = orders.map(o => (o.id === orderId ? { ...o, ...updatedOrder } : o));
      const newProducts = updatedProducts?.length
        ? products.map(p => {
            const match = updatedProducts.find(u => u.id === p.id);
            return match ? { ...p, stock: Number(match.stock) } : p;
          })
        : products;

      setOrders(newOrders);
      setRecentOrders(newOrders.slice(0, 8));
      if (updatedProducts?.length) setProducts(newProducts);

      if (updatedOrder.is_facture) {
        setFactures(prev => {
          const exists = prev.some((f: any) => f.id === orderId);
          return exists
            ? prev.map((f: any) => (f.id === orderId ? { ...f, ...updatedOrder } : f))
            : [updatedOrder, ...prev];
        });
      }

      setStats(prev => ({
        ...prev,
        revenue: newOrders
          .filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0),
        low_stock: newProducts.filter(p => p.stock <= 5 && p.stock > 0).length,
      }));

      alert('Order status updated successfully');
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    }
  };

  const toggleProductActive = async (id: string, is_active: boolean) => {
    await api.patch(`/products/${id}`, { isActive: !is_active });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: !is_active } : p));
  };

  const toggleBrandActive = async (id: string, is_active: boolean) => {
    await api.patch(`/brands/${id}`, { isActive: !is_active });
    setBrands(prev => prev.map(b => b.id === id ? { ...b, isActive: !is_active } : b));
  };

  const toggleCategoryActive = async (id: string, is_active: boolean) => {
    await api.patch(`/categories/${id}`, { isActive: !is_active });
    setCategories(prev => prev.map(c => c.id === id ? { ...c, isActive: !is_active } : c));
  };

  const resetShippingForm = () => {
    setShippingFormMode('create');
    setShippingFormData({ id: '', name: '', description: '', price: '0', isActive: true });
  };

  const openShippingForm = (method?: any) => {
    if (!method) {
      resetShippingForm();
      setShippingFormMode('create');
      setShippingFormOpen(true);
      return;
    }
    setShippingFormMode('edit');
    setShippingFormData({
      id: method.id,
      name: method.name,
      description: method.description || '',
      price: String(method.price ?? 0),
      isActive: Boolean(method.isActive),
    });
    setShippingFormOpen(true);
  };

  const saveShippingMethod = async () => {
    const payload = {
      name: shippingFormData.name,
      description: shippingFormData.description,
      price: Number(shippingFormData.price),
      isActive: shippingFormData.isActive,
    };

    try {
      const saved = shippingFormMode === 'create'
        ? await api.post<any>('/shipping-methods', payload)
        : await api.patch<any>(`/shipping-methods/${shippingFormData.id}`, payload);

      setShippingMethods(prev => {
        if (shippingFormMode === 'create') return [saved, ...prev];
        return prev.map(item => item.id === saved.id ? saved : item);
      });
      setShippingFormOpen(false);
    } catch (error) {
      console.error(error);
      alert('Unable to save shipping method.');
    }
  };

  const deleteShippingMethod = async (id: string) => {
    if (!confirm(t('admin_delete_confirm'))) return;
    try {
      await api.delete(`/shipping-methods/${id}`);
      setShippingMethods(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error(error);
      alert('Unable to delete shipping method.');
    }
  };

  const toggleShippingActive = async (id: string, is_active: boolean) => {
    await api.patch(`/shipping-methods/${id}`, { isActive: !is_active });
    setShippingMethods(prev => prev.map(m => m.id === id ? { ...m, isActive: !is_active } : m));
  };

  const resetHeroForm = () => {
    setHeroFormMode('create');
    setHeroFormData({ id: '', url: '', type: 'image', title: '', subtitle: '', ctaLabel: '', ctaHref: '', linkProductId: '', isActive: true });
  };

  const openHeroForm = (slide?: any) => {
    if (!slide) {
      resetHeroForm();
      setHeroFormMode('create');
      setHeroFormOpen(true);
      return;
    }
    setHeroFormMode('edit');
    setHeroFormData({
      id: slide.id,
      url: slide.url || '',
      type: slide.type === 'video' ? 'video' : 'image',
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      ctaLabel: slide.cta_label || '',
      ctaHref: slide.cta_href || '',
      linkProductId: slide.link_product_id || '',
      isActive: Boolean(slide.is_active),
    });
    setHeroFormOpen(true);
  };

  const uploadHeroMedia = async (file: File) => {
    setHeroUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const data = await api.post<{ url: string }>('/uploads?folder=hero', formData);
      setHeroFormData(prev => ({ ...prev, url: data.url, type: file.type.startsWith('video/') ? 'video' : 'image' }));
    } catch (error) {
      console.error(error);
      alert('Upload failed.');
    } finally {
      setHeroUploading(false);
    }
  };

  const saveHeroSlide = async () => {
    const payload: any = {
      url: heroFormData.url,
      type: heroFormData.type,
      title: heroFormData.title,
      subtitle: heroFormData.subtitle,
      cta_label: heroFormData.ctaLabel,
      cta_href: heroFormData.ctaHref,
      link_product_id: heroFormData.linkProductId || null,
      is_active: heroFormData.isActive,
    };
    if (heroFormMode === 'create') payload.position = heroSlides.length;

    try {
      const saved = heroFormMode === 'create'
        ? await api.post<any>('/homepage-hero', payload)
        : await api.patch<any>(`/homepage-hero/${heroFormData.id}`, payload);

      setHeroSlides(prev => {
        if (heroFormMode === 'create') return [...prev, saved];
        return prev.map(item => item.id === saved.id ? saved : item);
      });
      setHeroFormOpen(false);
    } catch (error) {
      console.error(error);
      alert('Unable to save hero slide.');
    }
  };

  const deleteHeroSlide = async (id: string) => {
    if (!confirm(t('admin_delete_confirm'))) return;
    try {
      await api.delete(`/homepage-hero/${id}`);
      setHeroSlides(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error(error);
      alert('Unable to delete hero slide.');
    }
  };

  const toggleHeroActive = async (id: string, is_active: boolean) => {
    await api.patch(`/homepage-hero/${id}`, { is_active: !is_active });
    setHeroSlides(prev => prev.map(h => h.id === id ? { ...h, is_active: !is_active } : h));
  };

  const moveHeroSlide = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= heroSlides.length) return;
    const reordered = [...heroSlides];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    const reindexed = reordered.map((slide, i) => ({ ...slide, position: i }));
    setHeroSlides(reindexed);
    try {
      await Promise.all(
        [index, targetIndex].map(i => api.patch(`/homepage-hero/${reindexed[i].id}`, { position: i }))
      );
    } catch (error) {
      console.error(error);
      alert('Unable to reorder hero slides.');
    }
  };

  // Tag Add / Remove Helper Functions
  const tagsList = useMemo(() => {
    return productFormData.tags ? productFormData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  }, [productFormData.tags]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tagsList.includes(trimmed)) {
      const updated = [...tagsList, trimmed].join(', ');
      setProductFormData(prev => ({ ...prev, tags: updated }));
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    const updated = tagsList.filter(t => t !== tagToRemove).join(', ');
    setProductFormData(prev => ({ ...prev, tags: updated }));
  };

  // Categories Hierarchy Helper Functions
  const parentCategories = useMemo(() => {
    return categories.filter(c => !c.parentId);
  }, [categories]);

  const subCategoriesForSelected = useMemo(() => {
    // Find parent ID of selected category, or treat selected category itself as parent if it has no parent
    const selectedCat = categories.find(c => c.id === productFormData.categoryId);
    const parentId = selectedCat?.parentId || productFormData.categoryId;
    return categories.filter(c => c.parentId === parentId);
  }, [productFormData.categoryId, categories]);

  const selectedParentCategoryId = useMemo(() => {
    const selectedCat = categories.find(c => c.id === productFormData.categoryId);
    return selectedCat?.parentId || productFormData.categoryId || '';
  }, [productFormData.categoryId, categories]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-burgundy-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-sans text-sm">{t('admin_loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const SIDEBAR_ITEMS: { icon: React.ElementType; label: string; tab: AdminTab }[] = [
    { icon: LayoutDashboard, label: t('admin_dashboard'), tab: 'dashboard' },
    { icon: ImageIcon, label: t('admin_hero'), tab: 'hero' },
    { icon: Package, label: t('admin_products'), tab: 'products' },
    { icon: Tag, label: t('admin_categories'), tab: 'categories' },
    { icon: Star, label: t('admin_brands'), tab: 'brands' },
    { icon: ShoppingBag, label: t('admin_orders'), tab: 'orders' },
    { icon: FileText, label: 'Factures', tab: 'factures' },
    { icon: Truck, label: t('admin_shipping' as any) || 'Delivery', tab: 'shipping' },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f6] flex text-[#2d2224]" dir={isRTL ? 'rtl' : 'ltr'}>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/35 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`relative lg:sticky lg:top-0 lg:h-screen flex h-full w-72 flex-col border-r border-[#2a171c] bg-[#180a0e] text-white shadow-2xl transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : isRTL ? 'lg:translate-x-0 translate-x-full' : 'lg:translate-x-0 -translate-x-full'}`}>
        <div className="p-6 border-b border-white/5 flex flex-col gap-4">
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white flex items-center justify-center relative shadow-md">
              <span className="absolute text-burgundy-700 font-serif font-bold text-lg">M</span>
              <img 
                src="/logo.png" 
                alt="Makhmal" 
                className="absolute inset-0 w-full h-full object-cover bg-white" 
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
              />
            </div>
            <div className={isRTL ? 'text-right' : ''}>
              <p className="font-serif font-bold text-white text-base tracking-wide leading-none">MAKHMAL</p>
              <p className="text-white/40 text-[10px] tracking-widest uppercase font-sans mt-1">{t('nav_admin')}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          {SIDEBAR_ITEMS.map(({ icon: Icon, label, tab: tabVal }) => (
            <button
              key={tabVal}
              onClick={() => { setTab(tabVal); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-sans transition-all ${isRTL ? 'flex-row-reverse' : ''} ${
                tab === tabVal
                  ? 'bg-burgundy-700 text-white font-medium shadow-lg shadow-burgundy-950/30'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={16} className="opacity-90" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer Link */}
        <div className="p-4 border-t border-white/5">
          <Link href="/" className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs font-sans font-medium transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Eye size={14} /> <span>{t('nav_view_store')}</span>
          </Link>
        </div>
      </aside>

      {/* Main content container */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Section */}
        <header className="h-16 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen((open) => !open)} className="rounded-xl border border-gray-200 bg-white p-2 text-muted-foreground shadow-sm transition hover:text-burgundy-700 lg:hidden">
              <LayoutGrid size={18} />
            </button>
            <LayoutGrid size={18} className="hidden text-muted-foreground lg:block" />
            <h2 className="text-sm font-sans font-semibold text-muted-foreground uppercase tracking-widest">
              {t(`admin_${tab}` as any) || tab}
            </h2>
          </div>

          {/* Header Actions: Language toggler */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 p-1 rounded-full">
              {(['en', 'fr', 'ar'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLocale(lang)}
                  className={`px-3 py-1 rounded-full text-xs font-sans font-semibold transition-all ${
                    locale === lang
                      ? 'bg-burgundy-700 text-white shadow'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-gray-100" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-burgundy-50 border border-burgundy-100 flex items-center justify-center text-xs font-bold text-burgundy-700 uppercase">
                {user?.firstName?.[0] || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Tab contents */}
        <div className="flex-1 overflow-auto p-8 max-w-7xl w-full mx-auto">

          {/* Dashboard Tab */}
          {tab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className={isRTL ? 'text-right' : ''}>
                <h1 className="font-serif text-3xl font-bold text-[#1f1517]">{t('admin_dashboard')}</h1>
                <p className="text-muted-foreground text-sm mt-1">Real-time statistics & system analysis.</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: t('admin_total_orders'), value: stats.orders, sub: 'All lifetime orders', icon: ShoppingBag, color: 'bg-emerald-500/10 text-emerald-700' },
                  { label: t('admin_revenue'), value: `${(Number(stats.revenue) || 0).toFixed(0)} ${currency}`, sub: 'Excluding cancelled', icon: TrendingUp, color: 'bg-burgundy-700/10 text-burgundy-700' },
                  { label: t('admin_products_count'), value: stats.products, sub: 'Total items in store', icon: Package, color: 'bg-violet-500/10 text-violet-700' },
                  { label: t('admin_customers'), value: stats.customers, sub: 'Unique buyers', icon: Users, color: 'bg-amber-500/10 text-amber-700' },
                ].map(stat => (
                  <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-36">
                    <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div>
                        <p className="text-xs font-sans font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                        <p className="text-[10px] text-muted-foreground font-sans mt-0.5">{stat.sub}</p>
                      </div>
                      <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}>
                        <stat.icon size={16} />
                      </div>
                    </div>
                    <p className={`font-serif text-2xl font-bold text-foreground mt-4 ${isRTL ? 'text-right' : ''}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Alerts & Critical Stock */}
              {stats.low_stock > 0 && (
                <div className={`bg-rose-50/70 border border-rose-100 rounded-2xl p-5 flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-700 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                    <p className="font-sans font-bold text-rose-900 text-sm">{stats.low_stock} {t('admin_low_stock')}</p>
                    <p className="text-xs text-rose-700/80 font-sans mt-0.5">Please refill supply as soon as possible to avoid out-of-stock checkouts.</p>
                  </div>
                  <button onClick={() => setTab('products')} className="px-4 py-2 bg-white border border-rose-200 text-rose-800 hover:bg-rose-50 text-xs font-sans font-semibold rounded-full transition-colors flex-shrink-0">
                    {t('admin_view_products')}
                  </button>
                </div>
              )}

              {/* Recent Orders table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className={`flex items-center justify-between p-6 border-b border-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <h2 className="font-sans font-bold text-[#1f1517]">{t('admin_recent_orders')}</h2>
                  <button onClick={() => setTab('orders')} className="text-xs font-sans font-bold text-burgundy-700 hover:underline flex items-center gap-1">
                    {t('admin_view_all')} <ArrowUpRight size={12} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-sans">
                    <thead>
                      <tr className="border-b border-gray-50 text-[#857375]">
                        <th className={`${isRTL ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-semibold uppercase tracking-wider`}>{t('admin_order_num')}</th>
                        <th className={`${isRTL ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-semibold uppercase tracking-wider`}>{t('admin_customer')}</th>
                        <th className={`${isRTL ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-semibold uppercase tracking-wider`}>{t('admin_status')}</th>
                        <th className={`${isRTL ? 'text-left' : 'text-right'} px-6 py-4 text-xs font-semibold uppercase tracking-wider`}>{t('admin_total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.length > 0 ? recentOrders.map(order => (
                        <tr key={order.id} className="border-b border-gray-50/50 hover:bg-gray-50/50 transition-colors">
                          <td className={`px-6 py-4 font-mono text-xs font-bold text-[#2d2224] ${isRTL ? 'text-right' : ''}`}>{order.order_number || order.orderNumber}</td>
                          <td className={`px-6 py-4 ${isRTL ? 'text-right' : ''}`}>
                            <p className="font-semibold text-xs text-foreground">{order.first_name || (order as any).firstName} {order.last_name || (order as any).lastName}</p>
                            <p className="text-[10px] text-muted-foreground">{order.email}</p>
                          </td>
                          <td className={`px-6 py-4 ${isRTL ? 'text-right' : ''}`}>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                          </td>
                          <td className={`px-6 py-4 font-bold text-xs ${isRTL ? 'text-left' : 'text-right'}`}>{(Number(order.total) || 0).toFixed(2)} {currency}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-muted-foreground font-sans text-xs">{t('admin_no_data')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {tab === 'products' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <h1 className="font-serif text-3xl font-bold text-[#1f1517]">{t('admin_products')}</h1>
                  <p className="text-muted-foreground text-sm mt-1">{products.length} total items in cosmetics inventory.</p>
                </div>
                <button
                  onClick={() => openProductForm()}
                  className={`inline-flex items-center gap-2 rounded-full bg-burgundy-700 hover:bg-burgundy-800 shadow-md text-white px-5 py-2.5 text-xs font-sans font-bold transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <Plus size={14} /> {t('admin_add_product')}
                </button>
              </div>

              {/* Add/Edit Product Drawer Modal */}
              {productFormOpen && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 animate-in slide-in-from-top-6 duration-300">
                  <div className={`flex items-center justify-between mb-6 pb-4 border-b border-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={isRTL ? 'text-right' : ''}>
                      <h2 className="font-serif text-xl font-bold text-foreground">
                        {productFormMode === 'create' ? t('admin_create_product') : t('admin_edit_product')}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Publish brand new items to store catalog.</p>
                    </div>
                    <button onClick={() => setProductFormOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-muted-foreground transition">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    {/* Left Form Column */}
                    <div className="space-y-4">
                      {/* Name input */}
                      <div className="grid gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">{t('admin_name')}</label>
                        <input value={productFormData.name} onChange={e => setProductFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none focus:border-burgundy-700 transition" />
                      </div>

                      {/* Description inputs */}
                      <div className="grid gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">{t('admin_description')}</label>
                        <textarea value={productFormData.description} onChange={e => setProductFormData(prev => ({ ...prev, description: e.target.value }))} className="min-h-[100px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none focus:border-burgundy-700 transition" />
                      </div>
                      <div className="grid gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">{t('admin_short_description')}</label>
                        <textarea value={productFormData.shortDescription} onChange={e => setProductFormData(prev => ({ ...prev, shortDescription: e.target.value }))} className="min-h-[60px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none focus:border-burgundy-700 transition" />
                      </div>

                      {/* Visual Selector for Brand */}
                      <div className="grid gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">{t('admin_select_brand')}</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-48 overflow-y-auto p-1 bg-beige-50/55 rounded-xl border border-gray-100">
                          {brands.map(b => {
                            const isSelected = productFormData.brandId === b.id;
                            return (
                              <button
                                type="button"
                                key={b.id}
                                onClick={() => setProductFormData(prev => ({ ...prev, brandId: b.id }))}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                                  isSelected 
                                    ? 'border-burgundy-700 bg-burgundy-50/50 ring-1 ring-burgundy-700 shadow-sm' 
                                    : 'border-gray-200 bg-white hover:border-burgundy-200'
                                }`}
                              >
                                <div className="w-8 h-8 rounded bg-beige-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                                  {b.logoUrl || b.logo_url ? (
                                    <img src={b.logoUrl || b.logo_url || ''} alt={b.name} className="w-full h-full object-contain" />
                                  ) : (
                                    <span className="font-serif font-bold text-xs text-burgundy-700">{b.name[0]}</span>
                                  )}
                                </div>
                                <span className="text-xs font-semibold truncate text-foreground">{b.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Visual Selector for Category Hierarchy */}
                      <div className="grid gap-3 p-4 bg-beige-50/30 rounded-xl border border-gray-100">
                        <div className="grid gap-1.5">
                          <label className="text-xs font-semibold text-slate-700">{t('admin_select_category')}</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
                            {parentCategories.map(c => {
                              const isParentSelected = selectedParentCategoryId === c.id;
                              return (
                                <button
                                  type="button"
                                  key={c.id}
                                  onClick={() => {
                                    setProductFormData(prev => ({ ...prev, categoryId: c.id }));
                                  }}
                                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                                    isParentSelected 
                                      ? 'border-burgundy-700 bg-burgundy-50/50 ring-1 ring-burgundy-700 shadow-sm' 
                                      : 'border-gray-200 bg-white hover:border-burgundy-200'
                                  }`}
                                >
                                  <div className="w-8 h-8 rounded bg-beige-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                                    {c.imageUrl || c.image_url ? (
                                      <img src={c.imageUrl || c.image_url || ''} alt={c.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="font-serif font-bold text-xs text-burgundy-700">{c.name[0]}</span>
                                    )}
                                  </div>
                                  <span className="text-xs font-semibold truncate text-foreground">{c.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Subcategory select cards (filtered based on parent select) */}
                        {selectedParentCategoryId && subCategoriesForSelected.length > 0 && (
                          <div className="grid gap-1.5 pt-2 border-t border-gray-100">
                            <label className="text-xs font-semibold text-slate-700">{t('admin_select_subcategory')}</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
                              {subCategoriesForSelected.map(sub => {
                                const isSubSelected = productFormData.categoryId === sub.id;
                                return (
                                  <button
                                    type="button"
                                    key={sub.id}
                                    onClick={() => setProductFormData(prev => ({ ...prev, categoryId: sub.id }))}
                                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                                      isSubSelected 
                                        ? 'border-burgundy-700 bg-burgundy-50/50 ring-1 ring-burgundy-700 shadow-sm' 
                                        : 'border-gray-200 bg-white hover:border-burgundy-200'
                                    }`}
                                  >
                                    <div className="w-6 h-6 rounded bg-beige-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                                      {sub.imageUrl || sub.image_url ? (
                                        <img src={sub.imageUrl || sub.image_url || ''} alt={sub.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="font-serif font-bold text-[10px] text-burgundy-700">{sub.name[0]}</span>
                                      )}
                                    </div>
                                    <span className="text-xs font-semibold truncate text-foreground">{sub.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Form Column */}
                    <div className="space-y-4">
                      {/* Price inputs */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                          <label className="text-xs font-semibold text-slate-700">{t('admin_price')}</label>
                          <input type="number" step="0.01" value={productFormData.price} onChange={e => setProductFormData(prev => ({ ...prev, price: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none" />
                        </div>
                        <div className="grid gap-1.5">
                          <label className="text-xs font-semibold text-slate-700">{t('admin_original_price')}</label>
                          <input type="number" step="0.01" value={productFormData.originalPrice} onChange={e => setProductFormData(prev => ({ ...prev, originalPrice: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none" />
                        </div>
                      </div>

                      {/* Stock & discount inputs */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                          <label className="text-xs font-semibold text-slate-700">{t('admin_stock')}</label>
                          <input type="number" value={productFormData.stock} onChange={e => setProductFormData(prev => ({ ...prev, stock: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none" />
                        </div>
                        <div className="grid gap-1.5">
                          <label className="text-xs font-semibold text-slate-700">{t('admin_discount_percent')}</label>
                          <input type="number" value={productFormData.discountPercent} onChange={e => setProductFormData(prev => ({ ...prev, discountPercent: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none" />
                        </div>
                      </div>

                      {/* Weight & dimensions inputs */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                          <label className="text-xs font-semibold text-slate-700">{t('admin_weight')}</label>
                          <input type="number" step="0.01" value={productFormData.weight} onChange={e => setProductFormData(prev => ({ ...prev, weight: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none" />
                        </div>
                        <div className="grid gap-1.5">
                          <label className="text-xs font-semibold text-slate-700">{t('admin_dimensions')}</label>
                          <input value={productFormData.dimensions} onChange={e => setProductFormData(prev => ({ ...prev, dimensions: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none" />
                        </div>
                      </div>

                      {/* Interactive Tags Builder */}
                      <div className="grid gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">{t('admin_tags')}</label>
                        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-gray-200 bg-gray-50 min-h-12 items-center">
                          {tagsList.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-burgundy-700 text-white rounded-full text-[11px] font-sans font-medium transition-transform active:scale-95">
                              #{tag}
                              <button type="button" onClick={() => removeTag(tag)} className="hover:text-amber-300 transition-colors">
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                addTag(tagInput);
                              }
                            }}
                            placeholder={t('admin_tags_placeholder')}
                            className="flex-1 min-w-[120px] bg-transparent text-xs font-sans focus:outline-none px-1 border-0"
                          />
                        </div>
                      </div>

                      {/* Status Checkboxes */}
                      <div className="flex flex-wrap gap-6 py-2 bg-beige-50/20 rounded-xl p-3 border border-gray-100/50">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <input type="checkbox" checked={productFormData.isFeatured} onChange={e => setProductFormData(prev => ({ ...prev, isFeatured: e.target.checked }))} className="rounded border-gray-300 text-burgundy-700 focus:ring-burgundy-700 w-4 h-4" />
                          <span>{t('admin_is_featured')}</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <input type="checkbox" checked={productFormData.isNew} onChange={e => setProductFormData(prev => ({ ...prev, isNew: e.target.checked }))} className="rounded border-gray-300 text-burgundy-700 focus:ring-burgundy-700 w-4 h-4" />
                          <span>{t('admin_is_new')}</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <input type="checkbox" checked={productFormData.isActive} onChange={e => setProductFormData(prev => ({ ...prev, isActive: e.target.checked }))} className="rounded border-gray-300 text-burgundy-700 focus:ring-burgundy-700 w-4 h-4" />
                          <span>{t('admin_is_active')}</span>
                        </label>
                      </div>

                      {/* SEO meta data */}
                      <div className="grid gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">{t('admin_meta_title')}</label>
                        <input value={productFormData.metaTitle} onChange={e => setProductFormData(prev => ({ ...prev, metaTitle: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none" />
                      </div>
                      <div className="grid gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">{t('admin_meta_description')}</label>
                        <textarea value={productFormData.metaDescription} onChange={e => setProductFormData(prev => ({ ...prev, metaDescription: e.target.value }))} className="min-h-[50px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-sans focus:outline-none" />
                      </div>

                      {/* Product media: images + videos. The item marked "Main" automatically becomes the product thumbnail. */}
                      <div className="grid gap-1.5">
                        <label className="text-xs font-semibold text-slate-700">{t('admin_gallery')}</label>
                        <MediaManager
                          media={productFormData.images}
                          onChange={(items) => setProductFormData((prev) => ({
                            ...prev,
                            images: items,
                            thumbnailUrl: items.find((item) => item.isMain)?.url || items[0]?.url || '',
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save actions */}
                  <div className="mt-8 pt-4 border-t border-gray-50 flex flex-wrap items-center gap-3 justify-end">
                    <button onClick={() => setProductFormOpen(false)} className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-xs font-sans font-bold text-slate-700 hover:bg-gray-50 transition">{t('admin_cancel')}</button>
                    <button onClick={saveProduct} className="rounded-full bg-burgundy-700 hover:bg-burgundy-800 text-xs font-sans font-bold text-white px-5 py-2.5 transition shadow-md">{productFormMode === 'create' ? t('admin_create_product') : t('admin_save_changes')}</button>
                  </div>
                </div>
              )}

              {/* Products Table list */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-sans">
                    <thead>
                      <tr className="border-b border-gray-50 bg-gray-50/50 text-[#857375]">
                        <th className={`${isRTL ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-semibold uppercase tracking-wider`}>{t('admin_products')}</th>
                        <th className={`${isRTL ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden md:table-cell`}>{t('product_brand')}</th>
                        <th className={`${isRTL ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden md:table-cell`}>{t('product_category')}</th>
                        <th className={`${isRTL ? 'text-left' : 'text-right'} px-6 py-4 text-xs font-semibold uppercase tracking-wider`}>{t('products_price')}</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider">{t('product_stock')}</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider">{t('admin_status')}</th>
                        <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider">{t('admin_actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length > 0 ? products.map(p => (
                        <tr key={p.id} className="border-b border-gray-50/50 hover:bg-gray-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              {p.thumbnailUrl || p.thumbnail_url ? (
                                <img src={p.thumbnailUrl || p.thumbnail_url || ''} alt={p.name} className="w-10 h-10 object-cover rounded-xl border border-gray-100 flex-shrink-0" />
                              ) : (
                                <div className="w-10 h-10 bg-beige-50 rounded-xl flex items-center justify-center text-muted-foreground border border-gray-100 flex-shrink-0"><Package size={14} /></div>
                              )}
                              <span className="font-semibold text-xs text-foreground truncate max-w-[180px]">{p.name}</span>
                            </div>
                          </td>
                          <td className={`px-6 py-4 hidden md:table-cell text-xs text-muted-foreground font-semibold ${isRTL ? 'text-right' : ''}`}>{p.brand?.name || '-'}</td>
                          <td className={`px-6 py-4 hidden md:table-cell text-xs text-muted-foreground font-semibold ${isRTL ? 'text-right' : ''}`}>{p.category?.name || '-'}</td>
                          <td className={`px-6 py-4 text-xs font-bold ${isRTL ? 'text-left' : 'text-right'}`}>{(Number(p.price) || 0).toFixed(2)} {currency}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.stock === 0 ? 'bg-red-50 text-red-700 border border-red-200' : p.stock <= 5 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>{p.stock}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => toggleProductActive(p.id, p.isActive ?? p.is_active ?? false)} className={`px-2.5 py-1 border rounded-full text-[10px] font-bold uppercase transition-all ${p.isActive || p.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                              {(p.isActive || p.is_active) ? t('admin_active') : t('admin_inactive')}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button onClick={() => openProductForm(p)} className="p-1.5 hover:bg-burgundy-50 hover:text-burgundy-700 text-muted-foreground rounded-lg transition-colors" title="Edit"><Pencil size={13} /></button>
                              <button onClick={() => deleteProduct(p.id)} className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-muted-foreground rounded-lg transition-colors" title="Delete"><Trash2 size={13} /></button>
                              <Link href={`/products/${p.id}`} className="p-1.5 hover:bg-gray-100 text-muted-foreground rounded-lg transition-colors" title="Preview"><Eye size={13} /></Link>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground font-sans text-xs">{t('admin_no_data')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {tab === 'categories' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <h1 className="font-serif text-3xl font-bold text-[#1f1517]">{t('admin_categories')}</h1>
                  <p className="text-muted-foreground text-sm mt-1">{categories.length} sections defined in hierarchy tree.</p>
                </div>
                <button onClick={() => openCategoryForm()} className={`inline-flex items-center gap-2 rounded-full bg-burgundy-700 hover:bg-burgundy-800 shadow-md text-white px-5 py-2.5 text-xs font-sans font-bold transition-all ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Plus size={14} /> {t('admin_add_category')}
                </button>
              </div>

              {/* Category form drawer */}
              {categoryFormOpen && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 animate-in slide-in-from-top-6 duration-300">
                  <div className={`flex items-center justify-between mb-5 pb-3 border-b border-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h2 className="font-serif text-lg font-bold text-foreground">{categoryFormMode === 'create' ? t('admin_create_category') : t('admin_edit_category')}</h2>
                    <button onClick={() => setCategoryFormOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-muted-foreground transition">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_name')}</label>
                      <input value={categoryFormData.name} onChange={e => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_parent_category')}</label>
                      <select value={categoryFormData.parentId} onChange={e => setCategoryFormData(prev => ({ ...prev, parentId: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none bg-white pr-8">
                        <option value="">-- None (Parent category) --</option>
                        {categories.filter(c => !c.parentId && c.id !== categoryFormData.id).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_description')}</label>
                      <textarea value={categoryFormData.description} onChange={e => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))} className="min-h-[80px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_image_url')}</label>
                      <input value={categoryFormData.imageUrl} onChange={e => setCategoryFormData(prev => ({ ...prev, imageUrl: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none" />
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-beige-50/60 p-3">
                        <input type="file" accept="image/*" id="category-upload" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'imageUrl')} className="hidden" />
                        <label htmlFor="category-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-burgundy-200 bg-white px-4 py-2.5 text-sm font-semibold text-burgundy-700 shadow-sm transition hover:bg-burgundy-50">
                          <Globe size={14} /> {t('admin_upload_image')}
                        </label>
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_sort_order')}</label>
                      <input type="number" value={categoryFormData.sortOrder} onChange={e => setCategoryFormData(prev => ({ ...prev, sortOrder: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer py-2">
                        <input type="checkbox" checked={categoryFormData.isActive} onChange={e => setCategoryFormData(prev => ({ ...prev, isActive: e.target.checked }))} className="rounded text-burgundy-700 w-4 h-4" />
                        <span>{t('admin_is_active')}</span>
                      </label>
                    </div>
                  </div>
                  <div className="mt-6 pt-3 border-t border-gray-50 flex flex-wrap items-center gap-3 justify-end">
                    <button onClick={() => setCategoryFormOpen(false)} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-gray-50 transition">{t('admin_cancel')}</button>
                    <button onClick={saveCategory} className="rounded-full bg-burgundy-700 hover:bg-burgundy-800 text-xs font-bold text-white px-4 py-2 transition">{categoryFormMode === 'create' ? t('admin_create_category') : t('admin_save_changes')}</button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm font-sans">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50 text-[#857375]">
                      <th className={`${isRTL ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-semibold uppercase tracking-wider`}>{t('admin_categories')}</th>
                      <th className={`${isRTL ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden md:table-cell`}>{t('product_description')}</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider">{t('admin_sort_order')}</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider">{t('admin_status')}</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider">{t('admin_actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length > 0 ? categories.map(cat => (
                      <tr key={cat.id} className="border-b border-gray-50/50 hover:bg-gray-50/30">
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            {cat.imageUrl || cat.image_url ? (
                              <img src={cat.imageUrl || cat.image_url || ''} alt={cat.name} className="w-10 h-10 object-cover rounded-xl border border-gray-100 flex-shrink-0" />
                            ) : (
                              <div className="w-10 h-10 bg-beige-50 rounded-xl border border-gray-100 flex-shrink-0 flex items-center justify-center text-muted-foreground"><Tag size={14} /></div>
                            )}
                            <div>
                              <span className="font-semibold text-xs text-foreground block">{cat.name}</span>
                              {cat.parentId && (
                                <span className="text-[10px] bg-beige-50 border border-beige-100 text-burgundy-700 px-2 py-0.5 rounded font-sans mt-0.5 inline-block">
                                  Sub of {categories.find(c => c.id === cat.parentId)?.name || 'Parent'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className={`px-6 py-4 hidden md:table-cell text-xs text-muted-foreground font-semibold truncate max-w-[220px] ${isRTL ? 'text-right' : ''}`}>{cat.description || '-'}</td>
                        <td className="px-6 py-4 text-center text-xs font-bold font-mono">{cat.sortOrder ?? (cat as any).sort_order ?? 0}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => toggleCategoryActive(cat.id, cat.isActive ?? cat.is_active ?? false)} className={`px-2.5 py-1 border rounded-full text-[10px] font-bold uppercase transition-all ${cat.isActive || cat.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                            {(cat.isActive || cat.is_active) ? t('admin_active') : t('admin_inactive')}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openCategoryForm(cat)} className="p-1.5 hover:bg-burgundy-50 hover:text-burgundy-700 text-muted-foreground rounded-lg transition-colors"><Pencil size={13} /></button>
                            <button onClick={() => deleteCategory(cat.id)} className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-muted-foreground rounded-lg transition-colors"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground font-sans text-xs">{t('admin_no_data')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Hero Banners Tab */}
          {tab === 'hero' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <h1 className="font-serif text-3xl font-bold text-[#1f1517]">{t('admin_hero')}</h1>
                  <p className="text-muted-foreground text-sm mt-1">{heroSlides.length} slides configured for the homepage.</p>
                </div>
                <button onClick={() => openHeroForm()} className={`inline-flex items-center gap-2 rounded-full bg-burgundy-700 hover:bg-burgundy-800 shadow-md text-white px-5 py-2.5 text-xs font-sans font-bold transition-all ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Plus size={14} /> {t('admin_add_hero_slide')}
                </button>
              </div>

              {/* Hero Slide Form */}
              {heroFormOpen && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 animate-in slide-in-from-top-6 duration-300">
                  <div className={`flex items-center justify-between mb-5 pb-3 border-b border-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h2 className="font-serif text-lg font-bold text-foreground">{heroFormMode === 'create' ? t('admin_create_hero_slide') : t('admin_edit_hero_slide')}</h2>
                    <button onClick={() => setHeroFormOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-muted-foreground transition">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_hero_upload_media')}</label>
                      <input
                        value={heroFormData.url}
                        onChange={e => {
                          const url = e.target.value;
                          setHeroFormData(prev => ({ ...prev, url, type: /\.(mp4|webm|mov)$/i.test(url) ? 'video' : prev.type }));
                        }}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none"
                      />
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-beige-50/60 p-4 flex items-center gap-4">
                        {heroFormData.url && (
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                            {heroFormData.type === 'video' ? (
                              <video src={heroFormData.url} muted className="w-full h-full object-cover pointer-events-none" />
                            ) : (
                              <img src={heroFormData.url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            )}
                          </div>
                        )}
                        <div className="flex-1">
                          <input type="file" accept="image/*,video/*" id="hero-upload" onChange={e => e.target.files?.[0] && uploadHeroMedia(e.target.files[0])} className="hidden" />
                          <label htmlFor="hero-upload" className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-burgundy-200 bg-white px-4 py-2.5 text-sm font-semibold text-burgundy-700 shadow-sm transition hover:bg-burgundy-50 ${heroUploading ? 'pointer-events-none opacity-60' : ''}`}>
                            <ImageIcon size={14} /> {heroUploading ? 'Uploading…' : t('admin_hero_upload_media')}
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_hero_slide_title')}</label>
                      <input value={heroFormData.title} onChange={e => setHeroFormData(prev => ({ ...prev, title: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_hero_link_product')}</label>
                      <select value={heroFormData.linkProductId} onChange={e => setHeroFormData(prev => ({ ...prev, linkProductId: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none bg-white">
                        <option value="">{t('admin_hero_no_product')}</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_hero_slide_subtitle')}</label>
                      <textarea value={heroFormData.subtitle} onChange={e => setHeroFormData(prev => ({ ...prev, subtitle: e.target.value }))} className="min-h-[70px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_hero_cta_label')}</label>
                      <input value={heroFormData.ctaLabel} onChange={e => setHeroFormData(prev => ({ ...prev, ctaLabel: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_hero_cta_href')}</label>
                      <input value={heroFormData.ctaHref} onChange={e => setHeroFormData(prev => ({ ...prev, ctaHref: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none" placeholder="/products" />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer py-2">
                        <input type="checkbox" checked={heroFormData.isActive} onChange={e => setHeroFormData(prev => ({ ...prev, isActive: e.target.checked }))} className="rounded text-burgundy-700 w-4 h-4" />
                        <span>{t('admin_is_active')}</span>
                      </label>
                    </div>
                  </div>
                  <div className="mt-6 pt-3 border-t border-gray-50 flex flex-wrap items-center gap-3 justify-end">
                    <button onClick={() => setHeroFormOpen(false)} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-gray-50 transition">{t('admin_cancel')}</button>
                    <button onClick={saveHeroSlide} className="rounded-full bg-burgundy-700 hover:bg-burgundy-800 text-xs font-bold text-white px-4 py-2 transition">{heroFormMode === 'create' ? t('admin_create_hero_slide') : t('admin_save_changes')}</button>
                  </div>
                </div>
              )}

              {/* Hero Slides List */}
              <div className="space-y-3">
                {heroSlides.length > 0 ? heroSlides.map((slide, index) => (
                  <div key={slide.id} className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
                    <div className="flex flex-col">
                      <button onClick={() => moveHeroSlide(index, -1)} disabled={index === 0} className="text-beige-300 hover:text-foreground disabled:opacity-30 p-0.5"><ChevronUp size={14} /></button>
                      <button onClick={() => moveHeroSlide(index, 1)} disabled={index === heroSlides.length - 1} className="text-beige-300 hover:text-foreground disabled:opacity-30 p-0.5"><ChevronDown size={14} /></button>
                    </div>
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-beige-50 border border-gray-100 flex-shrink-0">
                      {slide.type === 'video' ? (
                        <video src={slide.url} muted className="w-full h-full object-cover pointer-events-none" />
                      ) : (
                        <img src={slide.url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{slide.title || <span className="italic text-muted-foreground">Untitled slide</span>}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans inline-flex items-center gap-1 ${slide.type === 'video' ? 'bg-purple-50 text-purple-700' : 'bg-sky-50 text-sky-700'}`}>
                          {slide.type === 'video' ? <Film size={10} /> : <ImageIcon size={10} />}
                          {slide.type}
                        </span>
                        {slide.link_product_id && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-50 text-gold-700 font-sans">
                            {products.find(p => p.id === slide.link_product_id)?.name || 'Linked product'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => toggleHeroActive(slide.id, slide.is_active)} className={`px-2.5 py-1 border rounded-full text-[10px] font-bold uppercase transition-all flex-shrink-0 ${slide.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                      {slide.is_active ? t('admin_active') : t('admin_inactive')}
                    </button>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => openHeroForm(slide)} className="p-1.5 hover:bg-burgundy-50 hover:text-burgundy-700 text-muted-foreground rounded-lg transition-colors" title="Edit"><Pencil size={13} /></button>
                      <button onClick={() => deleteHeroSlide(slide.id)} className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-muted-foreground rounded-lg transition-colors" title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </div>
                )) : (
                  <div className="py-12 text-center text-muted-foreground font-sans text-xs bg-white rounded-2xl border border-gray-100">{t('admin_hero_no_slides')}</div>
                )}
              </div>
            </div>
          )}

          {/* Brands Tab */}
          {tab === 'brands' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <h1 className="font-serif text-3xl font-bold text-[#1f1517]">{t('admin_brands')}</h1>
                  <p className="text-muted-foreground text-sm mt-1">{brands.length} partner brands published on the website.</p>
                </div>
                <button onClick={() => openBrandForm()} className={`inline-flex items-center gap-2 rounded-full bg-burgundy-700 hover:bg-burgundy-800 shadow-md text-white px-5 py-2.5 text-xs font-sans font-bold transition-all ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Plus size={14} /> {t('admin_add_brand')}
                </button>
              </div>

              {/* Brand Form */}
              {brandFormOpen && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 animate-in slide-in-from-top-6 duration-300">
                  <div className={`flex items-center justify-between mb-5 pb-3 border-b border-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h2 className="font-serif text-lg font-bold text-foreground">{brandFormMode === 'create' ? t('admin_create_brand') : t('admin_edit_brand')}</h2>
                    <button onClick={() => setBrandFormOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-muted-foreground transition">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_name')}</label>
                      <input value={brandFormData.name} onChange={e => setBrandFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_description')}</label>
                      <textarea value={brandFormData.description} onChange={e => setBrandFormData(prev => ({ ...prev, description: e.target.value }))} className="min-h-[80px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_logo_url')}</label>
                      <input value={brandFormData.logoUrl} onChange={e => setBrandFormData(prev => ({ ...prev, logoUrl: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none" />
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-beige-50/60 p-3">
                        <input type="file" accept="image/*" id="brand-upload" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'logoUrl')} className="hidden" />
                        <label htmlFor="brand-upload" className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-burgundy-200 bg-white px-4 py-2.5 text-sm font-semibold text-burgundy-700 shadow-sm transition hover:bg-burgundy-50">
                          <Globe size={14} /> {t('admin_upload_image')}
                        </label>
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_sort_order')}</label>
                      <input type="number" value={brandFormData.sortOrder} onChange={e => setBrandFormData(prev => ({ ...prev, sortOrder: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div className="grid gap-1.5">
                      <div className="flex flex-wrap gap-4 py-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <input type="checkbox" checked={brandFormData.isFeatured} onChange={e => setBrandFormData(prev => ({ ...prev, isFeatured: e.target.checked }))} className="rounded text-burgundy-700 w-4 h-4" />
                          <span>{t('admin_is_featured')}</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <input type="checkbox" checked={brandFormData.isActive} onChange={e => setBrandFormData(prev => ({ ...prev, isActive: e.target.checked }))} className="rounded text-burgundy-700 w-4 h-4" />
                          <span>{t('admin_is_active')}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-3 border-t border-gray-50 flex flex-wrap items-center gap-3 justify-end">
                    <button onClick={() => setBrandFormOpen(false)} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-gray-50 transition">{t('admin_cancel')}</button>
                    <button onClick={saveBrand} className="rounded-full bg-burgundy-700 hover:bg-burgundy-800 text-xs font-bold text-white px-4 py-2 transition">{brandFormMode === 'create' ? t('admin_create_brand') : t('admin_save_changes')}</button>
                  </div>
                </div>
              )}

              {/* Brands visual layout Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {brands.length > 0 ? brands.map(brand => (
                  <div key={brand.id} className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-4 ${isRTL ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-beige-50 rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {brand.logoUrl || brand.logo_url ? (
                          <img src={brand.logoUrl || brand.logo_url || ''} alt={brand.name} className="w-12 h-12 object-contain" />
                        ) : (
                          <span className="font-serif font-bold text-xl text-burgundy-700">{brand.name[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-foreground truncate">{brand.name}</p>
                        {brand.description ? (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{brand.description}</p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic mt-0.5">No description set.</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-50/50">
                      <button onClick={() => toggleBrandActive(brand.id, brand.isActive ?? brand.is_active ?? false)} className={`px-2.5 py-1 border rounded-full text-[10px] font-bold uppercase transition-all ${brand.isActive || brand.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                        {(brand.isActive || brand.is_active) ? t('admin_active') : t('admin_inactive')}
                      </button>
                      {(brand.isFeatured || brand.is_featured) && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] bg-amber-50 border border-amber-200 text-amber-600 font-bold uppercase">{t('admin_featured')}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 justify-end mt-2 pt-2 border-t border-gray-50/50">
                      <button onClick={() => openBrandForm(brand)} className="p-1.5 hover:bg-burgundy-50 hover:text-burgundy-700 text-muted-foreground rounded-lg transition-colors" title="Edit"><Pencil size={13} /></button>
                      <button onClick={() => deleteBrand(brand.id)} className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-muted-foreground rounded-lg transition-colors" title="Delete"><Trash2 size={13} /></button>
                      <Link href={`/brands/${brand.id}`} className="p-1.5 hover:bg-gray-100 text-muted-foreground rounded-lg transition-colors" title="Preview"><Eye size={13}/></Link>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-12 text-center text-muted-foreground font-sans text-xs bg-white rounded-2xl border border-gray-100">{t('admin_no_data')}</div>
                )}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {tab === 'orders' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className={isRTL ? 'text-right' : ''}>
                <h1 className="font-serif text-3xl font-bold text-[#1f1517]">{t('admin_orders')}</h1>
                <p className="text-muted-foreground text-sm mt-1">{orders.length} orders in customers database.</p>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-sans">
                    <thead>
                      <tr className="border-b border-gray-50 bg-gray-50/50 text-[#857375]">
                        <th className={`${isRTL ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-semibold uppercase tracking-wider`}>{t('admin_order_num')}</th>
                        <th className={`${isRTL ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-semibold uppercase tracking-wider`}>{t('admin_customer')}</th>
                        <th className={`${isRTL ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden md:table-cell`}>Date</th>
                        <th className={`${isRTL ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-semibold uppercase tracking-wider`}>{t('admin_status')}</th>
                        <th className={`${isRTL ? 'text-left' : 'text-right'} px-6 py-4 text-xs font-semibold uppercase tracking-wider`}>{t('checkout_total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length > 0 ? orders.map(order => (
                        <tr key={order.id} className="border-b border-gray-50/50 hover:bg-gray-50/30 transition-colors">
                          <td className={`px-6 py-4 font-mono text-xs font-bold text-foreground ${isRTL ? 'text-right' : ''}`}>{order.order_number || order.orderNumber}</td>
                          <td className={`px-6 py-4 ${isRTL ? 'text-right' : ''}`}>
                            <p className="font-semibold text-xs text-foreground">{order.first_name || (order as any).firstName} {order.last_name || (order as any).lastName}</p>
                            <p className="text-[10px] text-muted-foreground">{order.city}, {order.country}</p>
                          </td>
                          <td className={`px-6 py-4 hidden md:table-cell text-xs text-muted-foreground font-semibold ${isRTL ? 'text-right' : ''}`}>
                            {new Date(order.created_at || (order as any).createdAt).toLocaleDateString()}
                          </td>
                          <td className={`px-6 py-4 ${isRTL ? 'text-right' : ''}`}>
                            <select
                              value={order.status}
                              onChange={e => updateOrderStatus(order.id, e.target.value)}
                              className={`text-xs font-bold px-2.5 py-1 rounded-full border-0 outline-none cursor-pointer ${STATUS_COLORS[order.status]}`}
                            >
                              {ORDER_STATUSES.map(s => (
                                <option key={s} value={s} className="bg-white text-[#2d2224]">{s.toUpperCase()}</option>
                              ))}
                            </select>
                          </td>
                          <td className={`px-6 py-4 font-bold text-xs ${isRTL ? 'text-left' : 'text-right'}`}>{(Number(order.total) || 0).toFixed(2)} {currency}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-muted-foreground font-sans text-xs">{t('admin_no_data')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Shipping Tab */}
          {tab === 'shipping' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <h1 className="font-serif text-3xl font-bold text-[#1f1517]">{t('admin_shipping' as any) || 'Delivery Modes'}</h1>
                  <p className="text-muted-foreground text-sm mt-1">{shippingMethods.length} delivery modes configured for clients.</p>
                </div>
                <button
                  onClick={() => openShippingForm()}
                  className={`inline-flex items-center gap-2 rounded-full bg-burgundy-700 hover:bg-burgundy-800 shadow-md text-white px-5 py-2.5 text-xs font-sans font-bold transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <Plus size={14} /> {t('admin_add_shipping' as any) || 'Add Delivery Mode'}
                </button>
              </div>

              {/* Add/Edit Shipping Modal */}
              {shippingFormOpen && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 animate-in slide-in-from-top-6 duration-300">
                  <div className={`flex items-center justify-between mb-5 pb-3 border-b border-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h2 className="font-serif text-lg font-bold text-foreground">
                      {shippingFormMode === 'create' ? (t('admin_create_shipping' as any) || 'Create Delivery Mode') : (t('admin_edit_shipping' as any) || 'Edit Delivery Mode')}
                    </h2>
                    <button onClick={() => setShippingFormOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-muted-foreground transition">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_name')}</label>
                      <input value={shippingFormData.name} onChange={e => setShippingFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_price')}</label>
                      <input type="number" step="0.01" value={shippingFormData.price} onChange={e => setShippingFormData(prev => ({ ...prev, price: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_description')}</label>
                      <textarea value={shippingFormData.description} onChange={e => setShippingFormData(prev => ({ ...prev, description: e.target.value }))} className="min-h-[80px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none" />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer py-2">
                        <input type="checkbox" checked={shippingFormData.isActive} onChange={e => setShippingFormData(prev => ({ ...prev, isActive: e.target.checked }))} className="rounded text-burgundy-700 w-4 h-4" />
                        <span>{t('admin_is_active')}</span>
                      </label>
                    </div>
                  </div>
                  <div className="mt-6 pt-3 border-t border-gray-50 flex flex-wrap items-center gap-3 justify-end">
                    <button onClick={() => setShippingFormOpen(false)} className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-gray-50 transition">{t('admin_cancel')}</button>
                    <button onClick={saveShippingMethod} className="rounded-full bg-burgundy-700 hover:bg-burgundy-800 text-xs font-bold text-white px-4 py-2 transition">{shippingFormMode === 'create' ? (t('admin_create_shipping' as any) || 'Create') : t('admin_save_changes')}</button>
                  </div>
                </div>
              )}

              {/* Shipping Table */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm font-sans">
                  <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50 text-[#857375]">
                      <th className={`${isRTL ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-semibold uppercase tracking-wider`}>{t('admin_name')}</th>
                      <th className={`${isRTL ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden md:table-cell`}>{t('product_description')}</th>
                      <th className={`${isRTL ? 'text-left' : 'text-right'} px-6 py-4 text-xs font-semibold uppercase tracking-wider`}>{t('admin_price')}</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider">{t('admin_status')}</th>
                      <th className="text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider">{t('admin_actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shippingMethods.length > 0 ? shippingMethods.map(method => (
                      <tr key={method.id} className="border-b border-gray-50/50 hover:bg-gray-50/30">
                        <td className={`px-6 py-4 text-xs font-bold text-foreground ${isRTL ? 'text-right' : ''}`}>{method.name}</td>
                        <td className={`px-6 py-4 hidden md:table-cell text-xs text-muted-foreground font-semibold ${isRTL ? 'text-right' : ''}`}>{method.description || '-'}</td>
                        <td className={`px-6 py-4 text-xs font-bold ${isRTL ? 'text-left' : 'text-right'}`}>{(Number(method.price) || 0).toFixed(2)} {currency}</td>
                        <td className="px-6 py-4 text-center">
                          <button onClick={() => toggleShippingActive(method.id, method.isActive ?? false)} className={`px-2.5 py-1 border rounded-full text-[10px] font-bold uppercase transition-all ${method.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                            {method.isActive ? t('admin_active') : t('admin_inactive')}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openShippingForm(method)} className="p-1.5 hover:bg-burgundy-50 hover:text-burgundy-700 text-muted-foreground rounded-lg transition-colors"><Pencil size={13} /></button>
                            <button onClick={() => deleteShippingMethod(method.id)} className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-muted-foreground rounded-lg transition-colors"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground font-sans text-xs">{t('admin_no_data')}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Factures Tab */}
          {tab === 'factures' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : ''}>
                  <h1 className="font-serif text-3xl font-bold text-[#1f1517]">{t('admin_factures')}</h1>
                  <p className="text-muted-foreground text-sm mt-1">{factures.length} {t('admin_factures_no_factures').toLowerCase()}</p>
                </div>
                <button
                  onClick={() => {
                    setFactureForm({ customerName: '', customerPhone: '', customerEmail: '', notes: '', items: [] });
                    setFactureProductSearch('');
                    setFactureQuantity(1);
                    setFacturePrice('0');
                    setFactureSelectedProduct(null);
                    setFactureFormOpen(true);
                  }}
                  className={`inline-flex items-center gap-2 rounded-full bg-burgundy-700 hover:bg-burgundy-800 shadow-md text-white px-5 py-2.5 text-xs font-sans font-bold transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <Plus size={14} /> {t('admin_factures_create')}
                </button>
              </div>

              {/* Facture Form Modal */}
              {factureFormOpen && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 animate-in slide-in-from-top-6 duration-300">
                  <div className={`flex items-center justify-between mb-5 pb-3 border-b border-gray-50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h2 className="font-serif text-lg font-bold text-foreground">{t('admin_factures_manual_sale')}</h2>
                    <button onClick={() => setFactureFormOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-muted-foreground transition">
                      <X size={16} />
                    </button>
                  </div>
                  
                  {/* Customer Info */}
                  <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_factures_customer')}</label>
                      <input value={factureForm.customerName} onChange={e => setFactureForm(f => ({ ...f, customerName: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" placeholder={t('admin_factures_walk_in')} />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_factures_phone')}</label>
                      <input value={factureForm.customerPhone} onChange={e => setFactureForm(f => ({ ...f, customerPhone: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                    </div>
                    <div className="grid gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">{t('admin_factures_email')}</label>
                      <input value={factureForm.customerEmail} onChange={e => setFactureForm(f => ({ ...f, customerEmail: e.target.value }))} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                    </div>
                  </div>

                  {/* Product Search & Add */}
                  <div className="border border-gray-100 rounded-xl p-4 mb-4">
                    <label className="text-xs font-semibold text-slate-700 mb-2 block">{t('admin_factures_add_products')}</label>
                    <div className="flex gap-2 mb-3">
                      <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={factureProductSearch}
                          onChange={e => setFactureProductSearch(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm"
                          placeholder={t('admin_factures_search')}
                        />
                      </div>
                    </div>
                    {factureProductSearch && (
                      <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl mb-3">
                        {products
                          .filter(p => p.name.toLowerCase().includes(factureProductSearch.toLowerCase()))
                          .slice(0, 8)
                          .map(p => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setFactureSelectedProduct(p);
                                setFacturePrice(String(p.price));
                                setFactureQuantity(1);
                                setFactureProductSearch('');
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-beige-50 border-b border-gray-50 flex items-center gap-3"
                            >
                              {p.thumbnailUrl || p.thumbnail_url ? (
                                <img src={p.thumbnailUrl || p.thumbnail_url || ''} alt={p.name} className="w-8 h-8 object-cover rounded" />
                              ) : (
                                <div className="w-8 h-8 bg-beige-50 rounded flex items-center justify-center"><Package size={12} /></div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{p.name}</p>
                                <p className="text-xs text-muted-foreground">{(Number(p.price) || 0).toFixed(2)} QAR • Stock: {p.stock}</p>
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                    {factureSelectedProduct && (
                      <div className="flex items-center gap-3 p-3 bg-beige-50 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{factureSelectedProduct.name}</p>
                          <p className="text-xs text-muted-foreground">{(Number(factureSelectedProduct.price) || 0).toFixed(2)} QAR each</p>
                        </div>
                        <input
                          type="number"
                          min="1"
                          max={factureSelectedProduct.stock}
                          value={factureQuantity}
                          onChange={e => setFactureQuantity(Number(e.target.value))}
                          className="w-16 text-center rounded-xl border border-gray-200 px-2 py-1.5 text-sm"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={facturePrice}
                          onChange={e => setFacturePrice(e.target.value)}
                          className="w-20 text-center rounded-xl border border-gray-200 px-2 py-1.5 text-sm"
                        />
                        <button
                          onClick={() => {
                            const existing = factureForm.items.findIndex(i => i.productId === factureSelectedProduct.id);
                            if (existing >= 0) {
                              const updated = [...factureForm.items];
                              updated[existing].quantity += factureQuantity;
                              setFactureForm(f => ({ ...f, items: updated }));
                            } else {
                              setFactureForm(f => ({
                                ...f,
                                items: [...f.items, {
                                  productId: factureSelectedProduct.id,
                                  productName: factureSelectedProduct.name,
                                  productThumbnail: factureSelectedProduct.thumbnailUrl || factureSelectedProduct.thumbnail_url,
                                  price: Number(facturePrice),
                                  quantity: factureQuantity,
                                }]
                              }));
                            }
                            setFactureSelectedProduct(null);
                            setFacturePrice('0');
                            setFactureQuantity(1);
                          }}
                          className="btn-primary text-xs px-3 py-1.5"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  {factureForm.items.length > 0 && (
                    <div className="mb-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-2 text-xs font-semibold uppercase text-muted-foreground">Product</th>
                            <th className="text-center py-2 text-xs font-semibold uppercase text-muted-foreground">Qty</th>
                            <th className="text-right py-2 text-xs font-semibold uppercase text-muted-foreground">Price</th>
                            <th className="text-right py-2 text-xs font-semibold uppercase text-muted-foreground">Subtotal</th>
                            <th className="py-2 w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {factureForm.items.map((item, i) => (
                            <tr key={i} className="border-b border-gray-50">
                              <td className="py-2 text-sm font-medium">{item.productName}</td>
                              <td className="py-2 text-center">{item.quantity}</td>
                              <td className="py-2 text-right">{(Number(item.price) || 0).toFixed(2)} QAR</td>
                              <td className="py-2 text-right font-semibold">{(Number(item.price) * item.quantity).toFixed(2)} QAR</td>
                              <td className="py-2">
                                <button
                                  onClick={() => setFactureForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={3} className="py-3 text-right font-bold text-sm">Total:</td>
                            <td className="py-3 text-right font-bold text-sm font-serif text-lg">
                              {factureForm.items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0).toFixed(2)} QAR
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="grid gap-1.5 mb-4">
                    <label className="text-xs font-semibold text-slate-700">{t('admin_factures_notes')}</label>
                    <textarea value={factureForm.notes} onChange={e => setFactureForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end gap-3 pt-3 border-t border-gray-50">
                    <button onClick={() => setFactureFormOpen(false)} className="btn-outline text-xs">{t('admin_factures_cancel')}</button>
                      <button
                      onClick={async () => {
                        if (!factureForm.items.length) return alert(t('admin_factures_no_factures'));
                        try {
                          await api.post('/factures', factureForm);
                          alert('✅ ' + t('admin_factures_created'));
                          setFactureFormOpen(false);
                          const f = await api.get<any[]>('/factures');
                          setFactures(f || []);
                        } catch (e) {
                          alert('❌ ' + t('admin_factures_failed'));
                        }
                      }}
                      disabled={!factureForm.items.length}
                      className="btn-primary text-xs"
                    >
                      {t('admin_factures_create_button')}
                    </button>
                  </div>
                </div>
              )}

              {/* Factures List */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-sans">
                    <thead>
                      <tr className="border-b border-gray-50 bg-gray-50/50 text-[#857375]">
                        <th className={`${isRTL ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-semibold uppercase tracking-wider`}>Facture #</th>
                        <th className={`${isRTL ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-semibold uppercase tracking-wider`}>Customer</th>
                        <th className={`${isRTL ? 'text-right' : 'text-left'} px-6 py-4 text-xs font-semibold uppercase tracking-wider`}>Date</th>
                        <th className={`${isRTL ? 'text-left' : 'text-right'} px-6 py-4 text-xs font-semibold uppercase tracking-wider`}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {factures.length > 0 ? factures.map(f => (
                        <tr key={f.id} className="border-b border-gray-50/50 hover:bg-gray-50/30">
                          <td className={`px-6 py-4 font-mono text-xs font-bold text-foreground ${isRTL ? 'text-right' : ''}`}>#{f.facture_number}</td>
                          <td className={`px-6 py-4 ${isRTL ? 'text-right' : ''}`}>
                            <p className="font-semibold text-xs">{f.first_name} {f.last_name}</p>
                            <p className="text-[10px] text-muted-foreground">{f.email}</p>
                          </td>
                          <td className={`px-6 py-4 text-xs text-muted-foreground ${isRTL ? 'text-right' : ''}`}>
                            {new Date(f.created_at).toLocaleDateString()}
                          </td>
                          <td className={`px-6 py-4 font-bold text-xs ${isRTL ? 'text-left' : 'text-right'}`}>{(Number(f.total) || 0).toFixed(2)} {currency}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="py-8 text-center text-muted-foreground font-sans text-xs">No factures yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
