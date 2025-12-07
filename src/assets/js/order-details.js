function formatPriceYER(amount) {
  const n = Number(amount || 0);
  try {
    return n.toLocaleString("ar-EG") + " ريال يمني";
  } catch (e) {
    return n.toFixed(0) + " ريال يمني";
  }
}

const paymentLabels = {
  kuraimi: "كريمي جوال",
  jeb: "جيب",
  onecash: "ون كاش",
  falousak: "فلوسك",
  jawali: "جوالي",
  cod: "الدفع عند الاستلام",
};

const shippingLabels = {
  sanaa: "توصيل داخل صنعاء",
  governorates: "توصيل إلى باقي المحافظات",
  pickup: "استلام من المعرض",
};

document.addEventListener("DOMContentLoaded", () => {
  const raw = localStorage.getItem("lastOrderData");
  if (!raw) {
    // لو مافي طلب، رجّعه لحسابي أو السلة
    // window.location.href = "/src/pages/account.html";
    return;
  }

  const data = JSON.parse(raw);

  // 🆔 رقم الطلب + التاريخ + الحالة
  const idEl = document.getElementById("details-order-id");
  if (idEl) idEl.textContent = "#" + data.id;

  const dateEl = document.getElementById("details-order-date");
  if (dateEl && data.date) {
    const d = new Date(data.date);
    dateEl.textContent = d.toLocaleString("ar-EG");
  }

  const statusEl = document.getElementById("details-order-status");
  if (statusEl && data.status) statusEl.textContent = data.status;

  // 👤 بيانات العميل
  if (data.customer) {
    const nameEl = document.getElementById("customer-name");
    const phoneEl = document.getElementById("customer-phone");
    const emailEl = document.getElementById("customer-email");

    if (nameEl) nameEl.textContent = data.customer.name || "--";
    if (phoneEl) phoneEl.textContent = data.customer.phone || "--";
    if (emailEl) emailEl.textContent = data.customer.email || "لا يوجد بريد";
  }

  // 🏠 عنوان الشحن
  if (data.address) {
    const cityEl = document.getElementById("address-city");
    const streetEl = document.getElementById("address-street");
    const districtEl = document.getElementById("address-district");

    if (cityEl) cityEl.textContent = data.address.city || "--";
    if (streetEl) streetEl.textContent = data.address.street || "--";
    if (districtEl)
      districtEl.textContent = data.address.district || "لا يوجد حي محدد";
  }

  // 💳 الدفع والشحن
  if (data.payment) {
    const payMethodEl = document.getElementById("payment-method");
    const txIdEl = document.getElementById("payment-txid");
    const fromPhoneEl = document.getElementById("payment-from-phone");

    if (payMethodEl) {
      const label =
        paymentLabels[data.payment.method] || data.payment.method || "--";
      payMethodEl.textContent = label;
    }

    if (txIdEl) {
      txIdEl.textContent = data.payment.txId || "لا يوجد";
    }

    if (fromPhoneEl) {
      fromPhoneEl.textContent = data.payment.fromPhone || "لا يوجد";
    }
  }

  if (data.shipping) {
    const shipMethodEl = document.getElementById("shipping-method");
    const shipCostEl = document.getElementById("shipping-cost");

    if (shipMethodEl) {
      const label =
        shippingLabels[data.shipping.method] || data.shipping.method || "--";
      shipMethodEl.textContent = label;
    }
    if (shipCostEl) {
      shipCostEl.textContent = formatPriceYER(data.shipping.cost || 0);
    }
  }

  // 🧾 المنتجات
  const itemsContainer = document.getElementById("order-items");
  if (itemsContainer) {
    itemsContainer.innerHTML = "";

    if (!data.items || !data.items.length) {
      itemsContainer.innerHTML =
        '<p class="text-xs text-gray-500">لا توجد منتجات في هذا الطلب.</p>';
    } else {
      data.items.forEach((item) => {
        const qty = item.qty || item.quantity || 1;
        const price = item.price || 0;
        const lineTotal = price * qty;

        const div = document.createElement("div");
        div.className =
          "flex flex-col sm:flex-row gap-3 sm:gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0";

        div.innerHTML = `
            <div class="w-20 h-24 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
              ${
                item.image
                  ? `<img src="${item.image}" alt="${
                      item.name || ""
                    }" class="w-full h-full object-cover" />`
                  : ""
              }
            </div>
            <div class="flex-1 space-y-1">
              <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
                <p class="font-medium text-sm">${item.name || "منتج"}</p>
                <p class="font-semibold text-brand-800 text-sm">
                  ${formatPriceYER(lineTotal)}
                </p>
              </div>
              <p class="text-xs text-gray-500">
                ${
                  item.size
                    ? `المقاس: <span class="font-medium">${item.size}</span>`
                    : ""
                }
                ${
                  item.color
                    ? ` · اللون: <span class="font-medium">${item.color}</span>`
                    : ""
                }
                · الكمية:
                <span class="font-medium">${qty}</span>
              </p>
            </div>
          `;

        itemsContainer.appendChild(div);
      });
    }
  }

  // 📊 ملخص الفاتورة
  if (data.totals) {
    const subEl = document.getElementById("summary-subtotal");
    const shipEl = document.getElementById("summary-shipping");
    const discEl = document.getElementById("summary-discount");
    const totalEl = document.getElementById("summary-total");

    if (subEl) subEl.textContent = formatPriceYER(data.totals.subtotal || 0);
    if (shipEl) shipEl.textContent = formatPriceYER(data.totals.shipping || 0);
    if (discEl) discEl.textContent = formatPriceYER(data.totals.discount || 0);
    if (totalEl) totalEl.textContent = formatPriceYER(data.totals.total || 0);
  }
});
