import { Router } from 'express';
import { prisma } from '../index.js';
import { authMiddleware, requireAdmin, getUserRoleFromHeader } from '../middleware/auth.js';
import { createSlug } from '../utils/slug.js';

export const productsRoutes = Router();

const parseSort = (sort: string) => {
  const [field, direction] = sort.split('_');
  const ascending = direction === 'asc';
  const sortOrder = ascending ? 'asc' as const : 'desc' as const;

  switch (field) {
    case 'price':
      return { price: sortOrder };
    case 'name':
      return { name: sortOrder };
    default:
      return { createdAt: sortOrder };
  }
};

productsRoutes.get('/', async (req, res) => {
  const {
    q,
    filter,
    category,
    brand,
    sort = 'createdAt_desc',
    min_price,
    max_price,
    page = '1',
    limit = '12',
    excludeId,
    all,
  } = req.query;

  const userRole = getUserRoleFromHeader(req);
  const allowAll = String(all) === 'true' && (userRole === 'ADMIN' || userRole === 'SUPERADMIN');

  const where: any = {};
  if (!allowAll) {
    where.isActive = true;
  }

  if (q) {
    where.OR = [
      { name: { contains: String(q), mode: 'insensitive' } },
      { description: { contains: String(q), mode: 'insensitive' } },
      { shortDescription: { contains: String(q), mode: 'insensitive' } },
    ];
  }

  if (filter === 'featured') {
    where.isFeatured = true;
  }
  if (filter === 'new') {
    where.isNew = true;
  }
  if (filter === 'sale') {
    where.discountPercent = { gt: 0 };
  }

  if (category) {
    where.categoryId = String(category);
  }

  if (brand) {
    where.brandId = String(brand);
  }

  if (min_price) {
    const value = parseFloat(String(min_price));
    if (!Number.isNaN(value)) where.price = { ...where.price, gte: value };
  }

  if (max_price) {
    const value = parseFloat(String(max_price));
    if (!Number.isNaN(value)) where.price = { ...where.price, lte: value };
  }

  if (excludeId) {
    where.id = { not: String(excludeId) };
  }

  const pageNumber = Math.max(1, parseInt(String(page), 10) || 1);
  const take = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 12));
  const skip = (pageNumber - 1) * take;

  const orderBy = parseSort(String(sort));

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: { brand: true, category: true },
      orderBy,
      skip,
      take,
    }),
  ]);

  res.json({ data: products, total });
});

productsRoutes.get('/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: String(req.params.id) },
    include: { brand: true, category: true, images: true },
  });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

productsRoutes.post('/', authMiddleware, requireAdmin, async (req, res) => {
  const {
    name,
    description,
    shortDescription,
    brandId,
    categoryId,
    subCategoryId,
    price,
    originalPrice,
    discountPercent,
    stock,
    weight,
    dimensions,
    tags,
    thumbnailUrl,
    isFeatured,
    isNew,
    isActive,
    metaTitle,
    metaDescription,
    images,
  } = req.body;

  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({ message: 'Name, price, and stock are required' });
  }

  const parsedTags = Array.isArray(tags)
    ? tags.filter((tag: string) => typeof tag === 'string').map((tag: string) => tag.trim()).filter(Boolean)
    : typeof tags === 'string'
      ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      : [];

  const product = await prisma.product.create({
    data: {
      name,
      slug: createSlug(name),
      description,
      shortDescription,
      brandId: brandId || null,
      categoryId: categoryId || null,
      subCategoryId: subCategoryId || null,
      price: Number(price),
      originalPrice: originalPrice !== undefined ? Number(originalPrice) : undefined,
      discountPercent: discountPercent !== undefined ? Number(discountPercent) : 0,
      stock: Number(stock),
      weight: weight !== undefined ? Number(weight) : undefined,
      dimensions,
      tags: parsedTags,
      thumbnailUrl,
      isFeatured: Boolean(isFeatured),
      isNew: Boolean(isNew),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      metaTitle,
      metaDescription,
      images: Array.isArray(images)
        ? {
            create: images
              .filter((image: any) => image && image.url)
              .map((image: any) => ({
                url: image.url,
                altText: image.altText || null,
                sortOrder: image.sortOrder ? Number(image.sortOrder) : 0,
              })),
          }
        : undefined,
    },
  });

  res.status(201).json(product);
});

productsRoutes.patch('/:id', authMiddleware, requireAdmin, async (req, res) => {
  const {
    name,
    description,
    shortDescription,
    brandId,
    categoryId,
    subCategoryId,
    price,
    originalPrice,
    discountPercent,
    stock,
    weight,
    dimensions,
    tags,
    thumbnailUrl,
    isFeatured,
    isNew,
    isActive,
    metaTitle,
    metaDescription,
    images,
  } = req.body;

  const updates: any = {};
  if (name !== undefined) {
    updates.name = name;
    updates.slug = createSlug(name);
  }
  if (description !== undefined) updates.description = description;
  if (shortDescription !== undefined) updates.shortDescription = shortDescription;
  if (brandId !== undefined) updates.brandId = brandId || null;
  if (categoryId !== undefined) updates.categoryId = categoryId || null;
  if (subCategoryId !== undefined) updates.subCategoryId = subCategoryId || null;
  if (price !== undefined) updates.price = Number(price);
  if (originalPrice !== undefined) updates.originalPrice = originalPrice !== null ? Number(originalPrice) : null;
  if (discountPercent !== undefined) updates.discountPercent = Number(discountPercent);
  if (stock !== undefined) updates.stock = Number(stock);
  if (weight !== undefined) updates.weight = weight !== null ? Number(weight) : null;
  if (dimensions !== undefined) updates.dimensions = dimensions;
  if (tags !== undefined) {
    updates.tags = Array.isArray(tags)
      ? tags.filter((tag: string) => typeof tag === 'string').map((tag: string) => tag.trim()).filter(Boolean)
      : typeof tags === 'string'
        ? tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : [];
  }
  if (thumbnailUrl !== undefined) updates.thumbnailUrl = thumbnailUrl;
  if (isFeatured !== undefined) updates.isFeatured = Boolean(isFeatured);
  if (isNew !== undefined) updates.isNew = Boolean(isNew);
  if (isActive !== undefined) updates.isActive = Boolean(isActive);
  if (metaTitle !== undefined) updates.metaTitle = metaTitle;
  if (metaDescription !== undefined) updates.metaDescription = metaDescription;

  if (Array.isArray(images)) {
    updates.images = {
      deleteMany: {},
      create: images
        .filter((image: any) => image && image.url)
        .map((image: any) => ({
          url: image.url,
          altText: image.altText || null,
          sortOrder: image.sortOrder ? Number(image.sortOrder) : 0,
        })),
    };
  }

  const product = await prisma.product.update({
    where: { id: String(req.params.id) },
    data: updates,
    include: { brand: true, category: true, images: true },
  });

  res.json(product);
});

productsRoutes.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  await prisma.product.delete({ where: { id: String(req.params.id) } });
  res.json({ ok: true });
});
