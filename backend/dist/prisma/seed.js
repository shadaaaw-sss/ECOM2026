import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    await prisma.setting.upsert({
        where: { key: 'shop_name' },
        update: { value: 'Makhmal' },
        create: { key: 'shop_name', value: 'Makhmal' },
    });
    await prisma.setting.upsert({
        where: { key: 'currency' },
        update: { value: 'QAR' },
        create: { key: 'currency', value: 'QAR' },
    });
    await prisma.setting.upsert({
        where: { key: 'tax_rate' },
        update: { value: '20' },
        create: { key: 'tax_rate', value: '20' },
    });
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    await prisma.user.upsert({
        where: { email: 'admin@makhmal.com' },
        update: {},
        create: {
            email: 'admin@makhmal.com',
            passwordHash: adminPassword,
            firstName: 'Admin',
            lastName: 'Makhmal',
            role: 'ADMIN',
            isEmailVerified: true,
        },
    });
    const categories = [
        { name: 'Skincare', description: 'Premium skincare essentials' },
        { name: 'Makeup', description: 'Color cosmetics and finishing touches' },
        { name: 'Hair Care', description: 'Hair nourishment and styling' },
        { name: 'Body Care', description: 'Gentle body care and rituals' },
        { name: 'Fragrances', description: 'Signature perfumes and body scents' },
        { name: 'Accessories', description: 'Beauty tools and accessories' },
    ];
    for (const item of categories) {
        await prisma.category.upsert({
            where: { name: item.name },
            update: { description: item.description },
            create: { name: item.name, description: item.description, sortOrder: 0 },
        });
    }
    const brands = [
        { name: 'Lancôme', description: 'Luxury skincare and fragrance' },
        { name: 'Estée Lauder', description: 'Timeless beauty icons' },
        { name: 'The Ordinary', description: 'Science-backed skincare' },
        { name: 'Dior', description: 'Elegant fragrance house' },
    ];
    for (const item of brands) {
        await prisma.brand.upsert({
            where: { name: item.name },
            update: { description: item.description },
            create: { name: item.name, description: item.description, isFeatured: true },
        });
    }
    const skincare = await prisma.category.findUnique({ where: { name: 'Skincare' } });
    const brand = await prisma.brand.findUnique({ where: { name: 'Lancôme' } });
    if (skincare && brand) {
        // Upsert by a unique product name or other means
        const existingProduct = await prisma.product.findFirst({
            where: { name: 'Advanced Génifique Serum' },
        });
        if (existingProduct) {
            await prisma.product.update({
                where: { id: existingProduct.id },
                data: {
                    description: 'A concentrated facial serum for radiant and smoother-looking skin.',
                    brandId: brand.id,
                    categoryId: skincare.id,
                    price: 620,
                    originalPrice: 780,
                    discountPercent: 20,
                    stock: 24,
                },
            });
        }
        else {
            await prisma.product.create({
                data: {
                    name: 'Advanced Génifique Serum',
                    description: 'A concentrated facial serum for radiant and smoother-looking skin.',
                    shortDescription: 'Best seller serum',
                    brandId: brand.id,
                    categoryId: skincare.id,
                    price: 620,
                    originalPrice: 780,
                    discountPercent: 20,
                    stock: 24,
                    tags: ['serum', 'glow', 'anti-aging'],
                    thumbnailUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
                    isFeatured: true,
                    isNew: true,
                    metaTitle: 'Advanced Génifique Serum',
                    metaDescription: 'Radiance serum for smoother-looking skin.',
                },
            });
        }
    }
    const shippingMethods = [
        { name: 'Standard Delivery', description: 'Takes 3 to 5 business days', price: 39 },
        { name: 'Express Delivery', description: 'Takes 1 to 2 business days', price: 79 },
        { name: 'Free Shipping', description: 'For loyalty card members or purchases over 500 QAR', price: 0 },
    ];
    for (const item of shippingMethods) {
        await prisma.shippingMethod.upsert({
            where: { name: item.name },
            update: { description: item.description, price: item.price },
            create: { name: item.name, description: item.description, price: item.price, isActive: true },
        });
    }
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
