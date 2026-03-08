# Shopify Quantity Discount Plugin

Show quantity discount tiers right under the price (or anywhere) on your product pages — as a **block** inside your existing product section.

---

## Installation (3 steps)

### Step 1: Upload the snippet

1. In your Shopify admin go to **Online Store > Themes**
2. Click **... > Edit code** on your active theme
3. In the **Snippets** folder, click **Add a new snippet**
4. Name it `quantity-discounts` and replace the entire contents with the code from `snippets/quantity-discounts.liquid`
5. Click **Save**

### Step 2: Register the block in your product section

Open your main product section file (usually `sections/main-product.liquid` or similar) and make two small edits:

**Edit A — Add the render tag.** Find the place in your section's Liquid where blocks are rendered (look for `{%- when 'price' -%}` or similar `when` cases). Right after the price block's `when` case, add a new case:

```liquid
{%- when 'quantity_discounts' -%}
  {% render 'quantity-discounts', block: block, product: product %}
```

> **Tip:** Place it right after `{%- when 'price' -%}` so it renders directly under the price by default.

**Edit B — Add the block schema.** In the same file, scroll to the `{% schema %}` section at the bottom. Inside the `"blocks"` array, add the block definition from `block-schema.liquid`. Paste the entire JSON object (starts with `{ "type": "quantity_discounts"` ...) as a new entry in the blocks array.

Save the file.

### Step 3: Add the block in the theme editor

1. Go to **Online Store > Themes > Customize**
2. Navigate to a **Product page** using the page selector
3. In the left sidebar under the **Product** section, click **Add block**
4. Select **Quantity Discounts**
5. Drag it right under **Price** (or wherever you want it)
6. Configure your discount tiers in the block settings
7. Click **Save**

That's it! The block comes pre-loaded with 4 discount tiers (5%, 10%, 15%, 20% off).

---

## Also included: Standalone Section version

The original `quantity-discounts.liquid` file in the root folder is a **section** version. Use it if you just want to add discounts as a separate section (not inside the product form). Upload it to `sections/` and add it via "Add section" in the customizer. However, this version **cannot** be placed between blocks like Price and Buy Buttons — use the snippet/block version above for that.

---

## Configuration

Everything is controlled from the theme editor — no code changes needed after installation.

### Block settings

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

### Editing tiers

Each block supports up to 5 tiers. Each tier has:

| Setting | What it means |
|---|---|
| **Min quantity** | Quantity where this tier kicks in |
| **Max quantity** | Upper limit (set 0 for no cap) |
| **Discount value** | The number — meaning depends on Discount Type (e.g., 10 = 10% off) |
| **Custom label** | Optional name like "Starter Pack" (auto-generates "2 – 4" if blank) |
| **Badge** | Optional badge like "POPULAR" or "BEST DEAL" |

Set a tier's Min quantity to **0** to disable it.

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
| Block doesn't appear in "Add block" menu | Make sure you added the schema to your product section's `{% schema %}` blocks array |
| Discounts don't show on the page | Make sure **Enable** is checked and at least one tier has Min quantity > 0 |
| Price doesn't update when changing quantity | Your theme may use a non-standard quantity input — ensure it has `name="quantity"` |
| Discount not applied at checkout | This is expected — see "Applying discounts at checkout" above |
| Styles clash with my theme | Override the `qd-` CSS classes or change the accent color in settings |
