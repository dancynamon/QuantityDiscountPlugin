/**
 * Shopify Quantity Discount Plugin
 * Displays tiered quantity-based pricing on product pages
 * and applies discounts via cart line item properties.
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function formatMoney(cents, format) {
    if (typeof cents === 'string') cents = cents.replace('.', '');
    var value = '';
    var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
    var formatString = format || '${{amount}}';

    function addCommas(n) {
      return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    switch (formatString.match(placeholderRegex)[1]) {
      case 'amount':
        value = addCommas((cents / 100).toFixed(2));
        break;
      case 'amount_no_decimals':
        value = addCommas(Math.round(cents / 100));
        break;
      case 'amount_with_comma_separator':
        value = (cents / 100).toFixed(2).replace(/\./, ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = addCommas(Math.round(cents / 100)).replace(/,/g, '.');
        break;
      default:
        value = addCommas((cents / 100).toFixed(2));
    }
    return formatString.replace(placeholderRegex, value);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ------------------------------------------------------------------ */
  /*  Core: QuantityDiscount                                             */
  /* ------------------------------------------------------------------ */

  function QuantityDiscount(sectionEl) {
    this.section = sectionEl;
    this.sectionId = sectionEl.dataset.sectionId;
    this.productId = sectionEl.dataset.productId;
    this.basePrice = parseInt(sectionEl.dataset.productPrice, 10) || 0;
    this.comparePrice = parseInt(sectionEl.dataset.productComparePrice, 10) || 0;
    this.moneyFormat = sectionEl.dataset.moneyFormat || '${{amount}}';

    var configEl = document.getElementById('qty-discount-config-' + this.sectionId);
    if (!configEl) return;

    try {
      this.config = JSON.parse(configEl.textContent);
    } catch (e) {
      console.error('[QtyDiscount] Failed to parse config:', e);
      return;
    }

    if (!this.config.enabled || !this.config.tiers || this.config.tiers.length === 0) return;

    // Sort tiers by min_qty ascending
    this.config.tiers.sort(function (a, b) { return a.min_qty - b.min_qty; });

    this.init();
  }

  QuantityDiscount.prototype.init = function () {
    this.render();
    this.bindEvents();
    this.section.style.display = '';
  };

  /* ------------------------------------------------------------------ */
  /*  Price Calculation                                                  */
  /* ------------------------------------------------------------------ */

  QuantityDiscount.prototype.getDiscountedPrice = function (tier) {
    var base = this.basePrice; // in cents
    switch (this.config.discount_type) {
      case 'percentage':
        return Math.round(base * (1 - tier.discount_value / 100));
      case 'fixed_amount':
        return Math.max(0, base - tier.discount_value * 100);
      case 'fixed_price':
        return tier.discount_value * 100;
      default:
        return base;
    }
  };

  QuantityDiscount.prototype.getSavingsPerUnit = function (tier) {
    return this.basePrice - this.getDiscountedPrice(tier);
  };

  QuantityDiscount.prototype.getDiscountLabel = function (tier) {
    switch (this.config.discount_type) {
      case 'percentage':
        return tier.discount_value + '% off';
      case 'fixed_amount':
        return formatMoney(tier.discount_value * 100, this.moneyFormat) + ' off each';
      case 'fixed_price':
        return formatMoney(tier.discount_value * 100, this.moneyFormat) + ' each';
      default:
        return '';
    }
  };

  QuantityDiscount.prototype.getTierForQty = function (qty) {
    var matched = null;
    for (var i = 0; i < this.config.tiers.length; i++) {
      var tier = this.config.tiers[i];
      var maxQty = tier.max_qty || Infinity;
      if (qty >= tier.min_qty && qty <= maxQty) {
        matched = tier;
      }
    }
    return matched;
  };

  QuantityDiscount.prototype.getBestTier = function () {
    var best = null;
    var bestSavings = 0;
    for (var i = 0; i < this.config.tiers.length; i++) {
      var savings = this.getSavingsPerUnit(this.config.tiers[i]);
      if (savings > bestSavings) {
        bestSavings = savings;
        best = this.config.tiers[i];
      }
    }
    return best;
  };

  /* ------------------------------------------------------------------ */
  /*  Rendering                                                          */
  /* ------------------------------------------------------------------ */

  QuantityDiscount.prototype.render = function () {
    var container = document.createElement('div');
    container.className = 'qd-container';
    container.id = 'qd-container-' + this.sectionId;
    container.setAttribute('style', '--qd-accent:' + (this.config.accent_color || '#4a6cf7'));

    // Header
    var header = '<div class="qd-header">';
    if (this.config.title) {
      header += '<h3 class="qd-title">' + escapeHtml(this.config.title) + '</h3>';
    }
    if (this.config.subtitle) {
      header += '<p class="qd-subtitle">' + escapeHtml(this.config.subtitle) + '</p>';
    }
    header += '</div>';
    container.innerHTML = header;

    // Tiers
    var tiersHtml = '';
    var bestTier = this.config.highlight_best ? this.getBestTier() : null;

    switch (this.config.table_style) {
      case 'table':
        tiersHtml = this.renderTable(bestTier);
        break;
      case 'pills':
        tiersHtml = this.renderPills(bestTier);
        break;
      case 'cards':
      default:
        tiersHtml = this.renderCards(bestTier);
        break;
    }

    container.innerHTML += tiersHtml;

    // Live summary
    container.innerHTML += '<div class="qd-live-summary" id="qd-summary-' + this.sectionId + '"></div>';

    // Insert into the page — find the product form or append after the section element
    var target = this.findInsertionPoint();
    if (target) {
      target.parentNode.insertBefore(container, target);
    } else {
      this.section.parentNode.insertBefore(container, this.section.nextSibling);
    }

    this.containerEl = container;
  };

  QuantityDiscount.prototype.renderCards = function (bestTier) {
    var html = '<div class="qd-cards">';
    for (var i = 0; i < this.config.tiers.length; i++) {
      var tier = this.config.tiers[i];
      var discounted = this.getDiscountedPrice(tier);
      var isBest = bestTier && tier.min_qty === bestTier.min_qty;
      var badge = tier.badge || (isBest ? (this.config.badge_text || 'SAVE') : '');
      var label = tier.label || this.getTierLabel(tier);
      var savings = this.getSavingsPerUnit(tier);

      html += '<div class="qd-card' + (isBest ? ' qd-card--best' : '') + '" data-tier-index="' + i + '">';
      if (badge) {
        html += '<span class="qd-card-badge">' + escapeHtml(badge) + '</span>';
      }
      html += '<div class="qd-card-qty">' + escapeHtml(label) + '</div>';
      html += '<div class="qd-card-price">' + formatMoney(discounted, this.moneyFormat) + '<span class="qd-card-each"> each</span></div>';
      html += '<div class="qd-card-discount">' + this.getDiscountLabel(tier) + '</div>';
      if (this.config.show_savings && savings > 0) {
        html += '<div class="qd-card-savings">Save ' + formatMoney(savings, this.moneyFormat) + ' per item</div>';
      }
      html += '</div>';
    }
    html += '</div>';
    return html;
  };

  QuantityDiscount.prototype.renderTable = function (bestTier) {
    var html = '<table class="qd-table"><thead><tr>';
    html += '<th>Quantity</th><th>Price Each</th><th>Discount</th>';
    if (this.config.show_savings) html += '<th>You Save</th>';
    html += '</tr></thead><tbody>';

    for (var i = 0; i < this.config.tiers.length; i++) {
      var tier = this.config.tiers[i];
      var discounted = this.getDiscountedPrice(tier);
      var isBest = bestTier && tier.min_qty === bestTier.min_qty;
      var savings = this.getSavingsPerUnit(tier);

      html += '<tr class="' + (isBest ? 'qd-row--best' : '') + '" data-tier-index="' + i + '">';
      html += '<td>' + this.getTierLabel(tier) + '</td>';
      html += '<td>' + formatMoney(discounted, this.moneyFormat) + '</td>';
      html += '<td>' + this.getDiscountLabel(tier) + '</td>';
      if (this.config.show_savings) {
        html += '<td>' + (savings > 0 ? formatMoney(savings, this.moneyFormat) : '-') + '</td>';
      }
      html += '</tr>';
    }

    html += '</tbody></table>';
    return html;
  };

  QuantityDiscount.prototype.renderPills = function (bestTier) {
    var html = '<div class="qd-pills">';
    for (var i = 0; i < this.config.tiers.length; i++) {
      var tier = this.config.tiers[i];
      var discounted = this.getDiscountedPrice(tier);
      var isBest = bestTier && tier.min_qty === bestTier.min_qty;

      html += '<button type="button" class="qd-pill' + (isBest ? ' qd-pill--best' : '') + '" data-tier-index="' + i + '" data-qty="' + tier.min_qty + '">';
      html += '<span class="qd-pill-qty">' + tier.min_qty + '+</span>';
      html += '<span class="qd-pill-price">' + formatMoney(discounted, this.moneyFormat) + '</span>';
      html += '<span class="qd-pill-discount">' + this.getDiscountLabel(tier) + '</span>';
      html += '</button>';
    }
    html += '</div>';
    return html;
  };

  QuantityDiscount.prototype.getTierLabel = function (tier) {
    if (tier.label) return tier.label;
    if (tier.max_qty && tier.max_qty > 0) {
      return tier.min_qty + ' - ' + tier.max_qty;
    }
    return tier.min_qty + '+';
  };

  QuantityDiscount.prototype.findInsertionPoint = function () {
    // Try to find quantity input or add-to-cart button
    var selectors = [
      'form[action*="/cart/add"] [name="quantity"]',
      'form[action*="/cart/add"] button[type="submit"]',
      'form[action*="/cart/add"]',
      '.product-form__quantity',
      '.quantity-selector',
      '#quantity',
      '.product-form'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el) {
        // Walk up to find a reasonable parent block
        var parent = el.closest('.product-form__quantity, .quantity-selector, .product-form__buttons, .product-form__input') || el;
        return parent;
      }
    }
    return null;
  };

  /* ------------------------------------------------------------------ */
  /*  Event Binding                                                      */
  /* ------------------------------------------------------------------ */

  QuantityDiscount.prototype.bindEvents = function () {
    var self = this;

    // Listen for quantity input changes
    this.qtyInput = document.querySelector(
      'form[action*="/cart/add"] [name="quantity"], #quantity, .quantity__input, input[name="quantity"]'
    );

    if (this.qtyInput) {
      this.qtyInput.addEventListener('change', function () { self.onQtyChange(); });
      this.qtyInput.addEventListener('input', function () { self.onQtyChange(); });
    }

    // Pill click to set quantity
    if (this.config.table_style === 'pills') {
      var pills = this.containerEl.querySelectorAll('.qd-pill');
      for (var i = 0; i < pills.length; i++) {
        pills[i].addEventListener('click', function () {
          var qty = parseInt(this.dataset.qty, 10);
          if (self.qtyInput && qty) {
            self.qtyInput.value = qty;
            self.qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
          self.onQtyChange();
        });
      }
    }

    // Card click to set quantity
    var cards = this.containerEl.querySelectorAll('.qd-card');
    for (var j = 0; j < cards.length; j++) {
      cards[j].addEventListener('click', function () {
        var idx = parseInt(this.dataset.tierIndex, 10);
        var tier = self.config.tiers[idx];
        if (self.qtyInput && tier) {
          self.qtyInput.value = tier.min_qty;
          self.qtyInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        self.onQtyChange();
      });
    }

    // Listen for variant changes (Shopify themes emit this event)
    document.addEventListener('variant:changed', function (e) {
      if (e.detail && e.detail.variant) {
        self.basePrice = e.detail.variant.price;
        self.comparePrice = e.detail.variant.compare_at_price || 0;
        self.rerender();
      }
    });

    // Also listen on shopify section events
    document.addEventListener('shopify:section:load', function () {
      self.rerender();
    });

    // Intercept add-to-cart form submission to inject line item properties
    if (this.config.apply_to_cart) {
      this.interceptCartForm();
    }

    // Initial summary update
    this.onQtyChange();
  };

  QuantityDiscount.prototype.onQtyChange = function () {
    var qty = this.qtyInput ? parseInt(this.qtyInput.value, 10) || 1 : 1;
    var tier = this.getTierForQty(qty);
    var summaryEl = document.getElementById('qd-summary-' + this.sectionId);

    // Highlight active tier
    this.highlightActiveTier(tier);

    if (!summaryEl) return;

    if (!tier) {
      if (qty < this.config.tiers[0].min_qty) {
        var nextTier = this.config.tiers[0];
        var needed = nextTier.min_qty - qty;
        summaryEl.innerHTML =
          '<div class="qd-summary-nudge">Add <strong>' + needed + ' more</strong> to unlock <strong>' +
          this.getDiscountLabel(nextTier) + '</strong></div>';
        summaryEl.className = 'qd-live-summary qd-live-summary--nudge';
      } else {
        summaryEl.innerHTML = '';
        summaryEl.className = 'qd-live-summary';
      }
      return;
    }

    var discounted = this.getDiscountedPrice(tier);
    var totalSavings = (this.basePrice - discounted) * qty;

    var html = '<div class="qd-summary-active">';
    html += '<span class="qd-summary-price">' + formatMoney(discounted, this.moneyFormat) + ' each</span>';
    if (this.config.show_savings && totalSavings > 0) {
      html += '<span class="qd-summary-total-savings">You save ' + formatMoney(totalSavings, this.moneyFormat) + ' total</span>';
    }
    html += '</div>';

    summaryEl.innerHTML = html;
    summaryEl.className = 'qd-live-summary qd-live-summary--active';

    // Update displayed price on the page
    this.updateDisplayedPrice(discounted);
  };

  QuantityDiscount.prototype.highlightActiveTier = function (activeTier) {
    if (!this.containerEl) return;

    // Cards
    var cards = this.containerEl.querySelectorAll('.qd-card');
    for (var i = 0; i < cards.length; i++) {
      var idx = parseInt(cards[i].dataset.tierIndex, 10);
      var tier = this.config.tiers[idx];
      if (activeTier && tier.min_qty === activeTier.min_qty) {
        cards[i].classList.add('qd-card--active');
      } else {
        cards[i].classList.remove('qd-card--active');
      }
    }

    // Table rows
    var rows = this.containerEl.querySelectorAll('tr[data-tier-index]');
    for (var j = 0; j < rows.length; j++) {
      var ridx = parseInt(rows[j].dataset.tierIndex, 10);
      var rtier = this.config.tiers[ridx];
      if (activeTier && rtier.min_qty === activeTier.min_qty) {
        rows[j].classList.add('qd-row--active');
      } else {
        rows[j].classList.remove('qd-row--active');
      }
    }

    // Pills
    var pills = this.containerEl.querySelectorAll('.qd-pill');
    for (var k = 0; k < pills.length; k++) {
      var pidx = parseInt(pills[k].dataset.tierIndex, 10);
      var ptier = this.config.tiers[pidx];
      if (activeTier && ptier.min_qty === activeTier.min_qty) {
        pills[k].classList.add('qd-pill--active');
      } else {
        pills[k].classList.remove('qd-pill--active');
      }
    }
  };

  QuantityDiscount.prototype.updateDisplayedPrice = function (newPriceCents) {
    // Try to update the main product price display
    var priceSelectors = [
      '.product__price .price-item--regular',
      '.product-price .money',
      '.product-single__price',
      '.price--regular .price-item',
      '.price .money',
      '[data-product-price]'
    ];

    for (var i = 0; i < priceSelectors.length; i++) {
      var priceEl = document.querySelector(priceSelectors[i]);
      if (priceEl) {
        priceEl.textContent = formatMoney(newPriceCents, this.moneyFormat);
        break;
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Cart Integration                                                   */
  /* ------------------------------------------------------------------ */

  QuantityDiscount.prototype.interceptCartForm = function () {
    var self = this;
    var form = document.querySelector('form[action*="/cart/add"]');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      var qty = self.qtyInput ? parseInt(self.qtyInput.value, 10) || 1 : 1;
      var tier = self.getTierForQty(qty);

      if (!tier) return; // No discount applies, let form submit normally

      var discounted = self.getDiscountedPrice(tier);
      var discountLabel = self.getDiscountLabel(tier);

      // Remove any existing discount properties
      var existing = form.querySelectorAll('input[name^="properties[_qty_discount"]');
      for (var i = 0; i < existing.length; i++) {
        existing[i].remove();
      }

      // Add line item properties for the discount
      var props = [
        { name: 'properties[_qty_discount]', value: discountLabel },
        { name: 'properties[_qty_discount_price]', value: (discounted / 100).toFixed(2) },
        { name: 'properties[_qty_discount_type]', value: self.config.discount_type },
        { name: 'properties[_qty_discount_value]', value: tier.discount_value }
      ];

      props.forEach(function (prop) {
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = prop.name;
        input.value = prop.value;
        form.appendChild(input);
      });
    });
  };

  QuantityDiscount.prototype.rerender = function () {
    if (this.containerEl) {
      this.containerEl.remove();
    }
    this.render();
    this.bindEvents();
  };

  /* ------------------------------------------------------------------ */
  /*  Initialization                                                     */
  /* ------------------------------------------------------------------ */

  function initAll() {
    var sections = document.querySelectorAll('#qty-discount-section, [id^="qty-discount-section"]');
    sections.forEach(function (sectionEl) {
      new QuantityDiscount(sectionEl);
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Re-initialize on Shopify section events (theme editor)
  document.addEventListener('shopify:section:load', function (e) {
    var section = e.target.querySelector('#qty-discount-section, [id^="qty-discount-section"]');
    if (section) {
      new QuantityDiscount(section);
    }
  });

  // Expose globally for custom integrations
  window.QuantityDiscount = QuantityDiscount;

})();
