# Shopify Quantity Discount Plugin

A single-file quantity discount plugin for Shopify. Upload one file, add the section from the theme editor — done.

---

## Installation (2 steps)

### Step 1: Upload the file

1. In your Shopify admin go to **Online Store > Themes**
2. Click **... > Edit code** on your active theme
3. In the **Sections** folder, click **Add a new section**
4. Name it `quantity-discounts` and replace the entire contents with the code from `quantity-discounts.liquid`
5. Click **Save**

### Step 2: Add to your product page

1. Go to **Online Store > Themes > Customize**
2. Navigate to a **Product page** using the page selector at the top
3. Click **Add section** in the left sidebar
4. Select **Quantity Discounts**
5. Drag it to where you want it (above or below the buy button works great)
6. Click **Save**

That's it. The section comes pre-loaded with 4 discount tiers (5%, 10%, 15%, 20% off) that you can customize.

---

## Configuration

Everything is controlled from the theme editor — no code changes needed.

### Section settings

| Setting | What it does |
|---|---|
| **Enable** | Toggle the entire feature on/off |
| **Title** | Heading text (default: "Buy More, Save More") |
| **Subtitle** | Description text below the title |
| **Discount type** | Percentage off, fixed amount off, or fixed price per item |
| **Display style** | Cards, Table, or Quick-select Pills |
| **Accent color** | Brand color for highlights, badges, and active states |
| **Show savings** | Display per-item and total savings amounts |
| **Highlight best value** | Visually emphasize the biggest discount tier |
| **Attach discount info to cart** | Adds discount metadata as line item properties |

### Adding / editing tiers

Click **Add block > Discount Tier** to create a new tier. Each tier has:

| Setting | What it means |
|---|---|
| **Minimum quantity** | Quantity where this tier kicks in |
| **Maximum quantity** | Upper limit (set 0 for no cap) |
| **Discount value** | The number — meaning depends on Discount Type (e.g., 10 = 10% off) |
| **Custom label** | Optional name like "Starter Pack" (auto-generates "2 – 4" if blank) |
| **Badge** | Optional badge like "POPULAR" or "BEST DEAL" |

---

## Example tier setups

**Percentage discounts** (most common):

| Qty Range | Discount Value | Result |
|---|---|---|
| 2 – 4 | 5 | 5% off |
| 5 – 9 | 10 | 10% off |
| 10 – 24 | 15 | 15% off |
| 25+ | 20 | 20% off |

**Wholesale fixed pricing** (set Discount Type = "Fixed price per item"):

| Min Qty | Discount Value | Result |
|---|---|---|
| 10 | 8.99 | $8.99 each |
| 25 | 7.99 | $7.99 each |
| 50 | 6.99 | $6.99 each |

---

## Applying discounts at checkout

This plugin **displays** tiered pricing and attaches metadata to cart items. To apply the actual discounted price at checkout, use one of these:

**Option A — Shopify Automatic Discounts (recommended, all plans):**
Go to **Discounts > Create discount > Amount off products** and set minimum quantity requirements matching your tiers.

**Option B — Shopify Scripts (Shopify Plus only):**
Read the `_qty_discount_price` and `_qty_discount_value` line item properties and adjust pricing in a checkout script.

**Option C — Third-party discount apps:**
The plugin writes these line item properties that apps can read:
- `_qty_discount` — e.g., "10% off"
- `_qty_discount_price` — calculated unit price
- `_qty_discount_type` — "percentage", "fixed_amount", or "fixed_price"
- `_qty_discount_value` — raw discount number

---

## Customization

Override styles using any `qd-` prefixed CSS class in your theme stylesheet:

```css
.qd-container { }         /* outer wrapper */
.qd-card { }              /* tier card */
.qd-card--active { }      /* selected tier */
.qd-card--best { }        /* best-value tier */
.qd-card-badge { }        /* badge label */
.qd-live-summary { }      /* price summary bar */
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Section doesn't appear | Make sure **Enable** is checked and at least one tier block exists |
| Price doesn't update when changing quantity | Your theme may use a non-standard quantity input — ensure it has `name="quantity"` |
| Discount not applied at checkout | This is expected — see "Applying discounts at checkout" above |
| Styles clash with my theme | Override the `qd-` CSS classes or change the accent color in settings |
