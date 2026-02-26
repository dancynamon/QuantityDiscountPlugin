# Shopify Quantity Discount Plugin — Installation Guide

A drop-in quantity discount plugin for Shopify themes. Displays tiered pricing on product pages so customers can see how much they save when buying in bulk. Fully configurable from the Shopify theme editor — no code changes needed after install.

---

## Features

- **Tiered quantity discounts** — percentage off, fixed amount off, or fixed price per item
- **Three display styles** — Cards, Table, or Quick-select Pills
- **Theme editor integration** — configure tiers, colors, and labels from Customize without touching code
- **Live price updates** — price display and savings update as the customer changes quantity
- **Smart nudging** — "Add 3 more to unlock 10% off" messaging
- **Cart integration** — attaches discount metadata as line item properties
- **Variant-aware** — recalculates when the customer switches product variants
- **Responsive** — looks great on desktop and mobile
- **Lightweight** — ~6 KB JS + ~3 KB CSS, no dependencies

---

## Installation

### Step 1: Upload Assets

1. In your Shopify admin, go to **Online Store > Themes**
2. Click **Actions > Edit code** on your active theme
3. Upload the following files:

| File | Upload to |
|---|---|
| `assets/quantity-discount.js` | **Assets** folder |
| `assets/quantity-discount.css` | **Assets** folder |
| `sections/quantity-discount-settings.liquid` | **Sections** folder |
| `snippets/quantity-discount.liquid` | **Snippets** folder |

### Step 2: Add to Your Product Template

Open your **product template** file. The exact file depends on your theme:

- **Dawn / Online Store 2.0 themes**: `sections/main-product.liquid`
- **Debut / older themes**: `templates/product.liquid`
- **Sectioned themes**: Look for your product section file

Add this line where you want the discount tiers to appear (typically above or below the quantity selector / add-to-cart button):

```liquid
{% render 'quantity-discount' %}
```

### Step 3: Configure Discount Tiers

1. Go to **Online Store > Themes > Customize**
2. Navigate to a **Product page**
3. Find the **Quantity Discounts** section in the left sidebar
4. Configure your settings:

| Setting | Description |
|---|---|
| **Enable quantity discounts** | Turn the feature on/off globally |
| **Section title** | Heading shown above the tiers (e.g., "Buy More, Save More") |
| **Discount type** | Percentage off, fixed amount off, or fixed price per item |
| **Display style** | Cards, Table, or Quick-select Pills |
| **Accent color** | Matches your brand color |
| **Show savings** | Display per-item and total savings |
| **Highlight best value** | Visually emphasize the tier with the biggest discount |

5. Click **Add block** to create discount tiers:

| Tier Setting | Description |
|---|---|
| **Minimum quantity** | The quantity at which this tier activates |
| **Maximum quantity** | Upper limit (0 = unlimited) |
| **Discount value** | The amount — meaning depends on Discount Type above |
| **Tier label** | Optional custom label (e.g., "Starter Pack") |
| **Tier badge** | Optional badge text (e.g., "POPULAR", "BEST DEAL") |

---

## Example Configurations

### Percentage-Based Discounts (Most Common)

| Tier | Min Qty | Max Qty | Discount Value |
|---|---|---|---|
| 1 | 2 | 4 | 5 (= 5% off) |
| 2 | 5 | 9 | 10 (= 10% off) |
| 3 | 10 | 24 | 15 (= 15% off) |
| 4 | 25 | 0 | 20 (= 20% off) |

### Fixed Price Tiers (Wholesale)

Set **Discount type** = "Fixed price per item"

| Tier | Min Qty | Discount Value |
|---|---|---|
| 1 | 10 | 8.99 (= $8.99 each) |
| 2 | 25 | 7.99 (= $7.99 each) |
| 3 | 50 | 6.99 (= $6.99 each) |

---

## Applying Actual Discounts at Checkout

This plugin **displays** quantity-based pricing and attaches discount metadata to cart line items. To actually **apply** the discounted price at checkout, you need one of the following:

### Option A: Shopify Automatic Discounts (Recommended)

1. Go to **Discounts** in your Shopify admin
2. Create an **Automatic discount** > **Amount off products**
3. Set **Minimum purchase requirements** to match your tiers
4. This is the simplest approach and works on all Shopify plans

### Option B: Shopify Scripts (Shopify Plus)

If you're on Shopify Plus, use **Shopify Scripts** to read the line item properties (`_qty_discount_price`, `_qty_discount_value`) and apply the correct price at checkout.

### Option C: Third-Party Discount Apps

Several Shopify apps can read line item properties and apply dynamic pricing. The plugin stores:

- `_qty_discount` — human-readable discount label (e.g., "10% off")
- `_qty_discount_price` — the calculated unit price
- `_qty_discount_type` — "percentage", "fixed_amount", or "fixed_price"
- `_qty_discount_value` — the raw discount value

---

## Customization

### Changing Styles

Override any CSS class prefixed with `qd-` in your theme's stylesheet. Key classes:

```css
.qd-container        /* Outer wrapper */
.qd-card             /* Individual tier card */
.qd-card--active     /* Currently selected tier */
.qd-card--best       /* Best-value tier */
.qd-card-badge       /* Badge label on a card */
.qd-live-summary     /* Price summary below tiers */
```

### JavaScript API

The plugin exposes `window.QuantityDiscount` for advanced integrations:

```javascript
// The constructor is called automatically.
// Access the instance via the container element:
var container = document.getElementById('qd-container-...');
```

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Tiers don't appear | Make sure the section is **enabled** in the theme editor and has at least one tier block added |
| Price doesn't update live | The plugin looks for standard Shopify quantity input selectors. If your theme uses a custom quantity input, add `name="quantity"` to it |
| Styles look off | The plugin inherits your theme's font. Override `--qd-accent` and other CSS variables for fine-tuning |
| Discounts don't apply at checkout | See "Applying Actual Discounts at Checkout" above — this plugin handles the display; checkout pricing needs Shopify Discounts, Scripts, or an app |

---

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). No dependencies required.
