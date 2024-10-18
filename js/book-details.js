const bookDetailsContainer = document.getElementById("book-details");
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

let book = {};

async function fetchBookDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get("id");

  if (!bookId) {
    bookDetailsContainer.innerHTML = "<p>No book ID provided.</p>";
    return;
  }

  showLoader();

  try {
    const response = await fetch(`https://gutendex.com/books/${bookId}`);
    book = await response.json();
    renderBookDetails(book);
  } catch (error) {
    console.error("Error fetching book details:", error);
    bookDetailsContainer.innerHTML = "<p>Error loading book details.</p>";
  } finally {
    hideLoader();
  }
}

function renderBookDetails(book) {
  const isWishlisted = wishlist.findIndex((item) => item.id === book.id) !== -1;

  bookDetailsContainer.innerHTML = `
        <div class="book-details fade-in">
            <img src="${
              book.formats["image/jpeg"] || "https://via.placeholder.com/300"
            }" alt="${book.title}">
            <h2>${book.title}</h2>
            <p><strong>Author(s):</strong> ${book.authors
              .map((author) => author.name)
              .join(", ")}</p>
            <p><strong>Genres:</strong> ${book.subjects.join(", ")}</p>
            <p><strong>Languages:</strong> ${book.languages.join(", ")}</p>
            <p><strong>Download Count:</strong> ${book.download_count}</p>
            <p><strong>ID:</strong> ${book.id}</p>
            <button id="wishlistBtn" class="wishlist-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${
                  isWishlisted ? "currentColor" : "none"
                }" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                ${isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            </button>
        </div>
    `;

  document
    .getElementById("wishlistBtn")
    .addEventListener("click", () => toggleWishlist(book));
}

function toggleWishlist(book) {
  const bookData = {
    id: book.id,
    title: book.title,
    authors: book.authors.map((author) => author.name).join(", "),
    image: book.formats["image/jpeg"],
  };

  const index = wishlist.findIndex((item) => item.id === book.id);
  const wishlistBtn = document.querySelector(".wishlist-btn svg");

  if (index === -1) {
    wishlist.push(bookData);
    showToast("Added to Wishlist");
  } else {
    wishlist.splice(index, 1);
    showToast("Removed from Wishlist");
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  wishlistBtn.setAttribute("fill", index === -1 ? "currentColor" : "none");
}

function showToast(message, duration = 3000) {
  const toastContainer = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toastContainer.removeChild(toast);
    }, 500);
  }, duration);
}

function showLoader() {
  bookDetailsContainer.innerHTML = '<div class="loader"></div>';
}

function hideLoader() {
  const loader = document.querySelector(".loader");
  if (!loader) return;
  loader.remove();
}

fetchBookDetails();
