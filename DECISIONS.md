# Design Decisions

This document records the key architectural and implementation decisions made during the development of the ecommerce store backend. Each entry follows the format: **Context → Options Considered → Choice → Reasoning**.

---

## Decision 1: Prices stored as integers in paise, not floats

**Context:**
The store calculates subtotals, discounts, and order totals across multiple items. Monetary values need to be accurate — rounding errors that compound across items and discount calculations are unacceptable.

**Options Considered:**
- **Option A — Floats:** Store prices as floating-point numbers (e.g. `12.99`). Natural to read and easy to display, but subject to IEEE 754 rounding errors.
- **Option B — Integer paise:** Store prices as integers representing the smallest currency unit (e.g. `1299` for ₹12.99). Requires a formatting layer but all arithmetic is exact.

**Choice:** Option B — integers in paise.

**Reasoning:**
JavaScript's IEEE 754 floats produce well-known errors in decimal arithmetic (`0.1 + 0.2 === 0.30000000000000004`). For financial calculations this is unacceptable — errors compound across items and discounts. Integer arithmetic is exact. The display layer converts via `(paise / 100).toFixed(2)`. Discount calculation uses `Math.floor` so the store never accidentally gives more discount than stated.

---

## Decision 2: App factory pattern (`createApp(store)`) over a singleton Express app

**Context:**
Tests need to run against isolated state. A global singleton store shared across test suites causes tests to pollute each other, making results non-deterministic.

**Options Considered:**
- **Option A — Global singleton:** Import the global store in every route file. Simple, but tests pollute each other.
- **Option B — Factory pattern:** `createApp(store)` accepts the store as an argument. More setup, but full isolation.
- **Option C — Reset in `beforeEach`:** Clear the store before each test. Fragile — requires knowing every piece of state to reset correctly.

**Choice:** Option B — factory pattern.

**Reasoning:**
Each test suite calls `createApp(createStore())` to get a fresh Express app wired to a fresh in-memory store. Tests are fully isolated, deterministic, and can run in parallel. The factory also makes the dependency graph explicit, which aids readability and future refactoring.

---

## Decision 3: Manual admin trigger for discount code generation (not automatic at checkout)

**Context:**
The spec requires "every nth order gets a coupon code." This is ambiguous — should the code be generated automatically after the nth order completes, or should an admin trigger it explicitly?

**Options Considered:**
- **Option A — Auto-generate:** Create a code immediately after every nth order. Simpler UX but couples checkout logic to code generation and requires a delivery mechanism (email, SMS) outside this scope.
- **Option B — Manual admin trigger:** Admin explicitly calls a separate endpoint to generate the code when the condition is met.

**Choice:** Option B — manual admin trigger.

**Reasoning:**
In real commerce, discount code issuance is a business decision. Auto-generation would require a delivery mechanism outside this project's scope. The admin API has clear idempotency: calling "generate" twice for the same milestone returns a `400`, preventing duplicate codes for the same cycle. This decouples concerns and matches real-world workflows.

---

## Decision 4: Result union types instead of exceptions for business errors

**Context:**
Service methods need to signal both success and failure to their callers (route handlers). The choice of error-signalling mechanism affects type safety, readability, and how callers handle errors.

**Options Considered:**
- **Option A — Throw custom error classes:** Idiomatic in some Node.js ecosystems; errors bubble automatically up the call stack.
- **Option B — Discriminated union returns:** Service methods return `{ data } | { error: string; statusCode: number }`. Explicit and type-safe.

**Choice:** Option B — discriminated union returns.

**Reasoning:**
For expected business errors (invalid cart, bad discount code), exceptions are semantically wrong — these are normal, anticipated outcomes. Union returns force the route handler to explicitly handle both cases. TypeScript's narrowing (`if ("error" in result)`) makes this ergonomic. Genuine unexpected errors still propagate as unhandled exceptions to Express error middleware.

---

## Decision 5: Price snapshot at time of add (`priceAtAdd`) in cart items

**Context:**
Product prices could change between the time a customer adds an item to their cart and the time they check out. The question is which price should be used at checkout.

**Options Considered:**
- **Option A — Live price at checkout:** Always read the current product price when the order is created. Simple but can silently change what the customer pays.
- **Option B — Snapshot at add time:** Store the price as `priceAtAdd` on the `CartItem` when the item is added to the cart.

**Choice:** Option B — price snapshot.

**Reasoning:**
Customers should see the same total from "add to cart" through to "complete checkout." Using the live price at checkout means a background price change silently alters what the customer pays, which is a poor and potentially deceptive experience. The snapshot is stored as `priceAtAdd` on the `CartItem` and is immutable thereafter.

---

## Decision 6: Atomic two-phase checkout (validate-then-mutate)

**Context:**
The checkout flow involves multiple validation steps (cart non-empty, stock available, discount code valid) followed by multiple mutations (deduct stock, create order, mark code used, clear cart). A failure mid-mutation could leave the store in an inconsistent state.

**Options Considered:**
- **Option A — Interleaved validate-and-mutate:** Validate and mutate each concern in sequence. Simpler code flow but risks partial state on failure.
- **Option B — Two-phase: all validation first, then all mutation:** Structured separation prevents any state change if any validation fails.

**Choice:** Option B — two-phase checkout.

**Reasoning:**
The checkout function follows a strict two-phase structure: (1) **validation phase** — read-only checks on cart contents, stock levels, and discount code validity; (2) **mutation phase** — deduct stock, create the order record, mark the code as used, and clear the cart. If any validation fails, the function returns early with zero state changed. This guarantees the store is never left in a partially-checked-out state.
