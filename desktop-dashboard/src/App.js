import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import {
  LayoutDashboard, Package, Tag, ShoppingBag, Users, Truck,
  TrendingUp, Plus, Menu, LogOut, Pencil, Trash2,
  Star, X, AlertTriangle, FileText, Search, Settings, Wifi, WifiOff,
  Image as ImageIcon, ChevronUp, ChevronDown, Film, UploadCloud
} from 'lucide-react';
import { apiService } from './services/api';

const STATUS_COLORS = {
  pending: 'badge-pending', confirmed: 'badge-confirmed', processing: 'badge-processing',
  shipped: 'badge-shipped', delivered: 'badge-delivered', cancelled: 'badge-cancelled',
};
const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const MakhmalLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="16" fill="#7a1f30"/>
    <text x="16" y="22" textAnchor="middle" fill="white" fontFamily="'Playfair Display',serif" fontSize="18" fontWeight="bold">M</text>
  </svg>
);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('admin@makhmal.com');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(apiService.getBaseUrl());
  const [connectionTested, setConnectionTested] = useState(false);
  const [stats, setStats] = useState({ orders: 0, revenue: 0, products: 0, customers: 0, low_stock: 0 });
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [factures, setFactures] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  const [factureFormOpen, setFactureFormOpen] = useState(false);
  const [factureForm, setFactureForm] = useState({ customerName: '', customerPhone: '', customerEmail: '', notes: '', items: [] });
  const [factureProductSearch, setFactureProductSearch] = useState('');
  const [factureQuantity, setFactureQuantity] = useState(1);
  const [facturePrice, setFacturePrice] = useState('0');
  const [factureSelectedProduct, setFactureSelectedProduct] = useState(null);
  const [factureSaving, setFactureSaving] = useState(false);

  // Product form
  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState({
    id: '', name: '', description: '', price: '', stock: '', thumbnailUrl: '',
    categoryId: '', brandId: '', isActive: true, isFeatured: false, tags: ''
  });
  const [productSaving, setProductSaving] = useState(false);

  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    id: '', name: '', description: '', imageUrl: '', parentId: '', sortOrder: '0', isActive: true
  });
  const [, setCategorySaving] = useState(false);

  // Brand form
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [brandForm, setBrandForm] = useState({
    id: '', name: '', description: '', logoUrl: '', sortOrder: '0', isFeatured: false, isActive: true
  });
  const [, setBrandSaving] = useState(false);

  // Shipping form
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    id: '', name: '', description: '', price: '0', isActive: true
  });
  const [, setShippingSaving] = useState(false);

  // Hero slide form
  const [showHeroForm, setShowHeroForm] = useState(false);
  const [heroForm, setHeroForm] = useState({
    id: '', url: '', type: 'image', title: '', subtitle: '', ctaLabel: '', ctaHref: '', linkProductId: '', isActive: true
  });
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);

  const fetchFactures = useCallback(async () => {
    try {
      const facturesData = await apiService.get('/factures');
      setFactures(facturesData || []);
    } catch (error) {
      console.error('Failed to fetch factures:', error);
      setFactures([]);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, productsRes, categoriesRes, brandsRes, shippingRes, facturesRes, heroRes] = await Promise.all([
        apiService.get('/orders?all=true'),
        apiService.get('/products?all=true'),
        apiService.get('/categories?all=true'),
        apiService.get('/brands?all=true'),
        apiService.get('/shipping-methods?all=true'),
        apiService.get('/factures'),
        apiService.get('/homepage-hero/all'),
      ]);

      const allOrders = ordersRes || [];
      const allProducts = productsRes?.data || [];
      const revenue = allOrders.filter(order => order.status !== 'cancelled').reduce((sum, order) => sum + Number(order.total || 0), 0);
      const lowStock = allProducts.filter(product => Number(product.stock) <= 5 && Number(product.stock) > 0).length;

      setStats({
        orders: allOrders.length,
        revenue,
        products: allProducts.length,
        customers: new Set(allOrders.map(order => order.email)).size,
        low_stock: lowStock,
      });
      setOrders(allOrders);
      setProducts(allProducts);
      setCategories(categoriesRes || []);
      setBrands(brandsRes || []);
      setShippingMethods(shippingRes || []);
      setFactures(facturesRes || []);
      setHeroSlides(heroRes || []);
    } catch (e) {
      setError('Failed to connect to backend. Make sure the server is running.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) { setIsLoggedIn(true); fetchAllData(); }
  }, [fetchAllData]);

  useEffect(() => {
    if (!isLoggedIn) return;
    if (activeTab === 'factures' && factures.length === 0) fetchFactures();
  }, [activeTab, isLoggedIn, factures.length, fetchFactures]);

  // Initialize API service and monitor connection
  useEffect(() => {
    apiService.initialize();
    const unsubscribe = apiService.subscribe((online) => {
      setIsConnected(online);
    });
    return () => {
      unsubscribe();
      apiService.stopHealthChecks();
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await apiService.post('/auth/login', {
        email: loginEmail,
        password: loginPassword,
      });
      if (data?.token) {
        localStorage.setItem('admin_token', data.token);
        setIsLoggedIn(true);
        fetchAllData();
      } else {
        setError('Login failed. Invalid response from server.');
      }
    } catch (loginError) {
      console.error(loginError);
      setError('Invalid credentials or backend unavailable.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsLoggedIn(false);
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await apiService.patch(`/orders/${orderId}`, { status });
      const refreshed = await apiService.get('/orders?all=true');
      setOrders(refreshed || []);
      alert('? Order status updated');
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('? Failed to update order status');
    }
  };

  const createFacture = async () => {
    if (!factureForm.items.length) return alert('Add at least one item');
    setFactureSaving(true);
    try {
      await apiService.post('/factures', factureForm);
      alert('? Facture created successfully!');
      setFactureFormOpen(false);
      await fetchFactures();
      await fetchAllData();
    } catch (e) {
      console.error(e);
      alert('? Failed to create facture. Check backend connection.');
    }
    setFactureSaving(false);
  };

  const saveProduct = async () => {
    if (!productForm.name) return alert('Product name is required');
    setProductSaving(true);
    try {
      const payload = {
        name: productForm.name, description: productForm.description,
        price: Number(productForm.price) || 0, stock: Number(productForm.stock) || 0,
        thumbnailUrl: productForm.thumbnailUrl || null,
        categoryId: productForm.categoryId || null, brandId: productForm.brandId || null,
        isActive: productForm.isActive, isFeatured: productForm.isFeatured, tags: productForm.tags,
      };
      if (productForm.id) {
        const res = await apiService.patch(`/products/${productForm.id}`, payload);
        setProducts(prev => prev.map(p => p.id === productForm.id ? res : p));
      } else {
        const res = await apiService.post('/products', payload);
        setProducts(prev => [res, ...prev]);
      }
      await fetchAllData();
      alert('? Product saved');
      setShowProductForm(false);
    } catch (e) {
      console.error(e);
      alert('? Failed to save product');
    }
    setProductSaving(false);
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await apiService.delete(`/products/${id}`);
      await fetchAllData();
    } catch {
      alert('? Failed to delete');
    }
  };

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #180a0e 0%, #2d2224 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="card" style={{ maxWidth: 400, width: '100%', padding: '40px 32px', textAlign: 'center' }}>
          <MakhmalLogo />
          <h1 style={{ fontSize: 28, marginTop: 16, marginBottom: 4, color: '#180a0e' }}>MAKHMAL</h1>
          <p style={{ color: '#8a7a7d', fontSize: 13, marginBottom: 32 }}>Admin Dashboard</p>
          {error && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 16px', borderRadius: 8, fontSize: 12, marginBottom: 16 }}>{error}</div>}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Email</label>
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="admin@makhmal.com" required style={{ width: '100%' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4, display: 'block' }}>Password</label>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="admin123" required style={{ width: '100%' }} />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }}>Sign In</button>
          </form>
          <p style={{ color: '#9ca3af', fontSize: 11, marginTop: 20 }}>Demo mode - Enter any credentials</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', tab: 'dashboard' },
    { icon: ImageIcon, label: 'Hero Banners', tab: 'hero' },
    { icon: Package, label: 'Products', tab: 'products' },
    { icon: Tag, label: 'Categories', tab: 'categories' },
    { icon: Star, label: 'Brands', tab: 'brands' },
    { icon: ShoppingBag, label: 'Orders', tab: 'orders' },
    { icon: FileText, label: 'Factures', tab: 'factures' },
    { icon: Truck, label: 'Shipping', tab: 'shipping' },
  ];

  const saveCategory = async () => {
    if (!categoryForm.name) return alert('Category name is required');
    setCategorySaving(true);
    try {
      const payload = {
        name: categoryForm.name, description: categoryForm.description,
        imageUrl: categoryForm.imageUrl, parentId: categoryForm.parentId || null,
        sortOrder: Number(categoryForm.sortOrder), isActive: categoryForm.isActive,
      };
      if (categoryForm.id) {
        const res = await apiService.patch(`/categories/${categoryForm.id}`, payload);
        setCategories(prev => prev.map(c => c.id === categoryForm.id ? res : c));
      } else {
        const res = await apiService.post('/categories', payload);
        setCategories(prev => [res, ...prev]);
      }
      await fetchAllData();
      alert('? Category saved');
      setShowCategoryForm(false);
    } catch (e) {
      console.error(e);
      alert('? Failed to save category');
    }
    setCategorySaving(false);
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await apiService.delete(`/categories/${id}`);
      await fetchAllData();
    } catch {
      alert('? Failed to delete');
    }
  };

  const saveBrand = async () => {
    if (!brandForm.name) return alert('Brand name is required');
    setBrandSaving(true);
    try {
      const payload = {
        name: brandForm.name, description: brandForm.description,
        logoUrl: brandForm.logoUrl, sortOrder: Number(brandForm.sortOrder),
        isFeatured: brandForm.isFeatured, isActive: brandForm.isActive,
      };
      if (brandForm.id) {
        const res = await apiService.patch(`/brands/${brandForm.id}`, payload);
        setBrands(prev => prev.map(b => b.id === brandForm.id ? res : b));
      } else {
        const res = await apiService.post('/brands', payload);
        setBrands(prev => [res, ...prev]);
      }
      await fetchAllData();
      alert('? Brand saved');
      setShowBrandForm(false);
    } catch (e) {
      console.error(e);
      alert('? Failed to save brand');
    }
    setBrandSaving(false);
  };

  const deleteBrand = async (id) => {
    if (!window.confirm('Delete this brand?')) return;
    try {
      await apiService.delete(`/brands/${id}`);
      await fetchAllData();
    } catch {
      alert('? Failed to delete');
    }
  };

  const saveShippingMethod = async () => {
    if (!shippingForm.name) return alert('Shipping name is required');
    setShippingSaving(true);
    try {
      const payload = {
        name: shippingForm.name, description: shippingForm.description,
        price: Number(shippingForm.price), isActive: shippingForm.isActive,
      };
      if (shippingForm.id) {
        const res = await apiService.patch(`/shipping-methods/${shippingForm.id}`, payload);
        setShippingMethods(prev => prev.map(m => m.id === shippingForm.id ? res : m));
      } else {
        const res = await apiService.post('/shipping-methods', payload);
        setShippingMethods(prev => [res, ...prev]);
      }
      await fetchAllData();
      alert('? Shipping method saved');
      setShowShippingForm(false);
    } catch (e) {
      console.error(e);
      alert('? Failed to save shipping method');
    }
    setShippingSaving(false);
  };

  const deleteShippingMethod = async (id) => {
    if (!window.confirm('Delete this shipping method?')) return;
    try {
      await apiService.delete(`/shipping-methods/${id}`);
      await fetchAllData();
    } catch {
      alert('? Failed to delete');
    }
  };

  const uploadFile = async (file, field) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const result = await apiService.post('/uploads', formData);
      const url = result?.url || '';
      if (!url) throw new Error('Upload failed');
      if (field === 'thumbnailUrl') setProductForm(prev => ({ ...prev, thumbnailUrl: url }));
      if (field === 'imageUrl') setCategoryForm(prev => ({ ...prev, imageUrl: url }));
      if (field === 'logoUrl') setBrandForm(prev => ({ ...prev, logoUrl: url }));
    } catch (error) {
      console.error(error);
      alert('Image upload failed.');
    }
  };

  const uploadHeroMedia = async (file) => {
    setHeroUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const result = await apiService.post('/uploads?folder=hero', formData);
      const url = result?.url || '';
      if (!url) throw new Error('Upload failed');
      setHeroForm(prev => ({ ...prev, url, type: file.type.startsWith('video/') ? 'video' : 'image' }));
    } catch (error) {
      console.error(error);
      alert('Media upload failed.');
    } finally {
      setHeroUploading(false);
    }
  };

  const saveHeroSlide = async () => {
    if (!heroForm.url) return alert('Upload an image or video first');
    setHeroSaving(true);
    try {
      const payload = {
        url: heroForm.url,
        type: heroForm.type,
        title: heroForm.title,
        subtitle: heroForm.subtitle,
        cta_label: heroForm.ctaLabel,
        cta_href: heroForm.ctaHref,
        link_product_id: heroForm.linkProductId || null,
        is_active: heroForm.isActive,
      };
      if (heroForm.id) {
        const res = await apiService.patch(`/homepage-hero/${heroForm.id}`, payload);
        setHeroSlides(prev => prev.map(h => h.id === heroForm.id ? res : h));
      } else {
        const res = await apiService.post('/homepage-hero', { ...payload, position: heroSlides.length });
        setHeroSlides(prev => [...prev, res]);
      }
      alert('Hero slide saved');
      setShowHeroForm(false);
    } catch (e) {
      console.error(e);
      alert('Failed to save hero slide');
    }
    setHeroSaving(false);
  };

  const deleteHeroSlide = async (id) => {
    if (!window.confirm('Delete this hero slide?')) return;
    try {
      await apiService.delete(`/homepage-hero/${id}`);
      setHeroSlides(prev => prev.filter(h => h.id !== id));
    } catch {
      alert('Failed to delete');
    }
  };

  const toggleHeroActive = async (id, isActive) => {
    try {
      const res = await apiService.patch(`/homepage-hero/${id}`, { is_active: !isActive });
      setHeroSlides(prev => prev.map(h => h.id === id ? res : h));
    } catch {
      alert('Failed to update hero slide');
    }
  };

  const moveHeroSlide = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= heroSlides.length) return;
    const reordered = [...heroSlides];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setHeroSlides(reordered);
    try {
      await Promise.all([
        apiService.patch(`/homepage-hero/${reordered[index].id}`, { position: index }),
        apiService.patch(`/homepage-hero/${reordered[targetIndex].id}`, { position: targetIndex }),
      ]);
    } catch (e) {
      console.error(e);
      alert('Failed to reorder hero slides');
      await fetchAllData();
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#faf8f6' }}>
      <aside style={{ width: sidebarOpen ? 240 : 72, height: '100vh', background: '#180a0e', color: 'white', display: 'flex', flexDirection: 'column', transition: 'width 0.3s', flexShrink: 0, boxShadow: '2px 0 20px rgba(0,0,0,0.08)' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <MakhmalLogo />
          {sidebarOpen && <div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700 }}>MAKHMAL</div><div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Admin</div></div>}
        </div>
        <nav style={{ flex: 1, padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {navItems.map(({ icon: Icon, label, tab }) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '12px 14px', borderRadius: 16, border: 'none',
              background: activeTab === tab ? '#7a1f30' : 'transparent', color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.75)',
              cursor: 'pointer', fontSize: 13, fontFamily: "'Inter', sans-serif", fontWeight: activeTab === tab ? 700 : 500,
              transition: 'background 0.2s, color 0.2s', textAlign: 'left'
            }}>
              <Icon size={18} opacity={0.9} />
              {sidebarOpen && <span>{label}</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 14px', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)',
            cursor: 'pointer', fontSize: 13, fontFamily: "'Inter', sans-serif", fontWeight: 600,
            transition: 'background 0.2s, color 0.2s'
          }}>
            <LogOut size={18} /> {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ height: 60, background: 'white', borderBottom: '1px solid #e8ddd0', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ padding: 9, background: 'none', border: '1px solid #e8ddd0', borderRadius: 12, cursor: 'pointer', color: '#8a7a7d' }}><Menu size={20} /></button>
            <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: '#8a7a7d', textTransform: 'uppercase', letterSpacing: 2 }}>{activeTab}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Connection status indicator */}
            <div
              onClick={() => setShowSettings(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 20,
                background: isConnected ? '#ecfdf5' : '#fef2f2',
                border: `1px solid ${isConnected ? '#bbf7d0' : '#fecaca'}`,
                cursor: 'pointer', fontSize: 11, fontWeight: 600, color: isConnected ? '#047857' : '#b91c1c'
              }}
              title={`API URL: ${apiService.getBaseUrl()}\nClick to change settings`}
            >
              {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <button onClick={() => setShowSettings(true)} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#8a7a7d' }}>
              <Settings size={18} />
            </button>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f7f1eb', border: '1px solid #efe4d6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#7a1f30' }}>A</div>
          </div>
        </header>

        {/* Settings Modal */}
        {showSettings && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 20
          }} onClick={() => setShowSettings(false)}>
            <div className="card" style={{ maxWidth: 500, width: '100%', padding: 32 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700 }}>Connection Settings</h3>
                <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a7a7d' }}><X size={20} /></button>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>API Server URL</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={apiUrlInput}
                    onChange={e => setApiUrlInput(e.target.value)}
                    placeholder="http://localhost:4000"
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid #e8ddd0', fontSize: 13 }}
                  />
                  <button
                    onClick={async () => {
                      setConnectionTested(false);
                      const success = await apiService.setBaseUrl(apiUrlInput);
                      setConnectionTested(true);
                      if (success) {
                        setError('');
                        setIsConnected(true);
                        fetchAllData();
                      } else {
                        setIsConnected(false);
                      }
                    }}
                    className="btn-primary"
                    style={{ padding: '10px 16px', fontSize: 12, whiteSpace: 'nowrap' }}
                  >
                    Test & Save
                  </button>
                </div>
                {connectionTested && (
                  <p style={{ fontSize: 12, marginTop: 6, color: isConnected ? '#047857' : '#b91c1c' }}>
                    {isConnected ? 'Connected successfully!' : 'Failed to connect. Check your server is running.'}
                  </p>
                )}
              </div>

              <div style={{ borderTop: '1px solid #efe4d6', paddingTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Quick Select</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Local Backend', url: 'http://localhost:4000' },
                    { label: 'Production (Railway)', url: 'https://backend-production-75f6f.up.railway.app' },
                  ].map(option => (
                    <button
                      key={option.url}
                      onClick={async () => {
                        setApiUrlInput(option.url);
                        setConnectionTested(false);
                        const success = await apiService.setBaseUrl(option.url);
                        setConnectionTested(true);
                        if (success) {
                          setIsConnected(true);
                          fetchAllData();
                        } else {
                          setIsConnected(false);
                        }
                      }}
                      style={{
                        padding: '8px 14px', borderRadius: 10, border: '1px solid #e8ddd0',
                        background: apiUrlInput === option.url ? '#7a1f30' : 'white',
                        color: apiUrlInput === option.url ? 'white' : '#374151',
                        cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #efe4d6', paddingTop: 16, marginTop: 16 }}>
                <p style={{ fontSize: 11, color: '#8a7a7d' }}>
                  Current URL: <strong>{apiService.getBaseUrl()}</strong>
                </p>
                <p style={{ fontSize: 11, color: '#8a7a7d', marginTop: 4 }}>
                  Status: {isConnected ? 'Connected' : 'Disconnected'}
                  {isConnected && ' - Health checks every 30s'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto', padding: '24px', maxWidth: 1280, width: '100%', margin: '0 auto' }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#b91c1c', marginBottom: 16 }}>{error}<button onClick={() => setError('')} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#b91c1c', fontWeight: 700 }}>Dismiss</button></div>}
          {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>}

          {!loading && activeTab === 'dashboard' && (
            <div className="animate-fade-in">
              <h1 className="section-title" style={{ marginBottom: 24 }}>Dashboard</h1>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                  { label: 'Total Orders', value: stats.orders, icon: ShoppingBag, color: '#047857', bg: '#ecfdf5' },
                  { label: 'Revenue', value: `${Number(stats.revenue || 0).toFixed(0)} QAR`, icon: TrendingUp, color: '#7a1f30', bg: '#fdf2f4' },
                  { label: 'Products', value: stats.products, icon: Package, color: '#6d28d9', bg: '#f5f3ff' },
                  { label: 'Customers', value: stats.customers, icon: Users, color: '#b45309', bg: '#fffbeb' },
                ].map((stat, i) => (
                  <div key={i} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: '#8a7a7d', marginBottom: 8 }}>{stat.label}</p>
                        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: '#2d2224' }}>{stat.value}</p>
                      </div>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <stat.icon size={18} color={stat.color} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {stats.low_stock > 0 && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <AlertTriangle size={20} color="#dc2626" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 13, color: '#991b1b' }}>{stats.low_stock} products with low stock</p>
                  <p style={{ fontSize: 12, color: '#b91c1c', marginTop: 2 }}>Please refill supply.</p>
                </div>
                <button className="btn-outline" style={{ padding: '6px 16px', fontSize: 11 }} onClick={() => setActiveTab('products')}>View Products</button>
              </div>}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid #efe4d6' }}><h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700 }}>Recent Orders</h3></div>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead><tr><th>Order #</th><th>Customer</th><th>Status</th><th style={{ textAlign: 'right' }}>Total</th><th style={{ textAlign: 'center' }}>Update</th></tr></thead>
                    <tbody>
                      {orders.slice(0, 10).map(order => (
                        <tr key={order.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>#{order.order_number}</td>
                          <td><p style={{ fontWeight: 600, fontSize: 13 }}>{order.first_name} {order.last_name}</p><p style={{ fontSize: 11, color: '#8a7a7d' }}>{order.email}</p></td>
                          <td><span className={`badge ${STATUS_COLORS[order.status] || 'badge-pending'}`}>{order.status}</span></td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{Number(order.total || 0).toFixed(2)} QAR</td>
                          <td style={{ textAlign: 'center' }}>
                            <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #e8ddd0', cursor: 'pointer' }}>
                              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#8a7a7d', padding: 40 }}>No orders yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'products' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div><h1 className="section-title" style={{ margin: 0 }}>Products</h1><p style={{ fontSize: 13, color: '#8a7a7d', marginTop: 4 }}>{products.length} products</p></div>
                <button className="btn-primary" onClick={() => { setProductForm({ id: '', name: '', description: '', price: '', stock: '0', thumbnailUrl: '', categoryId: '', brandId: '', isActive: true, isFeatured: false, tags: '' }); setShowProductForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> Add Product</button>
              </div>
              {showProductForm && (
                <div className="card" style={{ marginBottom: 24, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}><h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>{productForm.id ? 'Edit' : 'New'} Product</h3><button onClick={() => setShowProductForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a7a7d' }}><X size={20} /></button></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Name *</label><input value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} style={{ width: '100%' }} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Price (QAR)</label><input type="number" step="0.01" value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} style={{ width: '100%' }} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Stock</label><input type="number" value={productForm.stock} onChange={e => setProductForm(f => ({ ...f, stock: e.target.value }))} style={{ width: '100%' }} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Thumbnail URL</label>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <input value={productForm.thumbnailUrl} onChange={e => setProductForm(f => ({ ...f, thumbnailUrl: e.target.value }))} style={{ width: '100%' }} />
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input type="file" id="product-thumbnail-upload" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'thumbnailUrl')} />
                          <label htmlFor="product-thumbnail-upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, border: '1px solid #e8ddd0', background: '#fff', color: '#7a1f30', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Upload Image</label>
                          {productForm.thumbnailUrl && <span style={{ fontSize: 12, color: '#6b7280' }}>Preview available</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Description</label><textarea value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ width: '100%' }} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Tags</label><input value={productForm.tags} onChange={e => setProductForm(f => ({ ...f, tags: e.target.value }))} style={{ width: '100%' }} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Category</label><select value={productForm.categoryId} onChange={e => setProductForm(f => ({ ...f, categoryId: e.target.value }))} style={{ width: '100%' }}><option value="">Select</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Brand</label><select value={productForm.brandId} onChange={e => setProductForm(f => ({ ...f, brandId: e.target.value }))} style={{ width: '100%' }}><option value="">Select</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><input type="checkbox" checked={productForm.isFeatured} onChange={e => setProductForm(f => ({ ...f, isFeatured: e.target.checked }))} /> Featured</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><input type="checkbox" checked={productForm.isActive} onChange={e => setProductForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                    <button className="btn-outline" onClick={() => setShowProductForm(false)}>Cancel</button>
                    <button className="btn-primary" onClick={saveProduct} disabled={productSaving}>{productSaving ? 'Saving...' : (productForm.id ? 'Save Changes' : 'Create Product')}</button>
                  </div>
                </div>
              )}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {(product.thumbnailUrl || product.thumbnail_url) ? <img src={product.thumbnailUrl || product.thumbnail_url} alt={product.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', border: '1px solid #efe4d6' }} onError={e => { e.target.style.display = 'none'; }} /> : <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f7f1eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={14} color="#c4b4a0" /></div>}
                              <div><p style={{ fontWeight: 600, fontSize: 13 }}>{product.name}</p><p style={{ fontSize: 11, color: '#8a7a7d' }}>{product.brand?.name || '-'}</p></div>
                            </div>
                          </td>
                          <td style={{ fontWeight: 700 }}>{Number(product.price || 0).toFixed(2)} QAR</td>
                          <td><span className={`badge ${Number(product.stock) === 0 ? 'stock-out' : Number(product.stock) <= 5 ? 'stock-low' : 'stock-instock'}`}>{product.stock}</span></td>
                          <td><span className={`badge ${(product.isActive || product.is_active) ? 'badge-active' : 'badge-inactive'}`}>{(product.isActive || product.is_active) ? 'Active' : 'Inactive'}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                              <button onClick={() => { setProductForm({ id: product.id, name: product.name, description: product.description || '', price: String(product.price || 0), stock: String(product.stock || 0), thumbnailUrl: product.thumbnailUrl || product.thumbnail_url || '', categoryId: product.categoryId || '', brandId: product.brandId || '', isActive: product.isActive !== false, isFeatured: !!product.isFeatured, tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || '') }); setShowProductForm(true); }} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#8a7a7d' }} title="Edit"><Pencil size={14} /></button>
                              <button onClick={() => deleteProduct(product.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }} title="Delete"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'orders' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div><h1 className="section-title" style={{ margin: 0 }}>Orders</h1><p style={{ fontSize: 13, color: '#8a7a7d', marginTop: 4 }}>{orders.length} total orders</p></div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#8a7a7d' }}>Filter:</span>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ fontSize: 12, padding: '6px 12px' }}>
                    <option value="all">All Orders</option>
                    {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th>Status</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
                    <tbody>
                      {filteredOrders.map(order => (
                        <tr key={order.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>#{order.order_number}</td>
                          <td><p style={{ fontWeight: 600, fontSize: 13 }}>{order.first_name} {order.last_name}</p><p style={{ fontSize: 11, color: '#8a7a7d' }}>{order.city}, {order.country}</p></td>
                          <td style={{ fontSize: 12, color: '#8a7a7d' }}>{formatDate(order.created_at)}</td>
                          <td>
                            <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)} className={`badge ${STATUS_COLORS[order.status] || 'badge-pending'}`} style={{ cursor: 'pointer', outline: 'none', background: 'transparent' }}>
                              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                            </select>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{Number(order.total || 0).toFixed(2)} QAR</td>
                        </tr>
                      ))}
                      {filteredOrders.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#8a7a7d', padding: 40 }}>No orders found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'factures' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div><h1 className="section-title" style={{ margin: 0 }}>Factures</h1><p style={{ fontSize: 13, color: '#8a7a7d', marginTop: 4 }}>{factures.length} manual sale invoices</p></div>
                <button className="btn-primary" onClick={() => { setFactureForm({ customerName: '', customerPhone: '', customerEmail: '', notes: '', items: [] }); setFactureProductSearch(''); setFactureQuantity(1); setFacturePrice('0'); setFactureSelectedProduct(null); setFactureFormOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> Create Facture</button>
              </div>
              {factureFormOpen && (
                <div className="card" style={{ marginBottom: 24, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}><h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>Create Manual Sale (Facture)</h3><button onClick={() => setFactureFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a7a7d' }}><X size={20} /></button></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Customer Name</label><input value={factureForm.customerName} onChange={e => setFactureForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Walk-in Customer" style={{ width: '100%' }} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Phone</label><input value={factureForm.customerPhone} onChange={e => setFactureForm(f => ({ ...f, customerPhone: e.target.value }))} style={{ width: '100%' }} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email</label><input value={factureForm.customerEmail} onChange={e => setFactureForm(f => ({ ...f, customerEmail: e.target.value }))} style={{ width: '100%' }} /></div>
                  </div>
                  <div style={{ border: '1px solid #e8ddd0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Add Products</label>
                    <div style={{ position: 'relative', marginBottom: 12 }}>
                      <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#8a7a7d' }} />
                      <input value={factureProductSearch} onChange={e => setFactureProductSearch(e.target.value)} placeholder="Search products..." style={{ width: '100%', paddingLeft: 36 }} />
                    </div>
                    {factureProductSearch && <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid #e8ddd0', borderRadius: 8, marginBottom: 12 }}>
                      {products.filter(p => p.name.toLowerCase().includes(factureProductSearch.toLowerCase())).slice(0, 8).map(p => (
                        <button key={p.id} onClick={() => { setFactureSelectedProduct(p); setFacturePrice(String(p.price)); setFactureQuantity(1); setFactureProductSearch(''); }} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', border: 'none', borderBottom: '1px solid #f3f4f6', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                          {p.thumbnailUrl || p.thumbnail_url ? <img src={p.thumbnailUrl || p.thumbnail_url} alt={p.name} style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }} /> : <div style={{ width: 32, height: 32, borderRadius: 4, background: '#f7f1eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={12} color="#c4b4a0" /></div>}
                          <div style={{ flex: 1, textAlign: 'left' }}><p style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</p><p style={{ fontSize: 11, color: '#8a7a7d' }}>{Number(p.price || 0).toFixed(2)} QAR ? Stock: {p.stock}</p></div>
                        </button>
                      ))}
                    </div>}
                    {factureSelectedProduct && <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#f7f1eb', borderRadius: 8 }}>
                      <div style={{ flex: 1 }}><p style={{ fontWeight: 600, fontSize: 13 }}>{factureSelectedProduct.name}</p><p style={{ fontSize: 11, color: '#8a7a7d' }}>{Number(factureSelectedProduct.price || 0).toFixed(2)} QAR each</p></div>
                      <input type="number" min="1" max={factureSelectedProduct.stock} value={factureQuantity} onChange={e => setFactureQuantity(Number(e.target.value))} style={{ width: 60, textAlign: 'center' }} />
                      <input type="number" step="0.01" value={facturePrice} onChange={e => setFacturePrice(e.target.value)} style={{ width: 80, textAlign: 'center' }} />
                      <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 11 }} onClick={() => {
                        const idx = factureForm.items.findIndex(i => i.productId === factureSelectedProduct.id);
                        if (idx >= 0) { const u = [...factureForm.items]; u[idx].quantity += factureQuantity; setFactureForm(f => ({ ...f, items: u })); }
                        else { setFactureForm(f => ({ ...f, items: [...f.items, { productId: factureSelectedProduct.id, productName: factureSelectedProduct.name, productThumbnail: factureSelectedProduct.thumbnailUrl || factureSelectedProduct.thumbnail_url, price: Number(facturePrice), quantity: factureQuantity }] })); }
                        setFactureSelectedProduct(null); setFacturePrice('0'); setFactureQuantity(1);
                      }}>Add</button>
                    </div>}
                  </div>
                  {factureForm.items.length > 0 && <div style={{ marginBottom: 16 }}>
                    <table><thead><tr><th style={{ textAlign: 'left' }}>Product</th><th style={{ textAlign: 'center' }}>Qty</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right' }}>Subtotal</th><th></th></tr></thead>
                    <tbody>{factureForm.items.map((item, i) => (
                      <tr key={i}><td style={{ fontWeight: 500 }}>{item.productName}</td><td style={{ textAlign: 'center' }}>{item.quantity}</td><td style={{ textAlign: 'right' }}>{Number(item.price || 0).toFixed(2)} QAR</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{(Number(item.price) * item.quantity).toFixed(2)} QAR</td><td><button onClick={() => setFactureForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><X size={14} /></button></td></tr>
                    ))}</tbody>
                    <tfoot><tr><td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>Total:</td><td style={{ textAlign: 'right', fontWeight: 700, fontFamily: "'Playfair Display', serif", fontSize: 18 }}>{factureForm.items.reduce((s, item) => s + (Number(item.price) * item.quantity), 0).toFixed(2)} QAR</td><td></td></tr></tfoot>
                    </table>
                  </div>}
                  <div style={{ marginBottom: 16 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Notes</label><textarea value={factureForm.notes} onChange={e => setFactureForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ width: '100%' }} /></div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                    <button className="btn-outline" onClick={() => setFactureFormOpen(false)}>Cancel</button>
                    <button className="btn-primary" onClick={createFacture} disabled={!factureForm.items.length || factureSaving}>{factureSaving ? 'Creating...' : 'Create Facture'}</button>
                  </div>
                </div>
              )}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead><tr><th>Facture #</th><th>Customer</th><th>Date</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
                    <tbody>
                      {factures.map(f => (
                        <tr key={f.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700 }}>#{f.facture_number}</td>
                          <td><p style={{ fontWeight: 600, fontSize: 13 }}>{f.first_name} {f.last_name}</p><p style={{ fontSize: 11, color: '#8a7a7d' }}>{f.email}</p></td>
                          <td style={{ fontSize: 12, color: '#8a7a7d' }}>{formatDate(f.created_at)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{Number(f.total || 0).toFixed(2)} QAR</td>
                        </tr>
                      ))}
                      {factures.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#8a7a7d', padding: 40 }}>No factures yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'categories' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div><h1 className="section-title" style={{ margin: 0 }}>Categories</h1><p style={{ fontSize: 13, color: '#8a7a7d', marginTop: 4 }}>{categories.length} categories</p></div>
                <button className="btn-primary" onClick={() => { setCategoryForm({ id: '', name: '', description: '', imageUrl: '', parentId: '', sortOrder: '0', isActive: true }); setShowCategoryForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> Add Category</button>
              </div>
              {showCategoryForm && (
                <div className="card" style={{ marginBottom: 24, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}><h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>{categoryForm.id ? 'Edit' : 'New'} Category</h3><button onClick={() => setShowCategoryForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a7a7d' }}><X size={20} /></button></div>
                  <div style={{ display: 'grid', gap: 16 }}>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Name</label><input value={categoryForm.name} onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))} style={{ width: '100%' }} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Description</label><textarea value={categoryForm.description} onChange={e => setCategoryForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ width: '100%' }} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Image URL</label>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <input value={categoryForm.imageUrl} onChange={e => setCategoryForm(f => ({ ...f, imageUrl: e.target.value }))} style={{ width: '100%' }} />
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input type="file" id="category-image-upload" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'imageUrl')} />
                          <label htmlFor="category-image-upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, border: '1px solid #e8ddd0', background: '#fff', color: '#7a1f30', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Upload Image</label>
                        </div>
                      </div>
                    </div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Sort Order</label><input type="number" value={categoryForm.sortOrder} onChange={e => setCategoryForm(f => ({ ...f, sortOrder: e.target.value }))} style={{ width: '100%' }} /></div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><input type="checkbox" checked={categoryForm.isActive} onChange={e => setCategoryForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                    <button className="btn-outline" onClick={() => setShowCategoryForm(false)}>Cancel</button>
                    <button className="btn-primary" onClick={saveCategory}>{categoryForm.id ? 'Save Changes' : 'Create Category'}</button>
                  </div>
                </div>
              )}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead><tr><th>Category</th><th>Description</th><th style={{ textAlign: 'center' }}>Sort</th><th style={{ textAlign: 'center' }}>Status</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
                    <tbody>
                      {categories.map(cat => (
                        <tr key={cat.id}>
                          <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{cat.imageUrl || cat.image_url ? <img src={cat.imageUrl || cat.image_url} alt={cat.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} /> : <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f7f1eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Tag size={14} color="#c4b4a0" /></div>}<span style={{ fontWeight: 600, fontSize: 13 }}>{cat.name}</span></div></td>
                          <td style={{ fontSize: 12, color: '#8a7a7d' }}>{cat.description || '-'}</td>
                          <td style={{ textAlign: 'center', fontSize: 12 }}>{cat.sortOrder || cat.sort_order || 0}</td>
                          <td style={{ textAlign: 'center' }}><span className={`badge ${(cat.isActive || cat.is_active) ? 'badge-active' : 'badge-inactive'}`}>{(cat.isActive || cat.is_active) ? 'Active' : 'Inactive'}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                              <button onClick={() => { setCategoryForm({ id: cat.id, name: cat.name, description: cat.description || '', imageUrl: cat.imageUrl || cat.image_url || '', parentId: cat.parentId || '', sortOrder: String(cat.sortOrder || cat.sort_order || 0), isActive: cat.isActive || cat.is_active }); setShowCategoryForm(true); }} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#8a7a7d' }}><Pencil size={14} /></button>
                              <button onClick={() => deleteCategory(cat.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'brands' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div><h1 className="section-title" style={{ margin: 0 }}>Brands</h1><p style={{ fontSize: 13, color: '#8a7a7d', marginTop: 4 }}>{brands.length} brands</p></div>
                <button className="btn-primary" onClick={() => { setBrandForm({ id: '', name: '', description: '', logoUrl: '', sortOrder: '0', isFeatured: false, isActive: true }); setShowBrandForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> Add Brand</button>
              </div>
              {showBrandForm && (
                <div className="card" style={{ marginBottom: 24, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}><h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>{brandForm.id ? 'Edit' : 'New'} Brand</h3><button onClick={() => setShowBrandForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a7a7d' }}><X size={20} /></button></div>
                  <div style={{ display: 'grid', gap: 16 }}>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Name</label><input value={brandForm.name} onChange={e => setBrandForm(f => ({ ...f, name: e.target.value }))} style={{ width: '100%' }} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Description</label><textarea value={brandForm.description} onChange={e => setBrandForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ width: '100%' }} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Logo URL</label>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <input value={brandForm.logoUrl} onChange={e => setBrandForm(f => ({ ...f, logoUrl: e.target.value }))} style={{ width: '100%' }} />
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input type="file" id="brand-logo-upload" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0], 'logoUrl')} />
                          <label htmlFor="brand-logo-upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, border: '1px solid #e8ddd0', background: '#fff', color: '#7a1f30', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Upload Logo</label>
                        </div>
                      </div>
                    </div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Sort Order</label><input type="number" value={brandForm.sortOrder} onChange={e => setBrandForm(f => ({ ...f, sortOrder: e.target.value }))} style={{ width: '100%' }} /></div>
                    <div style={{ display: 'flex', gap: 24 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><input type="checkbox" checked={brandForm.isFeatured} onChange={e => setBrandForm(f => ({ ...f, isFeatured: e.target.checked }))} /> Featured</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><input type="checkbox" checked={brandForm.isActive} onChange={e => setBrandForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                    <button className="btn-outline" onClick={() => setShowBrandForm(false)}>Cancel</button>
                    <button className="btn-primary" onClick={saveBrand}>{brandForm.id ? 'Save Changes' : 'Create Brand'}</button>
                  </div>
                </div>
              )}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead><tr><th>Brand</th><th>Description</th><th style={{ textAlign: 'center' }}>Status</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
                    <tbody>
                      {brands.map(brand => (
                        <tr key={brand.id}>
                          <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{brand.logoUrl || brand.logo_url ? <img src={brand.logoUrl || brand.logo_url} alt={brand.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'contain' }} /> : <div style={{ width: 36, height: 36, borderRadius: 6, background: '#f7f1eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={14} color="#c4b4a0" /></div>}<span style={{ fontWeight: 600, fontSize: 13 }}>{brand.name}</span></div></td>
                          <td style={{ fontSize: 12, color: '#8a7a7d' }}>{brand.description || '-'}</td>
                          <td style={{ textAlign: 'center' }}><span className={`badge ${brand.isActive || brand.is_active ? 'badge-active' : 'badge-inactive'}`}>{brand.isActive || brand.is_active ? 'Active' : 'Inactive'}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                              <button onClick={() => { setBrandForm({ id: brand.id, name: brand.name, description: brand.description || '', logoUrl: brand.logoUrl || brand.logo_url || '', sortOrder: String(brand.sortOrder ?? brand.sort_order ?? 0), isFeatured: !!brand.isFeatured, isActive: brand.isActive || brand.is_active }); setShowBrandForm(true); }} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#8a7a7d' }}><Pencil size={14} /></button>
                              <button onClick={() => deleteBrand(brand.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'shipping' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div><h1 className="section-title" style={{ margin: 0 }}>Shipping Methods</h1><p style={{ fontSize: 13, color: '#8a7a7d', marginTop: 4 }}>{shippingMethods.length} methods</p></div>
                <button className="btn-primary" onClick={() => { setShippingForm({ id: '', name: '', description: '', price: '0', isActive: true }); setShowShippingForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> Add Method</button>
              </div>
              {showShippingForm && (
                <div className="card" style={{ marginBottom: 24, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}><h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>{shippingForm.id ? 'Edit' : 'New'} Shipping Method</h3><button onClick={() => setShowShippingForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a7a7d' }}><X size={20} /></button></div>
                  <div style={{ display: 'grid', gap: 16 }}>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Name</label><input value={shippingForm.name} onChange={e => setShippingForm(f => ({ ...f, name: e.target.value }))} style={{ width: '100%' }} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Description</label><textarea value={shippingForm.description} onChange={e => setShippingForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ width: '100%' }} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Price (QAR)</label><input type="number" step="0.01" value={shippingForm.price} onChange={e => setShippingForm(f => ({ ...f, price: e.target.value }))} style={{ width: '100%' }} /></div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><input type="checkbox" checked={shippingForm.isActive} onChange={e => setShippingForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                    <button className="btn-outline" onClick={() => setShowShippingForm(false)}>Cancel</button>
                    <button className="btn-primary" onClick={saveShippingMethod}>{shippingForm.id ? 'Save Changes' : 'Create Method'}</button>
                  </div>
                </div>
              )}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead><tr><th>Name</th><th>Description</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'center' }}>Status</th><th style={{ textAlign: 'center' }}>Actions</th></tr></thead>
                    <tbody>
                      {shippingMethods.map(method => (
                        <tr key={method.id}>
                          <td style={{ fontWeight: 600, fontSize: 13 }}>{method.name}</td>
                          <td style={{ fontSize: 12, color: '#8a7a7d' }}>{method.description || '-'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }}>{(Number(method.price) || 0).toFixed(2)} QAR</td>
                          <td style={{ textAlign: 'center' }}><span className={`badge ${method.isActive ? 'badge-active' : 'badge-inactive'}`}>{method.isActive ? 'Active' : 'Inactive'}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                              <button onClick={() => { setShippingForm({ id: method.id, name: method.name, description: method.description || '', price: String(method.price ?? 0), isActive: method.isActive }); setShowShippingForm(true); }} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#8a7a7d' }}><Pencil size={14} /></button>
                              <button onClick={() => deleteShippingMethod(method.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!loading && activeTab === 'hero' && (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div><h1 className="section-title" style={{ margin: 0 }}>Hero Banners</h1><p style={{ fontSize: 13, color: '#8a7a7d', marginTop: 4 }}>{heroSlides.length} slides configured for the homepage</p></div>
                <button className="btn-primary" onClick={() => { setHeroForm({ id: '', url: '', type: 'image', title: '', subtitle: '', ctaLabel: '', ctaHref: '', linkProductId: '', isActive: true }); setShowHeroForm(true); }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Plus size={16} /> Add Slide</button>
              </div>
              {showHeroForm && (
                <div className="card" style={{ marginBottom: 24, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}><h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700 }}>{heroForm.id ? 'Edit' : 'New'} Hero Slide</h3><button onClick={() => setShowHeroForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a7a7d' }}><X size={20} /></button></div>
                  <div style={{ display: 'grid', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Media (Image or Video)</label>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ width: 120, height: 68, borderRadius: 8, background: '#f7f1eb', border: '1px solid #e8ddd0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {heroForm.url ? (
                            heroForm.type === 'video'
                              ? <video src={heroForm.url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <img src={heroForm.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : <ImageIcon size={20} color="#c4b4a0" />}
                        </div>
                        <div>
                          <input type="file" id="hero-media-upload" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && uploadHeroMedia(e.target.files[0])} />
                          <label htmlFor="hero-media-upload" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, border: '1px solid #e8ddd0', background: '#fff', color: '#7a1f30', cursor: heroUploading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, opacity: heroUploading ? 0.6 : 1 }}>
                            <UploadCloud size={14} /> {heroUploading ? 'Uploading...' : 'Upload Image or Video'}
                          </label>
                        </div>
                      </div>
                    </div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Title</label><input value={heroForm.title} onChange={e => setHeroForm(f => ({ ...f, title: e.target.value }))} style={{ width: '100%' }} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Subtitle</label><textarea value={heroForm.subtitle} onChange={e => setHeroForm(f => ({ ...f, subtitle: e.target.value }))} rows={2} style={{ width: '100%' }} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Button Label</label><input value={heroForm.ctaLabel} onChange={e => setHeroForm(f => ({ ...f, ctaLabel: e.target.value }))} style={{ width: '100%' }} /></div>
                      <div><label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Button Link (URL)</label><input value={heroForm.ctaHref} onChange={e => setHeroForm(f => ({ ...f, ctaHref: e.target.value }))} placeholder="/products" style={{ width: '100%' }} /></div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Link to Product (optional)</label>
                      <select value={heroForm.linkProductId} onChange={e => setHeroForm(f => ({ ...f, linkProductId: e.target.value }))} style={{ width: '100%' }}>
                        <option value="">No product link</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}><input type="checkbox" checked={heroForm.isActive} onChange={e => setHeroForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
                    <button className="btn-outline" onClick={() => setShowHeroForm(false)}>Cancel</button>
                    <button className="btn-primary" onClick={saveHeroSlide} disabled={heroSaving}>{heroSaving ? 'Saving...' : (heroForm.id ? 'Save Changes' : 'Create Slide')}</button>
                  </div>
                </div>
              )}
              {heroSlides.length === 0 ? (
                <div className="card" style={{ padding: 40, textAlign: 'center', color: '#8a7a7d', fontSize: 13 }}>No hero slides yet. Add your first banner.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {heroSlides.map((slide, i) => (
                    <div key={slide.id} className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <button onClick={() => moveHeroSlide(i, -1)} disabled={i === 0} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer', color: i === 0 ? '#e5e7eb' : '#8a7a7d', padding: 2 }}><ChevronUp size={16} /></button>
                        <button onClick={() => moveHeroSlide(i, 1)} disabled={i === heroSlides.length - 1} style={{ background: 'none', border: 'none', cursor: i === heroSlides.length - 1 ? 'not-allowed' : 'pointer', color: i === heroSlides.length - 1 ? '#e5e7eb' : '#8a7a7d', padding: 2 }}><ChevronDown size={16} /></button>
                      </div>
                      <div style={{ width: 96, height: 54, borderRadius: 8, background: '#f7f1eb', overflow: 'hidden', flexShrink: 0 }}>
                        {slide.type === 'video'
                          ? <video src={slide.url} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <img src={slide.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 13 }}>{slide.title || <span style={{ color: '#8a7a7d', fontStyle: 'italic' }}>Untitled slide</span>}</p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <span className="badge" style={{ background: slide.type === 'video' ? 'var(--purple-50)' : 'var(--sky-50)', border: `1px solid ${slide.type === 'video' ? 'var(--purple-200)' : 'var(--sky-200)'}`, color: slide.type === 'video' ? 'var(--purple-700)' : 'var(--sky-700)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {slide.type === 'video' ? <Film size={9} /> : <ImageIcon size={9} />} {slide.type}
                          </span>
                          {slide.link_product_id && <span className="badge badge-active">Linked to product</span>}
                        </div>
                      </div>
                      <button onClick={() => toggleHeroActive(slide.id, slide.is_active)} className={`badge ${slide.is_active ? 'badge-active' : 'badge-inactive'}`} style={{ border: 'none', cursor: 'pointer' }}>{slide.is_active ? 'Active' : 'Inactive'}</button>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setHeroForm({ id: slide.id, url: slide.url || '', type: slide.type === 'video' ? 'video' : 'image', title: slide.title || '', subtitle: slide.subtitle || '', ctaLabel: slide.cta_label || '', ctaHref: slide.cta_href || '', linkProductId: slide.link_product_id || '', isActive: Boolean(slide.is_active) }); setShowHeroForm(true); }} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#8a7a7d' }}><Pencil size={14} /></button>
                        <button onClick={() => deleteHeroSlide(slide.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
