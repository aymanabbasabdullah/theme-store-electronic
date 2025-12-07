/* assets/js/cart.js
 * -------------------------------------------------
 * Global cart system using localStorage
 * Key: "ea_cart"
 *
 * - يوفر window.Cart API (addToCart, getCart, ...)
 * - يستمع لأي زر [data-add-to-cart] في جميع الصفحات
 * - يحدّث شارة السلة (#cart-count-badge)
 * - يرسم محتوى السلة في cart.html (عن طريق #cart-items)
 */

(function () {
  const CART_KEY = 'ea_cart';
  const FREE_SHIPPING_THRESHOLD = 300; // حد الشحن المجاني
  const SHIPPING_FEE_BELOW_THRESHOLD = 20; // شحن تقديري تحت الحد

  let appliedCoupon = null; // مثال بسيط لكوبون خصم

  // ---------- Storage helpers ----------

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return { items: [] };
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.items)) return { items: [] };
      return data;
    } catch (e) {
      console.warn('Cart: failed to parse cart from localStorage', e);
      return { items: [] };
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Cart: failed to save cart', e);
    }
  }

  function getItemKey(item) {
    const size = item.size || '';
    const color = item.color || '';
    return `${item.id}__${size}__${color}`;
  }

  function getCartCount() {
    const cart = getCart();
    return cart.items.reduce((sum, it) => sum + (it.qty || 0), 0);
  }

  // ---------- UI helpers ----------

  function syncCartBadge() {
    const count = getCartCount();
    const badges = document.querySelectorAll('#cart-count-badge, .cart-count-badge');
    badges.forEach((badge) => {
      badge.textContent = count;
      // لو حاب تخفي الشارة عند الصفر:
      // if (count <= 0) badge.classList.add('hidden'); else badge.classList.remove('hidden');
    });
  }

  function baseToast(msg) {
    const toast = document.getElementById('toast');
    const msgEl = document.getElementById('toast-message');
    if (!toast || !msgEl) {
      alert(msg);
      return;
    }
    msgEl.textContent = msg;
    toast.classList.remove('hidden');
    toast.classList.add('flex');

    setTimeout(() => {
      toast.classList.add('hidden');
      toast.classList.remove('flex');
    }, 2500);
  }

  function showToast(msg, type = 'success') {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type);
      return;
    }
    baseToast(msg);
  }

  // ---------- Core cart logic ----------

  function addToCart(item) {
    const cart = getCart();
    const key = getItemKey(item);
    const index = cart.items.findIndex((it) => it.key === key);

    if (index !== -1) {
      cart.items[index].qty += item.qty;
    } else {
      cart.items.push({
        key,
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image || '',
        size: item.size || '',
        color: item.color || '',
        qty: item.qty || 1
      });
    }

    saveCart(cart);
    syncCartBadge();
    renderCartPageIfNeeded(); // لو كنا في cart.html يتم التحديث مباشرة
    showToast('تمت إضافة المنتج إلى السلة بنجاح ✔️', 'success');
  }

  function removeFromCart(key) {
    const cart = getCart();
    cart.items = cart.items.filter((it) => it.key !== key);
    saveCart(cart);
    syncCartBadge();
    renderCartPageIfNeeded();
  }

  function updateQty(key, qty) {
    const cart = getCart();
    const item = cart.items.find((it) => it.key === key);
    if (!item) return;
    item.qty = Math.max(1, qty);
    saveCart(cart);
    syncCartBadge();
    renderCartPageIfNeeded();
  }

  function clearCart() {
    saveCart({ items: [] });
    syncCartBadge();
    renderCartPageIfNeeded();
  }

  // ---------- Global add-to-cart buttons (all pages) ----------

  function handleGlobalAddToCartClick(event) {
    const btn = event.target.closest('[data-add-to-cart]');
    if (!btn) return;

    // بيانات من الزر + أقرب كرت منتج
    const card = btn.closest('[data-product], [data-product-card]');

    const id =
      btn.getAttribute('data-product-id') ||
      (card && (card.getAttribute('data-product-id') || card.getAttribute('data-id'))) ||
      'product-' + Date.now();

    let name =
      btn.getAttribute('data-product-name') ||
      (card && card.getAttribute('data-product-name')) ||
      '';

    if (!name && card) {
      const nameEl = card.querySelector('[data-product-name]');
      if (nameEl) name = nameEl.textContent.trim();
    }
    if (!name) name = 'منتج بدون اسم';

    const price =
      parseFloat(
        btn.getAttribute('data-product-price') ||
        (card && card.getAttribute('data-price')) ||
        '0'
      ) || 0;

    let image =
      btn.getAttribute('data-product-image') ||
      (card && card.getAttribute('data-product-image')) ||
      '';
    if (!image && card) {
      const imgEl = card.querySelector('img');
      if (imgEl && imgEl.src) image = imgEl.src;
    }

    const size =
      btn.getAttribute('data-product-size') ||
      (card && (card.getAttribute('data-size-selected') || card.getAttribute('data-size'))) ||
      '';

    const color =
      btn.getAttribute('data-product-color') ||
      (card && (card.getAttribute('data-color-selected') || card.getAttribute('data-color'))) ||
      '';

    const qty =
      parseInt(
        btn.getAttribute('data-product-qty') ||
        btn.getAttribute('data-qty') ||
        '1',
        10
      ) || 1;

    const item = { id, name, price, image, size, color, qty };
    addToCart(item);
  }

  // ---------- Cart page rendering (cart.html) ----------

  function formatPrice(num) {
    const value = Number(num) || 0;
    return `${value.toFixed(0)} ريال`;
  }

  function renderCartPageIfNeeded() {
    const itemsContainer = document.getElementById('cart-items');
    const emptyState = document.getElementById('cart-empty');

    // لو ماوجدنا عناصر cart.html نطلع بهدوء
    if (!itemsContainer || !emptyState) return;

    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const shippingEl = document.getElementById('estimated-shipping');
    const freeMsgEl = document.getElementById('free-shipping-message');
    const freeProgressEl = document.getElementById('free-shipping-progress');
    const couponInput = document.getElementById('coupon');
    const couponMsgEl = document.getElementById('coupon-message');

    const cart = getCart();
    const items = cart.items || [];

    // إفراغ الحاوية قبل إعادة الرسم
    itemsContainer.innerHTML = '';

    if (items.length === 0) {
      emptyState.classList.remove('hidden');
      subtotalEl && (subtotalEl.textContent = formatPrice(0));
      totalEl && (totalEl.textContent = formatPrice(0));
      shippingEl && (shippingEl.textContent = formatPrice(0));
      if (freeMsgEl) {
        freeMsgEl.textContent = `تبقى لك ${FREE_SHIPPING_THRESHOLD} ريال للحصول على شحن مجاني.`;
      }
      if (freeProgressEl) {
        freeProgressEl.style.width = '0%';
      }
      if (couponInput) couponInput.value = '';
      if (couponMsgEl) couponMsgEl.textContent = '';
      appliedCoupon = null;
      return;
    }

    emptyState.classList.add('hidden');

    let subtotal = 0;

    items.forEach((item) => {
      const lineTotal = (item.price || 0) * (item.qty || 1);
      subtotal += lineTotal;

      const wrapper = document.createElement('div');
      wrapper.className = 'flex gap-3 border-b border-gray-100 pb-3 last:border-b-0';
      wrapper.setAttribute('data-cart-item-key', item.key);

      wrapper.innerHTML = `
        <div class="w-16 h-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
          ${
            item.image
              ? `<img src="${item.image}" alt="${item.name || ''}" class="w-full h-full object-cover" />`
              : `<div class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100"></div>`
          }
        </div>
        <div class="flex-1 text-xs">
          <div class="flex justify-between gap-2 mb-1">
            <p class="font-medium line-clamp-2">${item.name || 'منتج'}</p>
            <button
              type="button"
              class="text-[11px] text-red-500 hover:underline"
              data-cart-remove="${item.key}"
            >
              إزالة
            </button>
          </div>
          <p class="text-[11px] text-gray-500 mb-1">
            ${item.size ? `المقاس: ${item.size}` : ''}${item.size && item.color ? ' · ' : ''}${item.color ? `اللون: ${item.color}` : ''}
          </p>
          <div class="flex items-center justify-between mt-1">
            <div class="flex items-baseline gap-1">
              <span class="font-semibold">${formatPrice(item.price || 0)}</span>
              <span class="text-[11px] text-gray-400">× ${item.qty || 1}</span>
              <span class="text-[11px] text-gray-500">= ${formatPrice(lineTotal)}</span>
            </div>
            <div class="flex items-center gap-1">
              <button
                type="button"
                class="w-7 h-7 inline-flex items-center justify-center rounded-full border border-gray-300 text-[13px]"
                data-cart-qty-decrease="${item.key}"
              >-</button>
              <input
                type="number"
                min="1"
                class="w-10 text-center border border-gray-200 rounded-full text-[11px] py-1"
                value="${item.qty || 1}"
                data-cart-qty-input="${item.key}"
              />
              <button
                type="button"
                class="w-7 h-7 inline-flex items-center justify-center rounded-full border border-gray-300 text-[13px]"
                data-cart-qty-increase="${item.key}"
              >+</button>
            </div>
          </div>
        </div>
      `;

      itemsContainer.appendChild(wrapper);
    });

    // ----- Summary & shipping & coupon -----

    // Subtotal
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);

    // Shipping
    let shipping = 0;
    if (subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD) {
      shipping = SHIPPING_FEE_BELOW_THRESHOLD;
    } else {
      shipping = 0;
    }
    if (shippingEl) shippingEl.textContent = formatPrice(shipping);

    // Free shipping message + progress
    if (freeMsgEl && freeProgressEl) {
      if (subtotal >= FREE_SHIPPING_THRESHOLD) {
        freeMsgEl.textContent = 'تهانينا! حصلت على شحن مجاني.';
        freeProgressEl.style.width = '100%';
      } else {
        const diff = FREE_SHIPPING_THRESHOLD - subtotal;
        freeMsgEl.textContent = `تبقى لك ${diff.toFixed(0)} ريال للحصول على شحن مجاني.`;
        const progress = Math.max(0, Math.min(1, subtotal / FREE_SHIPPING_THRESHOLD));
        freeProgressEl.style.width = `${progress * 100}%`;
      }
    }

    // Coupon (مثال: SALE10 = 10% خصم)
    let discount = 0;
    if (appliedCoupon === 'SALE10') {
      discount = subtotal * 0.1;
      if (couponMsgEl) {
        couponMsgEl.textContent = 'تم تطبيق خصم 10٪ على سلة التسوق.';
        couponMsgEl.classList.remove('text-red-500');
        couponMsgEl.classList.add('text-green-600');
      }
    }

    const total = subtotal + shipping - discount;
    if (totalEl) totalEl.textContent = formatPrice(total);
  }

  function initCartPageEventsIfNeeded() {
    const itemsContainer = document.getElementById('cart-items');
    const applyCouponBtn = document.getElementById('apply-coupon-btn');
    const couponInput = document.getElementById('coupon');
    const couponMsgEl = document.getElementById('coupon-message');

    if (!itemsContainer) return; // لسنا في صفحة cart.html

    // أحداث التحكم بالكمية والإزالة (event delegation)
    itemsContainer.addEventListener('click', (e) => {
      const decBtn = e.target.closest('[data-cart-qty-decrease]');
      const incBtn = e.target.closest('[data-cart-qty-increase]');
      const removeBtn = e.target.closest('[data-cart-remove]');

      if (decBtn) {
        const key = decBtn.getAttribute('data-cart-qty-decrease');
        const input = itemsContainer.querySelector(`[data-cart-qty-input="${key}"]`);
        if (!input) return;
        let val = parseInt(input.value || '1', 10);
        if (isNaN(val) || val <= 1) val = 1;
        else val -= 1;
        input.value = val;
        updateQty(key, val);
      }

      if (incBtn) {
        const key = incBtn.getAttribute('data-cart-qty-increase');
        const input = itemsContainer.querySelector(`[data-cart-qty-input="${key}"]`);
        if (!input) return;
        let val = parseInt(input.value || '1', 10);
        if (isNaN(val) || val < 1) val = 1;
        else val += 1;
        input.value = val;
        updateQty(key, val);
      }

      if (removeBtn) {
        const key = removeBtn.getAttribute('data-cart-remove');
        removeFromCart(key);
      }
    });

    // تغيير الكمية من input مباشرة
    itemsContainer.addEventListener('change', (e) => {
      const input = e.target.closest('input[data-cart-qty-input]');
      if (!input) return;
      const key = input.getAttribute('data-cart-qty-input');
      let val = parseInt(input.value || '1', 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 99) val = 99;
      input.value = val;
      updateQty(key, val);
    });

  
    

    // أول رسم للسلة
    renderCartPageIfNeeded();
  }

  // ---------- Public API ----------

  const CartAPI = {
    getCart,
    saveCart,
    addToCart,
    addItem: addToCart, // alias
    removeFromCart,
    updateQty,
    clearCart,
    getCartCount,
    syncCartBadge,
    renderCartPage: renderCartPageIfNeeded
  };

  window.Cart = CartAPI;

  // ---------- Init (جميع الصفحات) ----------

  document.addEventListener('DOMContentLoaded', () => {
    syncCartBadge();
    document.addEventListener('click', handleGlobalAddToCartClick);
    initCartPageEventsIfNeeded(); // لو نحن في cart.html سيتفعّل
  });
})();
