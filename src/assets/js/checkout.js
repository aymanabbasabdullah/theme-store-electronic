// ضبط سنة الفوتر
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// فورمات السعر بالريال اليمني
function formatPriceYER(amount) {
  const n = Number(amount || 0);
  try {
    return n.toLocaleString("ar-EG") + " ريال يمني";
  } catch (e) {
    return n.toFixed(0) + " ريال يمني";
  }
}

let checkoutAppliedCoupon = null; // مثال: YEMEN10 = خصم 10%

function getSelectedShippingCost() {
  const selected = document.querySelector(
    'input[name="shippingMethod"]:checked'
  );
  if (!selected) return 0;
  switch (selected.value) {
    case "sanaa":
      return 1000;
    case "governorates":
      return 2500;
    case "pickup":
      return 0;
    default:
      return 0;
  }
}

function getCartData() {
  // محاولة استخدام Cart.getCart من cart.js
  if (window.Cart && typeof Cart.getCart === "function") {
    return Cart.getCart();
  }
  // فallback بسيط (لو ما كان في Cart)
  try {
    const raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : { items: [] };
  } catch {
    return { items: [] };
  }
}

function updateOrderSummary() {
  const itemsContainer = document.getElementById("order-summary-items");
  const subtotalEl = document.getElementById("order-summary-subtotal");
  const shippingEl = document.getElementById("order-summary-shipping");
  const discountEl = document.getElementById("order-summary-discount");
  const totalEl = document.getElementById("order-summary-total");

  if (!itemsContainer || !subtotalEl || !shippingEl || !discountEl || !totalEl)
    return;

  const cart = getCartData();
  const items = cart.items || [];

  itemsContainer.innerHTML = "";

  if (items.length === 0) {
    itemsContainer.innerHTML =
      '<p class="text-xs text-gray-500">السلة فارغة حالياً. يمكنك العودة للسلة وإضافة منتجات.</p>';
    subtotalEl.textContent = formatPriceYER(0);
    shippingEl.textContent = formatPriceYER(0);
    discountEl.textContent = formatPriceYER(0);
    totalEl.textContent = formatPriceYER(0);
    return;
  }

  let subtotal = 0;

  items.forEach((item) => {
    const qty = item.qty || item.quantity || 1;
    const price = item.price || 0;
    const lineTotal = price * qty;
    subtotal += lineTotal;

    const wrapper = document.createElement("div");
    wrapper.className =
      "flex gap-3 border-b border-gray-100 pb-3 last:border-b-0";

    wrapper.innerHTML = `
          <div class="w-16 h-20 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
            ${
              item.image
                ? `<img src="${item.image}" alt="${
                    item.name || ""
                  }" class="w-full h-full object-cover" />`
                : `<div class="w-full h-full bg-gradient-to-br from-gray-200 to-gray-100"></div>`
            }
          </div>
          <div class="flex-1">
            <div class="flex justify-between gap-2 mb-1">
              <p class="text-sm font-medium line-clamp-2">${
                item.name || "منتج"
              }</p>
              <span class="text-xs text-gray-500">×${qty}</span>
            </div>
            <p class="text-xs text-gray-500 mb-1">
              ${item.size ? `المقاس: ${item.size}` : ""}${
      item.size && item.color ? " · " : ""
    }${item.color ? `اللون: ${item.color}` : ""}
            </p>
            <p class="text-sm font-semibold">
              ${formatPriceYER(lineTotal)}
            </p>
          </div>
        `;

    itemsContainer.appendChild(wrapper);
  });

  const shipping = getSelectedShippingCost();

  let discount = 0;
  if (checkoutAppliedCoupon === "YEMEN10") {
    discount = subtotal * 0.1;
  }

  const total = subtotal + shipping - discount;

  subtotalEl.textContent = formatPriceYER(subtotal);
  shippingEl.textContent = formatPriceYER(shipping);
  discountEl.textContent = formatPriceYER(discount);
  totalEl.textContent = formatPriceYER(total);
}

// كوبون الخصم
(function initCheckoutCoupon() {
  const couponInput = document.getElementById("checkout-coupon");
  const couponBtn = document.getElementById("apply-coupon-button");
  const msgEl = document.getElementById("checkout-coupon-message");

  if (!couponInput || !couponBtn) return;

  couponBtn.addEventListener("click", () => {
    const code = (couponInput.value || "").trim().toUpperCase();
    if (!code) {
      checkoutAppliedCoupon = null;
      if (msgEl) {
        msgEl.textContent = "لم تقم بإدخال كوبون.";
        msgEl.classList.remove("text-emerald-600");
        msgEl.classList.add("text-red-500");
      }
      updateOrderSummary();
      return;
    }

    const cart = getCartData();
    const items = cart.items || [];
    const subtotal = items.reduce(
      (sum, it) => sum + (it.price || 0) * (it.qty || it.quantity || 1),
      0
    );
    if (subtotal <= 0) {
      if (msgEl) {
        msgEl.textContent = "لا يمكن تطبيق كوبون على سلة فارغة.";
        msgEl.classList.remove("text-emerald-600");
        msgEl.classList.add("text-red-500");
      }
      return;
    }

    if (code === "YEMEN10") {
      checkoutAppliedCoupon = "YEMEN10";
      if (msgEl) {
        msgEl.textContent = "تم تطبيق كوبون الخصم بنجاح (خصم 10٪).";
        msgEl.classList.remove("text-red-500");
        msgEl.classList.add("text-emerald-600");
      }
      updateOrderSummary();
    } else {
      checkoutAppliedCoupon = null;
      if (msgEl) {
        msgEl.textContent = "هذا الكوبون غير صالح.";
        msgEl.classList.remove("text-emerald-600");
        msgEl.classList.add("text-red-500");
      }
      updateOrderSummary();
    }
  });
})();

// تحديث الملخص عند تغيير الشحن
const shippingRadios = document.querySelectorAll(
  'input[name="shippingMethod"]'
);

shippingRadios.forEach((radio) => {
  radio.addEventListener("change", updateOrderSummary);
});

// إعداد تفاصيل المحافظ
const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
const walletTitle = document.getElementById("wallet-details-title");
const walletDesc = document.getElementById("wallet-details-description");
const walletNumberEl = document.getElementById("wallet-wallet-number");
const walletSection = document.getElementById("wallet-details-section");

const walletConfig = {
  kuraimi: {
    title: "تفاصيل الدفع عبر كريمي جوال",
    number: "777000000",
    description:
      "قم بتحويل إجمالي قيمة الطلب إلى محفظة كريمي جوال على الرقم التالي ثم أدخل بيانات التحويل:",
  },
  jeb: {
    title: "تفاصيل الدفع عبر جيب",
    number: "733000000",
    description:
      "قم بالدفع من محفظة جيب إلى رقم المحفظة التالي ثم أدخل بيانات التحويل:",
  },
  onecash: {
    title: "تفاصيل الدفع عبر ون كاش",
    number: "734000000",
    description:
      "حول المبلغ من محفظة ون كاش إلى رقم المحفظة التالي ثم أدخل بيانات العملية:",
  },
  falousak: {
    title: "تفاصيل الدفع عبر فلوسك",
    number: "735000000",
    description:
      "قم بتحويل المبلغ من محفظة فلوسك إلى الرقم التالي ثم أدخل بيانات التحويل:",
  },
  jawali: {
    title: "تفاصيل الدفع عبر جوالي",
    number: "736000000",
    description:
      "حول المبلغ من محفظة جوالي إلى رقم المحفظة التالي ثم أدخل بيانات التحويل:",
  },
};

function togglePaymentDetails() {
  const selected = document.querySelector(
    'input[name="paymentMethod"]:checked'
  );
  if (!selected || !walletSection) return;

  if (selected.value === "cod") {
    walletSection.classList.add("hidden");
  } else if (walletConfig[selected.value]) {
    const cfg = walletConfig[selected.value];
    walletSection.classList.remove("hidden");
    if (walletTitle) walletTitle.textContent = cfg.title;
    if (walletDesc) {
      walletDesc.firstChild.nodeValue = cfg.description + " ";
    }
    if (walletNumberEl) walletNumberEl.textContent = cfg.number;
  } else {
    walletSection.classList.add("hidden");
  }
}

paymentRadios.forEach((radio) => {
  radio.addEventListener("change", togglePaymentDetails);
});

// تهيئة أولية
togglePaymentDetails();
updateOrderSummary();

// Handle checkout submit
// function handleCheckoutSubmit(event) {
//   event.preventDefault();

//   const form = event.target;
//   if (!form.checkValidity()) {
//     if (window.showToast) {
//       window.showToast(
//         "يرجى التأكد من تعبئة جميع البيانات المطلوبة بشكل صحيح.",
//         "error"
//       );
//     } else {
//       alert("يرجى التأكد من تعبئة جميع البيانات المطلوبة بشكل صحيح.");
//     }
//     return;
//   }

//   if (!document.getElementById("agree-terms").checked) {
//     if (window.showToast) {
//       window.showToast("يرجى الموافقة على الشروط قبل تأكيد الطلب.", "error");
//     } else {
//       alert("يرجى الموافقة على الشروط قبل تأكيد الطلب.");
//     }
//     return;
//   }

//   // لو عندك دالة موجودة في main.js لإرسال الطلب للباك إند
//   if (window.submitCheckoutForm) {
//     window.submitCheckoutForm(event);
//     return;
//   }

//   const orderId = "2025-" + Math.floor(Math.random() * 9000 + 1000);

//   localStorage.setItem("lastOrderId", orderId);

//   if (window.Cart) Cart.clearCart();

//   // ممكن بعد النجاح تنظف السلة أو تعمل إعادة توجيه:
//   window.location.href = "/src/pages/order-success.html";
// }
// // جعلها متاحة للـ onsubmit في الـ HTML
// window.handleCheckoutSubmit = handleCheckoutSubmit;

// Handle checkout submit
// function handleCheckoutSubmit(event) {
//   event.preventDefault();

//   const form = event.target;

//   // ✅ التحقق من صحة الحقول المطلوبة
//   if (!form.checkValidity()) {
//     if (window.showToast) {
//       window.showToast(
//         "يرجى التأكد من تعبئة جميع البيانات المطلوبة بشكل صحيح.",
//         "error"
//       );
//     } else {
//       alert("يرجى التأكد من تعبئة جميع البيانات المطلوبة بشكل صحيح.");
//     }
//     return;
//   }

//   // ✅ التحقق من الموافقة على الشروط
//   const agreeTerms = document.getElementById("agree-terms");
//   if (!agreeTerms || !agreeTerms.checked) {
//     if (window.showToast) {
//       window.showToast("يرجى الموافقة على الشروط قبل تأكيد الطلب.", "error");
//     } else {
//       alert("يرجى الموافقة على الشروط قبل تأكيد الطلب.");
//     }
//     return;
//   }

//   // ✅ جلب بيانات السلة
//   const cart = getCartData();
//   const items = cart.items || [];
//   if (!items.length) {
//     if (window.showToast) {
//       window.showToast(
//         "سلة التسوق فارغة، أضف منتجات قبل إتمام الطلب.",
//         "error"
//       );
//     } else {
//       alert("سلة التسوق فارغة، أضف منتجات قبل إتمام الطلب.");
//     }
//     return;
//   }

//   // 🧾 قراءة بيانات النموذج
//   const fullName = document.getElementById("full-name").value.trim();
//   const phone = document.getElementById("phone").value.trim();
//   const emailEl = document.getElementById("email");
//   const email = emailEl ? emailEl.value.trim() : "";

//   const city = document.getElementById("city").value.trim();
//   const districtEl = document.getElementById("district");
//   const district = districtEl ? districtEl.value.trim() : "";
//   const street = document.getElementById("street").value.trim();

//   const notesEl = document.getElementById("order-notes");
//   const orderNotes = notesEl ? notesEl.value.trim() : "";

//   const shippingRadio = document.querySelector(
//     'input[name="shippingMethod"]:checked'
//   );
//   const shippingMethod = shippingRadio ? shippingRadio.value : null;

//   const paymentRadio = document.querySelector(
//     'input[name="paymentMethod"]:checked'
//   );
//   const paymentMethod = paymentRadio ? paymentRadio.value : null;

//   const walletFromPhoneEl = document.getElementById("wallet-from-phone");
//   const walletTxIdEl = document.getElementById("wallet-tx-id");

//   const walletFromPhone = walletFromPhoneEl
//     ? walletFromPhoneEl.value.trim()
//     : "";
//   const walletTxId = walletTxIdEl ? walletTxIdEl.value.trim() : "";

//   //   حساب الإجماليات
//   let subtotal = 0;
//   items.forEach((item) => {
//     const qty = item.qty || item.quantity || 1;
//     const price = item.price || 0;
//     subtotal += price * qty;
//   });

//   const shipping = getSelectedShippingCost();

//   let discount = 0;
//   if (checkoutAppliedCoupon === "YEMEN10") {
//     discount = subtotal * 0.1;
//   }

//   const total = subtotal + shipping - discount;

//   // 🆔 إنشاء رقم الطلب
//   const orderId = "2025-" + Math.floor(Math.random() * 9000 + 1000);

//   // 🧩 تجهيز بيانات الطلب
//   const orderData = {
//     id: orderId,
//     status: "قيد المعالجة",
//     date: new Date().toISOString(),
//     customer: {
//       name: fullName,
//       phone,
//       email: email || null,
//     },
//     address: {
//       city,
//       district: district || null,
//       street,
//     },
//     shipping: {
//       method: shippingMethod,
//       cost: shipping,
//     },
//     payment: {
//       method: paymentMethod,
//       txId: walletTxId || null,
//       fromPhone: walletFromPhone || null,
//     },
//     notes: orderNotes || null,
//     items,
//     totals: {
//       subtotal,
//       shipping,
//       discount,
//       total,
//     },
//   };
//   console.log("checkout submitted");

//   // 💾 تخزين في localStorage
//   localStorage.setItem("lastOrderData", JSON.stringify(orderData));
//   localStorage.setItem("lastOrderId", orderId);

//   // // 🧹 تنظيف السلة
//   // if (window.Cart && typeof Cart.clearCart === "function") {
//   //   Cart.clearCart();
//   // }

//   // 🔁 التحويل لصفحة نجاح الطلب
//   window.location.href = "/src/pages/order-success.html";
// }

// جعلها متاحة للـ onsubmit في الـ HTML
// window.handleCheckoutSubmit = handleCheckoutSubmit;
// Handle checkout submit
function handleCheckoutSubmit(event) {
  event.preventDefault();

  const form = event.target;
  if (!form.checkValidity()) {
    if (window.showToast) {
      window.showToast(
        "يرجى التأكد من تعبئة جميع البيانات المطلوبة بشكل صحيح.",
        "error"
      );
    } else {
      alert("يرجى التأكد من تعبئة جميع البيانات المطلوبة بشكل صحيح.");
    }
    return;
  }

  if (!document.getElementById("agree-terms").checked) {
    if (window.showToast) {
      window.showToast("يرجى الموافقة على الشروط قبل تأكيد الطلب.", "error");
    } else {
      alert("يرجى الموافقة على الشروط قبل تأكيد الطلب.");
    }
    return;
  }

  // لو عندك دالة موجودة في main.js لإرسال الطلب للباك إند
  if (window.submitCheckoutForm) {
    window.submitCheckoutForm(event);
    return;
  }

  // ============= نجمع بيانات الفورم =============
  const fullName = document.getElementById("full-name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const email = document.getElementById("email").value.trim();

  const city = document.getElementById("city").value.trim();
  const district = document.getElementById("district").value.trim();
  const street = document.getElementById("street").value.trim();

  const paymentInput = document.querySelector(
    'input[name="paymentMethod"]:checked'
  );
  const selectedPaymentMethod = paymentInput ? paymentInput.value : null;

  const walletFromPhone = document
    .getElementById("wallet-from-phone")
    .value.trim();
  const walletTxId = document.getElementById("wallet-tx-id").value.trim();

  // بيانات السلة (من cart.js أو localStorage)
  const cart = getCartData();
  const items = cart.items || [];

  // نحسب الإجماليات (نفس المنطق في updateOrderSummary)
  let subtotal = 0;
  items.forEach((item) => {
    const qty = item.qty || item.quantity || 1;
    const price = item.price || 0;
    subtotal += price * qty;
  });

  const shipping = getSelectedShippingCost();
  let discount = 0;
  if (checkoutAppliedCoupon === "YEMEN10") {
    discount = subtotal * 0.1;
  }
  const total = subtotal + shipping - discount;

  // ============= نبني كائن الطلب =============
  const orderId = "2025-" + Math.floor(Math.random() * 9000 + 1000);

  const orderData = {
    id: orderId,
    customer: {
      name: fullName,
      phone,
      email,
    },
    address: {
      city,
      district,
      street,
    },
    payment: {
      method: selectedPaymentMethod,
      txId: walletTxId || null,
      fromPhone: walletFromPhone || null,
    },
    items,
    totals: {
      subtotal,
      shipping,
      discount,
      total,
    },
    date: new Date().toISOString(),
    status: "قيد المعالجة",
  };

  // نخزّن آخر طلب + قائمة الطلبات
  localStorage.setItem("lastOrderData", JSON.stringify(orderData));
  localStorage.setItem("lastOrderId", orderId);

  const existingOrdersRaw = localStorage.getItem("orders");
  const existingOrders = existingOrdersRaw ? JSON.parse(existingOrdersRaw) : [];
  existingOrders.push(orderData);
  localStorage.setItem("orders", JSON.stringify(existingOrders));

  // ننظف السلة
  // if (window.Cart) Cart.clearCart();

  // نوجّه لصفحة النجاح
  window.location.href = "/src/pages/order-success.html";
}

// جعلها متاحة للـ onsubmit في الـ HTML
window.handleCheckoutSubmit = handleCheckoutSubmit;
