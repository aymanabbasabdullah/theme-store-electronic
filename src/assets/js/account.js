// ================== تبويب الحسابات (Tabs) ==================
// ================== تبويب الحسابات (Tabs) ==================
function initAccountTabs() {
  // نختار أزرار التابات من القائمة الجانبية فقط
  const tabButtons = document.querySelectorAll("aside [data-account-tab]");

  const tabPanels = {
    orders: document.getElementById("account-tab-orders"),
    addresses: document.getElementById("account-tab-addresses"),
    settings: document.getElementById("account-tab-settings"),
  };

  if (!tabButtons.length) return;

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-account-tab");

      // إعادة ضبط جميع الأزرار (أبيض + هوفر رمادي)
      tabButtons.forEach((b) => {
        b.classList.remove(
          "bg-brand-600",
          "text-white",
          "shadow-sm",
          "hover:bg-brand-700"
        );
        b.classList.add("bg-white", "text-slate-800", "hover:bg-slate-50");
      });

      // تفعيل الزر الحالي (أزرق) وإلغاء هوفر الرمادي
      btn.classList.add(
        "bg-brand-600",
        "text-white",
        "shadow-sm",
        "hover:bg-brand-700"
      );
      btn.classList.remove("bg-white", "text-slate-800", "hover:bg-slate-50");

      // إظهار / إخفاء البانلز
      Object.keys(tabPanels).forEach((key) => {
        const panel = tabPanels[key];
        if (!panel) return;
        panel.classList.toggle("hidden", key !== target);
      });
    });
  });

  // زر "تعديل بيانات الحساب" في كرت البروفايل يفتح تبويب الإعدادات
  const profileSettingsBtn = document.getElementById(
    "open-settings-from-profile"
  );
  if (profileSettingsBtn) {
    profileSettingsBtn.addEventListener("click", () => {
      const sidebarSettingsBtn = document.querySelector(
        "aside [data-account-tab='settings']"
      );
      if (sidebarSettingsBtn) {
        sidebarSettingsBtn.click();
      }
    });
  }
}

// ================== تحميل الطلبات في تبويب "طلباتي" ==================
function renderAccountOrders() {
  const container = document.querySelector("#account-tab-orders #orders-list");
  if (!container) return;

  const raw = localStorage.getItem("orders");
  const orders = raw ? JSON.parse(raw) : [];

  container.innerHTML = "";

  if (!orders.length) {
    container.innerHTML =
      '<p class="text-xs text-slate-500">لا توجد طلبات حتى الآن. ابدأ التسوق وأضف أول طلب لك.</p>';
    return;
  }

  orders
    .slice()
    .reverse() // آخر طلب أولاً
    .forEach((order) => {
      const productsCount = (order.items || []).length;
      const total = order.totals ? order.totals.total : 0;
      const dateObj = order.date ? new Date(order.date) : null;
      const dateText = dateObj
        ? dateObj.toLocaleDateString("ar-EG")
        : "غير متوفر";

      const statusText = order.status || "قيد المعالجة";

      let statusClass = "bg-amber-100 text-amber-700 border border-amber-200";
      if (statusText.includes("تم")) {
        statusClass =
          "bg-emerald-100 text-emerald-700 border border-emerald-200";
      }

      const article = document.createElement("article");
      article.className =
        "border border-slate-200 rounded-2xl p-3.5 sm:p-4 hover:border-brand-300 hover:shadow-sm transition";

      article.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div class="flex flex-col gap-0.5">
            <p class="text-xs text-slate-500">
              رقم الطلب:
              <span class="font-semibold text-brand-700">#${order.id}</span>
            </p>
            <p class="text-xs text-slate-500">
              التاريخ:
              <span class="font-medium">${dateText}</span>
            </p>
          </div>
          <span class="inline-flex items-center gap-1 rounded-full text-[0.7rem] px-3 py-1 ${statusClass}">
            <span class="w-1.5 h-1.5 rounded-full ${
              statusClass.includes("emerald")
                ? "bg-emerald-500"
                : "bg-amber-500"
            }"></span>
            ${statusText}
          </span>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-2.5 mt-2">
          <p class="text-xs sm:text-sm text-slate-600">
            ${productsCount} منتج · الإجمالي:
            <span class="font-semibold text-brand-700">
              ${Number(total).toLocaleString("ar-EG")} ريال يمني
            </span>
          </p>
          <div class="flex items-center gap-2 text-xs sm:text-[13px]">
            <a
              href="/src/pages/order-details.html?id=${encodeURIComponent(
                order.id
              )}"
              class="rounded-xl border border-slate-200 px-3 py-1.5 hover:border-brand-500 hover:text-brand-600 transition"
            >
              عرض التفاصيل
            </a>
            <a
              href="/src/pages/category.html"
              class="rounded-xl border border-brand-600 bg-brand-600 text-white px-3 py-1.5 hover:bg-brand-700 hover:border-brand-700 transition"
            >
              إعادة الشراء
            </a>
          </div>
        </div>
      `;

      container.appendChild(article);
    });
}

// ================== عناوين الشحن (Add / Edit / Delete) ==================
function loadAddresses() {
  const raw = localStorage.getItem("accountAddresses");
  return raw ? JSON.parse(raw) : [];
}

function saveAddresses(addresses) {
  localStorage.setItem("accountAddresses", JSON.stringify(addresses));
}

function renderAddresses() {
  const listEl = document.getElementById("addresses-list");
  if (!listEl) return;

  const addresses = loadAddresses();
  listEl.innerHTML = "";

  if (!addresses.length) {
    listEl.innerHTML =
      '<p class="text-xs text-slate-500">لا توجد عناوين مضافة بعد. اضغط على "إضافة عنوان جديد".</p>';
    return;
  }

  addresses.forEach((addr) => {
    const card = document.createElement("div");
    card.className =
      "border border-slate-200 rounded-2xl p-4 space-y-1.5 hover:border-brand-300 hover:shadow-sm transition";

    card.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-1">
        <p class="font-semibold flex items-center gap-1.5">
          <span
            class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-700"
          >${addr.label?.[0] || "ع"}</span>
          <span>${addr.label || "عنوان بدون اسم"}</span>
        </p>
        ${
          addr.isDefault
            ? `<span
                 class="text-[10px] rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 border border-emerald-200"
               >افتراضي</span>`
            : ""
        }
      </div>
      <p class="text-slate-600 text-xs leading-relaxed">
        ${addr.city || ""} ${addr.district ? " - " + addr.district : ""}<br/>
        ${addr.street || ""}<br/>
        ${addr.details || ""}
      </p>
      ${
        addr.phone
          ? `<p class="text-slate-500 text-[11px] mt-1">
               رقم تواصل: ${addr.phone}
             </p>`
          : ""
      }

      <div class="flex items-center gap-2 mt-3 text-xs">
        <button
          type="button"
          data-role="edit-address"
          data-id="${addr.id}"
          class="rounded-xl border border-slate-200 px-3 py-1.5 hover:border-brand-500 hover:text-brand-600 transition"
        >
          تعديل
        </button>
        <button
          type="button"
          data-role="delete-address"
          data-id="${addr.id}"
          class="rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 px-3 py-1.5 hover:border-red-600 transition"
        >
          حذف
        </button>
      </div>
    `;

    listEl.appendChild(card);
  });
}

function initAddressForm() {
  const addBtn = document.querySelector(
    '#account-tab-addresses [data-role="add-address"]'
  );
  const wrapper = document.getElementById("address-form-wrapper");
  const form = document.getElementById("address-form");
  const cancelBtn = document.getElementById("address-form-cancel");
  const listEl = document.getElementById("addresses-list");

  if (!addBtn || !wrapper || !form || !listEl) return;

  let editingId = null;

  function openForm(address) {
    wrapper.classList.remove("hidden");

    form.reset();
    editingId = address ? address.id : null;

    document.getElementById("address-id").value = editingId || "";
    document.getElementById("address-label").value = address?.label || "";
    document.getElementById("address-city-input").value = address?.city || "";
    document.getElementById("address-district-input").value =
      address?.district || "";
    document.getElementById("address-street-input").value =
      address?.street || "";
    document.getElementById("address-details-input").value =
      address?.details || "";
    document.getElementById("address-phone-input").value = address?.phone || "";
    document.getElementById("address-default").checked = !!address?.isDefault;
  }

  function closeForm() {
    wrapper.classList.add("hidden");
    editingId = null;
    form.reset();
  }

  addBtn.addEventListener("click", () => openForm(null));
  cancelBtn.addEventListener("click", () => closeForm());

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const addr = {
      id: editingId || Date.now().toString(),
      label: formData.get("label")?.toString().trim() || "عنوان بدون اسم",
      city: formData.get("city")?.toString().trim() || "",
      district: formData.get("district")?.toString().trim() || "",
      street: formData.get("street")?.toString().trim() || "",
      details: formData.get("details")?.toString().trim() || "",
      phone: formData.get("phone")?.toString().trim() || "",
      isDefault: formData.get("isDefault") === "on",
    };

    let addresses = loadAddresses();

    // لو هذا العنوان افتراضي، نخلي الباقي false
    if (addr.isDefault) {
      addresses = addresses.map((a) => ({ ...a, isDefault: false }));
    }

    if (editingId) {
      addresses = addresses.map((a) => (a.id === editingId ? addr : a));
    } else {
      addresses.push(addr);
    }

    saveAddresses(addresses);
    renderAddresses();
    closeForm();
  });

  // أحداث تعديل / حذف باستخدام event delegation
  listEl.addEventListener("click", (e) => {
    const editBtn = e.target.closest("[data-role='edit-address']");
    const deleteBtn = e.target.closest("[data-role='delete-address']");

    if (editBtn) {
      const id = editBtn.getAttribute("data-id");
      const addresses = loadAddresses();
      const addr = addresses.find((a) => a.id === id);
      if (addr) openForm(addr);
    }

    if (deleteBtn) {
      const id = deleteBtn.getAttribute("data-id");
      if (!confirm("هل أنت متأكد من حذف هذا العنوان؟")) return;
      const addresses = loadAddresses().filter((a) => a.id !== id);
      saveAddresses(addresses);
      renderAddresses();
    }
  });
}

// ================== صورة البروفايل (Upload + localStorage) ==================
function applyAvatar(dataUrl) {
  const profileImg = document.getElementById("profile-avatar");
  const profileInitial = document.getElementById("profile-avatar-initial");
  const settingsImg = document.getElementById("settings-avatar-preview");
  const settingsInitial = document.getElementById("settings-avatar-initial");

  if (profileImg && profileInitial) {
    if (dataUrl) {
      profileImg.src = dataUrl;
      profileImg.classList.remove("hidden");
      profileInitial.classList.add("hidden");
    } else {
      profileImg.classList.add("hidden");
      profileInitial.classList.remove("hidden");
    }
  }

  if (settingsImg && settingsInitial) {
    if (dataUrl) {
      settingsImg.src = dataUrl;
      settingsImg.classList.remove("hidden");
      settingsInitial.classList.add("hidden");
    } else {
      settingsImg.classList.add("hidden");
      settingsInitial.classList.remove("hidden");
    }
  }
}

function initAvatar() {
  const uploadBtn = document.getElementById("avatar-upload-btn");
  const input = document.getElementById("avatar-input");
  if (!uploadBtn || !input) return;

  // تحميل صورة محفوظة من localStorage
  const saved = localStorage.getItem("accountAvatar");
  if (saved) applyAvatar(saved);

  uploadBtn.addEventListener("click", () => input.click());

  input.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const maxSize = 15 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
      alert("حجم الصورة كبير، الحد الأقصى 5 ميجا.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      localStorage.setItem("accountAvatar", dataUrl);
      applyAvatar(dataUrl);
    };
    reader.readAsDataURL(file);
  });
}

// ================== مزامنة بيانات أساسية للبروفايل مع الإعدادات ==================
function initProfileInfoBinding() {
  const nameInput = document.getElementById("acc-name");
  const phoneInput = document.getElementById("acc-phone");
  const emailInput = document.getElementById("acc-email");

  const profileName = document.getElementById("profile-name");
  const profilePhone = document.getElementById("profile-phone");
  const profileEmail = document.getElementById("profile-email");

  // تحميل من localStorage
  const raw = localStorage.getItem("accountProfile");
  const profile = raw ? JSON.parse(raw) : {};

  if (nameInput && profile.name) nameInput.value = profile.name;
  if (phoneInput && profile.phone) phoneInput.value = profile.phone;
  if (emailInput && profile.email) emailInput.value = profile.email;

  if (profileName && profile.name) profileName.textContent = profile.name;
  if (profilePhone && profile.phone) profilePhone.textContent = profile.phone;
  if (profileEmail && profile.email) profileEmail.textContent = profile.email;

  // عند حفظ التغييرات (نستعمل زر "حفظ التغييرات" الموجود)
  const saveBtn = document.querySelector(
    "#account-tab-settings button.inline-flex.bg-brand-600"
  );
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const newProfile = {
        name: nameInput?.value.trim() || "",
        phone: phoneInput?.value.trim() || "",
        email: emailInput?.value.trim() || "",
      };
      localStorage.setItem("accountProfile", JSON.stringify(newProfile));

      if (profileName)
        profileName.textContent = newProfile.name || "اسم العميل";
      if (profilePhone) profilePhone.textContent = newProfile.phone || "";
      if (profileEmail) profileEmail.textContent = newProfile.email || "";

      // لو حاب تضيف Toast هنا سوي
      alert("تم حفظ بيانات الحساب بنجاح");
    });
  }
}

// ================== DOM READY ==================
document.addEventListener("DOMContentLoaded", () => {
  initAccountTabs();
  renderAccountOrders();
  renderAddresses();
  initAddressForm();
  initAvatar();
  initProfileInfoBinding();
});
