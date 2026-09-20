import { CartItem, Product, Sale } from '../types';

export interface ItemProfitDetail {
  revenue: number;
  cost: number;
  profit: number;
  hasCostData: boolean;
}

export interface SaleProfitDetail {
  saleId: string;
  revenue: number;
  cost: number;
  profit: number;
  items: {
    name: string;
    revenue: number;
    cost: number;
    profit: number;
  }[];
}

/**
 * Calculates cost and profit for an individual cart / sale item
 */
export function calculateItemProfit(item: CartItem, productsList: Product[] = []): ItemProfitDetail {
  const qty = Number(item.selectedQuantity || item.quantity) || 1;
  const weight = Number(item.selectedWeight || item.weight) || 0;
  
  // Calculate item revenue
  let revenue = 0;
  if (item.manualPrice !== undefined && item.manualPrice !== null) {
    revenue = Number(item.manualPrice);
  } else {
    const unitPrice = Number(item.selectedPrice || item.price) || 0;
    if (item.material === 'jewelry') {
      revenue = unitPrice * qty;
    } else {
      revenue = unitPrice * weight * qty;
    }
  }

  // Cost determination:
  // 1. First priority: snapshot on the item itself
  let unitCost: number | null = null;
  let hasCostData = false;

  const rawPurchasePrice = item.purchasePrice ?? (item as any).purchase_price;
  const rawPurchasePricePerGram = item.purchasePricePerGram ?? (item as any).purchase_price_per_gram;

  if (rawPurchasePrice !== undefined && rawPurchasePrice !== null && !isNaN(Number(rawPurchasePrice))) {
    hasCostData = true;
    if (item.material === 'jewelry') {
      unitCost = Number(rawPurchasePrice);
    } else if (rawPurchasePricePerGram !== undefined && rawPurchasePricePerGram !== null) {
      unitCost = Number(rawPurchasePricePerGram) * weight;
    } else {
      unitCost = Number(rawPurchasePrice);
    }
  } else if (rawPurchasePricePerGram !== undefined && rawPurchasePricePerGram !== null && !isNaN(Number(rawPurchasePricePerGram))) {
    hasCostData = true;
    unitCost = Number(rawPurchasePricePerGram) * weight;
  } else {
    // 2. Fallback: Lookup in current products list
    const matchedProduct = productsList.find(p => p.id === item.id || p.code === item.code || (p.name === item.name && p.material === item.material));
    if (matchedProduct) {
      const prodPurchase = matchedProduct.purchasePrice ?? (matchedProduct as any).purchase_price;
      const prodPerGram = matchedProduct.purchasePricePerGram ?? (matchedProduct as any).purchase_price_per_gram;
      
      if (prodPurchase !== undefined && prodPurchase !== null && !isNaN(Number(prodPurchase))) {
        hasCostData = true;
        if (item.material === 'jewelry') {
          unitCost = Number(prodPurchase);
        } else if (prodPerGram !== undefined && prodPerGram !== null) {
          unitCost = Number(prodPerGram) * weight;
        } else {
          const prodWeight = Number(matchedProduct.weight) || 1;
          unitCost = (Number(prodPurchase) / prodWeight) * weight;
        }
      } else if (prodPerGram !== undefined && prodPerGram !== null && !isNaN(Number(prodPerGram))) {
        hasCostData = true;
        unitCost = Number(prodPerGram) * weight;
      }
    }
  }

  const totalCost = hasCostData && unitCost !== null ? Math.round(unitCost * qty) : 0;
  const profit = Math.round(revenue - totalCost);

  return {
    revenue,
    cost: totalCost,
    profit,
    hasCostData
  };
}

/**
 * Calculates total profit breakdown for a complete sale
 */
export function calculateSaleProfit(sale: Sale, productsList: Product[] = []): SaleProfitDetail {
  const saleRevenue = Number(sale.totalAmount) || 0;
  let totalCost = 0;

  const itemDetails = (sale.items || []).map(item => {
    const itemProfit = calculateItemProfit(item, productsList);
    totalCost += itemProfit.cost;
    return {
      name: item.name,
      revenue: itemProfit.revenue,
      cost: itemProfit.cost,
      profit: itemProfit.profit,
    };
  });

  const saleProfit = saleRevenue - totalCost;

  return {
    saleId: sale.id,
    revenue: saleRevenue,
    cost: totalCost,
    profit: saleProfit,
    items: itemDetails
  };
}
