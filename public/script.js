const API_URL = "https://codevectorlabs-assignment-dmby.onrender.com";

let cursor = null;
let snapshot = null;
let category = "";
let hasNextPage = true;

const productsContainer = document.getElementById("products");

async function fetchProducts(reset = false) {
  const params = new URLSearchParams();

  if (cursor) {
    params.append("cursor", cursor);
  }

  if (snapshot) {
    params.append("snapshot", snapshot);
  }

  if (category) {
    params.append("category", category);
  }

  const response = await fetch(`${API_URL}/products?${params}`);

  const data = await response.json();

  snapshot = data.snapshot;
  cursor = data.nextCursor;
  hasNextPage = data.hasNextPage;

  if (reset) {
    productsContainer.innerHTML = "";
  }

  data.products.forEach((product) => {
    const div = document.createElement("div");

    div.className = "card";

    div.innerHTML = `
      <h3>${product.name}</h3>
      <p>${product.category}</p>
      <p>₹${product.price}</p>
    `;

    productsContainer.appendChild(div);
  });

  document.getElementById("loadMore").style.display = hasNextPage
    ? "block"
    : "none";
}

document.getElementById("loadMore").addEventListener("click", () => {
  fetchProducts();
});

document.getElementById("category").addEventListener("change", (e) => {
  category = e.target.value;

  cursor = null;
  snapshot = null;

  fetchProducts(true);
});

fetchProducts(true);
