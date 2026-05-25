import { DiscountCode, ErrorResult, Store } from '../models/types';

function generateUniqueCode(existing: Map<string, DiscountCode>): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  do {
    const part = (n: number) =>
      Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    code = `SAVE-${part(4)}-${part(4)}`;
  } while (existing.has(code));
  return code;
}

export function createDiscountService(store: Store) {
  /**
   * Returns true when:
   *  1. At least one order has been placed
   *  2. orderCount is a multiple of nthOrder
   *  3. No code has been generated for the current nth-order cycle yet
   */
  function isGenerationEligible(): boolean {
    const { orderCount, config, lastGeneratedAtOrderCount } = store;
    if (orderCount === 0) return false;
    if (orderCount % config.nthOrder !== 0) return false;
    // A code was already generated for this cycle if lastGeneratedAtOrderCount equals orderCount
    if (lastGeneratedAtOrderCount === orderCount) return false;
    return true;
  }

  /**
   * Generates a unique SAVE-XXXX-XXXX discount code.
   * Returns ErrorResult if not eligible or already generated for this cycle.
   */
  function generateCode(): DiscountCode | ErrorResult {
    if (!isGenerationEligible()) {
      const { orderCount, config, lastGeneratedAtOrderCount } = store;
      if (orderCount > 0 && orderCount % config.nthOrder === 0 && lastGeneratedAtOrderCount === orderCount) {
        return {
          error: 'A discount code has already been generated for the current nth-order cycle',
          statusCode: 400,
        };
      }
      return {
        error: `Discount code generation condition not met (need a multiple of ${config.nthOrder} orders)`,
        statusCode: 400,
      };
    }

    const code = generateUniqueCode(store.discountCodes);
    const discountCode: DiscountCode = {
      code,
      discountPercent: store.config.discountPercent,
      used: false,
      createdAt: new Date().toISOString(),
    };

    store.discountCodes.set(code, discountCode);
    store.lastGeneratedAtOrderCount = store.orderCount;

    return discountCode;
  }

  /**
   * Validates a discount code — returns the code or an ErrorResult if not found / already used.
   */
  function validateCode(code: string): DiscountCode | ErrorResult {
    const discountCode = store.discountCodes.get(code);
    if (!discountCode) {
      return { error: `Discount code '${code}' not found`, statusCode: 400 };
    }
    if (discountCode.used) {
      return { error: `Discount code '${code}' has already been used`, statusCode: 400 };
    }
    return discountCode;
  }

  /**
   * Marks a discount code as used. No-op if the code doesn't exist.
   */
  function markCodeUsed(code: string): void {
    const discountCode = store.discountCodes.get(code);
    if (discountCode) {
      discountCode.used = true;
    }
  }

  return { isGenerationEligible, generateCode, validateCode, markCodeUsed };
}
