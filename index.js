const productCards = [...document.querySelectorAll(".product-card")];
const filterButtons = [...document.querySelectorAll(".filter-chip")];
const productGrid = document.getElementById("productGrid");
const productTotal = document.getElementById("productTotal");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const apiProductGrid = document.getElementById("apiProductGrid");
const apiStatus = document.getElementById("apiStatus");
const apiRetry = document.getElementById("apiRetry");
const cart = new Map();
let activeCategory = "all";
let toastTimer;

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function filterProducts() {
    const query = searchInput.value.trim().toLocaleLowerCase("ka");
    let visibleCount = 0;

    productCards.forEach((card) => {
        const categoryMatches = activeCategory === "all" || card.dataset.category === activeCategory;
        const searchMatches = card.dataset.name.toLocaleLowerCase("ka").includes(query);
        const isVisible = categoryMatches && searchMatches;
        card.hidden = !isVisible;
        if (isVisible) visibleCount += 1;
    });

    productTotal.textContent = `${String(visibleCount).padStart(2, "0")} ნივთი`;
    emptyState.hidden = visibleCount !== 0;
    productGrid.hidden = visibleCount === 0;
}

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        activeCategory = button.dataset.category;
        filterButtons.forEach((item) => item.classList.toggle("active", item === button));
        filterProducts();
    });
});

document.querySelectorAll(".favorite-button").forEach((button) => {
    button.addEventListener("click", () => {
        const isFavorite = button.getAttribute("aria-pressed") !== "true";
        button.setAttribute("aria-pressed", String(isFavorite));
        button.textContent = isFavorite ? "♥" : "♡";
        showToast(isFavorite ? "ნივთი რჩეულებში დაემატა" : "ნივთი რჩეულებიდან წაიშალა");
    });
});

function renderCart() {
    const cartItems = document.getElementById("cartItems");
    const itemCount = [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);
    const total = [...cart.values()].reduce((sum, item) => sum + item.price * item.quantity, 0);

    document.getElementById("cartCount").textContent = itemCount;
    document.getElementById("cartToggle").setAttribute("aria-label", `კალათა, ${itemCount} ნივთი`);
    document.getElementById("drawerCount").textContent = `(${itemCount})`;
    document.getElementById("cartTotal").textContent = `${total}₾`;
    cartItems.replaceChildren();

    if (cart.size === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "cart-empty";
        emptyMessage.append("შენი კალათა ჯერ ცარიელია.", document.createElement("br"), "იპოვე რამე, რაც მოგეწონება.");
        cartItems.append(emptyMessage);
        return;
    }

    cart.forEach((item, name) => {
        const row = document.createElement("article");
        row.className = "cart-item";

        const details = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = name;
        const price = document.createElement("p");
        price.textContent = `${item.price}₾ · ${item.quantity} ცალი`;
        details.append(title, price);

        const actions = document.createElement("div");
        actions.className = "cart-item-actions";

        const decrease = document.createElement("button");
        decrease.className = "quantity-button";
        decrease.type = "button";
        decrease.textContent = "−";
        decrease.setAttribute("aria-label", `${name}-ის რაოდენობის შემცირება`);
        decrease.addEventListener("click", () => changeQuantity(name, -1));

        const quantity = document.createElement("span");
        quantity.textContent = item.quantity;
        quantity.setAttribute("aria-label", "რაოდენობა");

        const increase = document.createElement("button");
        increase.className = "quantity-button";
        increase.type = "button";
        increase.textContent = "+";
        increase.setAttribute("aria-label", `${name}-ის რაოდენობის გაზრდა`);
        increase.addEventListener("click", () => changeQuantity(name, 1));

        const remove = document.createElement("button");
        remove.className = "remove-button";
        remove.type = "button";
        remove.textContent = "წაშლა";
        remove.addEventListener("click", () => {
            cart.delete(name);
            renderCart();
        });

        actions.append(decrease, quantity, increase, remove);
        row.append(details, actions);
        cartItems.append(row);
    });
}

function changeQuantity(name, change) {
    const item = cart.get(name);
    if (!item) return;
    item.quantity += change;
    if (item.quantity <= 0) cart.delete(name);
    renderCart();
}

document.querySelectorAll(".quick-add").forEach((button) => {
    button.addEventListener("click", () => {
        const { name, price } = button.dataset;
        const existing = cart.get(name);
        if (existing) existing.quantity += 1;
        else cart.set(name, { price: Number(price), quantity: 1 });
        renderCart();
        showToast("ნივთი კალათაში დაემატა");
    });
});

const cartDrawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("overlay");

function setCartOpen(isOpen) {
    cartDrawer.classList.toggle("open", isOpen);
    overlay.classList.toggle("open", isOpen);
    cartDrawer.setAttribute("aria-hidden", String(!isOpen));
    document.body.style.overflow = isOpen ? "hidden" : "";
    if (isOpen) document.getElementById("cartClose").focus();
}

document.getElementById("cartToggle").addEventListener("click", () => setCartOpen(true));
document.getElementById("cartClose").addEventListener("click", () => setCartOpen(false));
overlay.addEventListener("click", () => setCartOpen(false));
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setCartOpen(false);
});

const searchBar = document.getElementById("searchBar");
document.getElementById("searchToggle").addEventListener("click", () => {
    searchBar.classList.add("open");
    searchInput.focus();
});
document.getElementById("searchClose").addEventListener("click", () => {
    searchBar.classList.remove("open");
    searchInput.value = "";
    filterProducts();
});
searchInput.addEventListener("input", filterProducts);

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
});
mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
    });
});

document.getElementById("newsletterForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const emailInput = document.getElementById("emailInput");
    document.getElementById("newsletterMessage").textContent = "მადლობა გამოწერისთვის! მალე მოგწერთ.";
    emailInput.value = "";
});

document.getElementById("checkoutButton").addEventListener("click", () => {
    if (cart.size === 0) showToast("შეკვეთამდე კალათაში ნივთი დაამატე");
    else showToast("შეკვეთის გასაფორმებლად მოგვწერე: hello@noir.ge");
});

function createApiProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";

    const imageWrap = document.createElement("div");
    imageWrap.className = "product-image-wrap";
    const image = document.createElement("img");
    image.src = product.thumbnail;
    image.alt = product.title;
    image.loading = "lazy";
    imageWrap.append(image);

    const info = document.createElement("div");
    info.className = "product-info";
    const details = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = product.title;
    const category = document.createElement("p");
    category.textContent = "ქალის ტანსაცმელი · DummyJSON";
    details.append(title, category);

    const price = document.createElement("strong");
    price.textContent = `$${product.price}`;
    info.append(details, price);
    card.append(imageWrap, info);
    return card;
}

async function loadApiProducts() {
    apiStatus.textContent = "პროდუქტები იტვირთება...";
    apiRetry.hidden = true;
    apiProductGrid.setAttribute("aria-busy", "true");

    try {
        // fetch-ის მეთოდი GET-ია: სერვერს მონაცემებს ვთხოვთ და არაფერს ვცვლით.
        const response = await fetch("https://dummyjson.com/products/category/womens-dresses?limit=8", {
            method: "GET",
            headers: { Accept: "application/json" }
        });

        if (!response.ok) {
            throw new Error(`სერვერის პასუხი: ${response.status}`);
        }

        // JSON ტექსტს JavaScript-ის ობიექტად ვაქცევთ.
        const data = await response.json();
        const products = Array.isArray(data.products)
            ? data.products.filter((product) =>
                typeof product.title === "string" &&
                typeof product.thumbnail === "string" &&
                Number.isFinite(product.price)
            )
            : [];

        if (products.length === 0) {
            throw new Error("API-მ პროდუქტები არ დააბრუნა");
        }

        apiProductGrid.replaceChildren(...products.map(createApiProductCard));
        apiStatus.textContent = `მიღებულია ${products.length} პროდუქტი. ფასები API-ის მონაცემებში დოლარითაა მითითებული.`;
    } catch (error) {
        apiProductGrid.replaceChildren();
        apiStatus.textContent = "პროდუქტების ჩამოტვირთვა ვერ მოხერხდა. შეამოწმე ინტერნეტი და სცადე თავიდან.";
        apiRetry.hidden = false;
        console.error("API პროდუქტების ჩატვირთვის შეცდომა:", error);
    } finally {
        apiProductGrid.setAttribute("aria-busy", "false");
    }
}

apiRetry.addEventListener("click", loadApiProducts);

filterProducts();
renderCart();
loadApiProducts();
