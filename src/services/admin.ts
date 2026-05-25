import { AnalyticsReport, Store, StoreConfig } from '../models/types';

export function createAdminService(store: Store) {
  function getStats(): AnalyticsReport {
    let totalItemsPurchased = 0;
    let totalRevenue = 0;
    let totalDiscountsGiven = 0;

    for (const order of store.orders.values()) {
      for (const item of order.items) {
        totalItemsPurchased += item.quantity;
      }
      totalRevenue += order.total;
      totalDiscountsGiven += order.discountAmount;
    }

    return {
      totalItemsPurchased,
      totalRevenue,
      discountCodes: Array.from(store.discountCodes.values()),
      totalDiscountsGiven,
    };
  }

  function getConfig(): StoreConfig {
    return { ...store.config };
  }

  function updateConfig(patch: Partial<StoreConfig>): StoreConfig {
    if (patch.nthOrder !== undefined) {
      store.config.nthOrder = patch.nthOrder;
    }
    if (patch.discountPercent !== undefined) {
      store.config.discountPercent = patch.discountPercent;
    }
    return { ...store.config };
  }

  return { getStats, getConfig, updateConfig };
}
