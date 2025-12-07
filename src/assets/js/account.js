// Simple account tabs logic
const tabButtons = document.querySelectorAll("[data-account-tab]");
const tabPanels = {
  orders: document.getElementById("account-tab-orders"),
  addresses: document.getElementById("account-tab-addresses"),
  payments: document.getElementById("account-tab-payments"),
  settings: document.getElementById("account-tab-settings"),
};

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-account-tab");

    // Toggle button active state
    tabButtons.forEach((b) => {
      b.classList.remove("bg-brand-800", "text-white");
      b.classList.add("hover:bg-gray-50");
    });
    btn.classList.add("bg-brand-800", "text-white");
    btn.classList.remove("hover:bg-gray-50");

    // Toggle panels
    Object.keys(tabPanels).forEach((key) => {
      if (tabPanels[key]) {
        tabPanels[key].classList.toggle("hidden", key !== target);
      }
    });
  });
});

// ===== تحميل الطلبات في تبويب "طلباتي" =====
function renderAccountOrders() {
  const container = document.querySelector("#account-tab-orders .space-y-3");
  if (!container) return;

  const raw = localStorage.getItem("orders");
  const orders = raw ? JSON.parse(raw) : [];

  container.innerHTML = "";

  if (!orders.length) {
    container.innerHTML =
      '<p class="text-xs text-gray-500">لا توجد طلبات حتى الآن. ابدأ التسوق وأضف أول طلب لك.</p>';
    return;
  }

  orders
    .slice()
    .reverse() // آخر طلبات أولاً
    .forEach((order) => {
      const productsCount = (order.items || []).length;
      const total = order.totals ? order.totals.total : 0;
      const dateObj = order.date ? new Date(order.date) : null;
      const dateText = dateObj
        ? dateObj.toLocaleDateString("ar-EG")
        : "غير متوفر";

      const statusText = order.status || "قيد المعالجة";

      // كلاس اللون حسب الحالة (بسيط)
      let statusClass = "bg-amber-50 text-amber-700"; // default "قيد المعالجة"
      if (statusText.includes("تم")) {
        statusClass = "bg-emerald-50 text-emerald-700";
      }

      const article = document.createElement("article");
      article.className = "border border-gray-100 rounded-2xl p-3.5 sm:p-4";

      article.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div class="flex flex-col gap-0.5">
              <p class="text-xs text-gray-500">
                رقم الطلب:
                <span class="font-medium text-brand-800">#${order.id}</span>
              </p>
              <p class="text-xs text-gray-500">
                التاريخ:
                <span class="font-medium">${dateText}</span>
              </p>
            </div>
            <span class="inline-flex items-center rounded-full ${statusClass} text-[0.7rem] px-3 py-1">
              ${statusText}
            </span>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-2 mt-1">
            <p class="text-xs sm:text-sm text-gray-600">
              ${productsCount} منتج · الإجمالي:
              <span class="font-semibold text-brand-800">${total.toLocaleString(
                "ar-EG"
              )} ريال يمني</span>
            </p>
            <div class="flex items-center gap-2 text-xs">
              <a
                href="/src/pages/order-details.html?id=${encodeURIComponent(
                  order.id
                )}"
                class="rounded-xl border border-gray-200 px-3 py-1.5 hover:border-brand-800 hover:text-brand-800 transition"
              >
                عرض التفاصيل
              </a>
              <a
                href="/src/pages/category.html"
                class="rounded-xl border border-brand-900 bg-brand-800 text-white px-3 py-1.5 hover:bg-brand-900 transition"
              >
                إعادة الشراء
              </a>
            </div>
          </div>
        `;

      container.appendChild(article);
    });
}

// استدعاء عند فتح الصفحة
document.addEventListener("DOMContentLoaded", () => {
  renderAccountOrders();
});
