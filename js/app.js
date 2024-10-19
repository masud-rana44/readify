const booksGrid = document.getElementById("booksGrid");
const booksGridWrapper = document.querySelector(".books-grid-wrapper");
const searchInput = document.getElementById("search");
const genreFilter = document.getElementById("genre-filter");

const booksPerPage = 32;
const baseUrl = "https://gutendex.com/books";

let currentPage = 1;
let totalPages = 1;
let genres = [];
let books = [];
let searchTimeout;

let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
const userPreferences =
  JSON.parse(localStorage.getItem("userPreferences")) || {};

let prefetchedBooks = {
  prev: null,
  next: null,
};
let prefetchedPage = {
  prev: null,
  next: null,
};

searchInput.value = userPreferences.searchTerm || "";
genreFilter.value = userPreferences.selectedGenre || "";

function saveUserPreferences() {
  const userPreferences = {
    searchTerm: searchInput.value,
    selectedGenre: genreFilter.value,
  };
  localStorage.setItem("userPreferences", JSON.stringify(userPreferences));
}

async function fetchBooks(page = currentPage) {
  showSkeletonLoader();
  const searchTerm = searchInput.value;
  const selectedGenre = genreFilter.value;

  const params = new URLSearchParams({
    page,
  });

  if (selectedGenre) {
    params.append("topic", selectedGenre);
  }
  if (searchTerm) {
    params.append("search", searchTerm);
  }

  if (isPrefetchedData(page)) {
    hideSkeletonLoader();
    prefetchNextPage(page + 1);
    prefetchPreviousPage(page - 1);
    return;
  }

  try {
    const response = await fetch(`${baseUrl}?${params}`);
    const data = await response.json();
    totalPages = Math.ceil(data.count / booksPerPage);
    books = data.results;

    renderBooks();
    renderPagination();
    updateGenre();

    // Prefetch next and prev page
    prefetchNextPage(page + 1);
    prefetchPreviousPage(page - 1);
  } catch (error) {
    console.error("Error fetching books:", error);
    booksGridWrapper.innerHTML = `<div class="error-container">
      <p class="error">${error?.message || "An error occurred."}</p>
      <button class="reset-btn">Please try again!</button>
    </div>`;

    const resetBtn = document.querySelector(".reset-btn");
    resetBtn.addEventListener("click", () => {
      fetchBooks();
    });
    return null;
  } finally {
    hideSkeletonLoader();
  }
}

function renderBooks() {
  const fragment = document.createDocumentFragment();
  booksGrid.innerHTML = "";

  if (books.length === 0) {
    booksGridWrapper.innerHTML = '<p class="empty">No books found :)</p>';
    return;
  }

  books.forEach((book) => {
    const bookCard = createBookCard(book);
    fragment.appendChild(bookCard);
  });

  booksGrid.appendChild(fragment);
  booksGridWrapper.appendChild(booksGrid);
}

function createBookCard(book) {
  const bookCard = document.createElement("div");
  bookCard.className = "book-card";
  bookCard.dataset.id = book.id;

  const isWishlisted = wishlist.findIndex((item) => item.id === book.id) !== -1;

  const bookTitle =
    book.title.length > 40 ? `${book.title.slice(0, 40)}...` : book.title;

  bookCard.innerHTML = `
  <div class="book-image">
    <img src=${book.formats["image/jpeg"]} alt=${book.title} />
  </div>
  <div class="book-info">
    <h3 class="book-title">${bookTitle}</h3>
    <p class="book-author">${book.authors
      .map((author) => author.name)
      .join(", ")}</p>
    <p class="book-genres">${book.subjects.slice(0, 3).join(", ")}</p>
    <p class="book-id">ID: ${book.id}</p>
  </div>
  <button class="wishlist-btn" data-id=${book.id}>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${
      isWishlisted ? "currentColor" : "none"
    }" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
  </button>
  `;

  const wishlistBtn = bookCard.querySelector(".wishlist-btn");
  wishlistBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleWishlist(book);
  });

  bookCard.addEventListener("click", () => {
    window.location.href = `/book-details.html?id=${book.id}`;
  });

  return bookCard;
}

function toggleWishlist(book) {
  const bookData = {
    id: book.id,
    title: book.title,
    authors: book.authors.map((author) => author.name).join(", "),
    image: book.formats["image/jpeg"],
  };

  const index = wishlist.findIndex((item) => item.id === book.id);

  if (index === -1) {
    wishlist.push(bookData);
    showToast("Added to Wishlist");
  } else {
    wishlist.splice(index, 1);
    showToast("Removed from Wishlist");
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));

  // Find the specific card and update its button state
  const bookCard = document.querySelector(`.book-card[data-id='${book.id}']`);
  if (bookCard) {
    const wishlistBtn = bookCard.querySelector(".wishlist-btn svg");
    if (wishlistBtn) {
      wishlistBtn.setAttribute("fill", index === -1 ? "currentColor" : "none");
    }
  }
}

function updateGenre() {
  genreFilter.innerHTML = '<option value="">All Genres</option>';
  const fragment = document.createDocumentFragment();

  const allGenres = books.flatMap((book) => book.bookshelves);
  genres = Array.from(
    new Set(allGenres.map((genre) => genre.replace(/Browsing: /g, "")))
  );

  genres.forEach((genre) => {
    const option = document.createElement("option");
    option.value = genre;
    option.innerText = genre;
    fragment.appendChild(option);
  });
  genreFilter.appendChild(fragment);
}

function renderPagination() {
  pagination.innerHTML = "";

  const createButton = ({ text, isDisabled, onClick, isCurrent }) => {
    const button = document.createElement("button");
    button.innerText = text;
    button.disabled = isDisabled;
    button.className = isCurrent ? "pagination-btn current" : "pagination-btn";
    button.onclick = () => {
      button.disabled = true;
      onClick();
    };
    return button;
  };

  // Previous Button
  const prevButton = createButton({
    text: "❮",
    isDisabled: currentPage === 1,
    onClick: () => {
      if (currentPage > 1) {
        currentPage--;
        fetchBooks();
      }
    },
  });

  pagination.appendChild(prevButton);

  // Determine page numbers to display
  let pageRange = [];
  if (totalPages <= 10) {
    for (let i = 1; i <= totalPages; i++) {
      pageRange.push(i);
    }
  } else {
    pageRange = [1, 2];

    if (currentPage > 4) {
      pageRange.push("...");
    }

    const start = Math.max(3, currentPage - 1);
    const end = Math.min(currentPage + 1, totalPages - 2);

    for (let i = start; i <= end; i++) {
      pageRange.push(i);
    }

    if (currentPage < totalPages - 3) {
      pageRange.push("...");
    }

    pageRange.push(totalPages - 1, totalPages);
  }

  pageRange.forEach((page) => {
    if (page === "...") {
      const ellipsis = document.createElement("span");
      ellipsis.innerText = "...";
      ellipsis.className = "ellipsis";
      pagination.appendChild(ellipsis);
    } else {
      const pageButton = createButton({
        text: page.toString(),
        isDisabled: page === currentPage,
        isCurrent: page === currentPage,
        onClick: () => {
          currentPage = page;
          fetchBooks();
        },
      });
      pagination.appendChild(pageButton);
    }
  });

  const nextButton = createButton({
    text: "❯",
    isDisabled: currentPage === totalPages,
    onClick: () => {
      if (currentPage < totalPages) {
        currentPage++;
        fetchBooks();
      }
    },
  });

  pagination.appendChild(nextButton);
}

// PREFETCHING
function isPrefetchedData(page) {
  if (prefetchedPage.prev === page && prefetchedBooks.prev) {
    applyPrefetchedData(prefetchedBooks.prev);
    return true;
  }

  if (prefetchedPage.next === page && prefetchedBooks.next) {
    applyPrefetchedData(prefetchedBooks.next);
    return true;
  }

  return false;
}

function applyPrefetchedData(data) {
  books = data.results;
  totalPages = Math.ceil(data.count / booksPerPage);
  renderBooks();
  renderPagination();
  updateGenre();
}

async function prefetchPage(page) {
  if (page < 1 || page > totalPages) return;

  const searchTerm = searchInput.value;
  const selectedGenre = genreFilter.value;

  const params = new URLSearchParams({
    page,
  });

  if (selectedGenre) {
    params.append("topic", selectedGenre);
  }
  if (searchTerm) {
    params.append("search", searchTerm);
  }

  try {
    const response = await fetch(`${baseUrl}?${params}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error prefetching books:", error);
    booksGridWrapper.innerHTML = `<div class="error-container">
      <p class="error">${error?.message || "An error occurred."}</p>
      <button class="reset-btn">Please try again!</button>
    </div>`;

    const resetBtn = document.querySelector(".reset-btn");
    resetBtn.addEventListener("click", () => {
      fetchBooks();
    });
    return null;
  }
}

async function prefetchNextPage(nextPage) {
  prefetchedBooks.next = await prefetchPage(nextPage);
  prefetchedPage.next = nextPage;
}

async function prefetchPreviousPage(prevPage) {
  prefetchedBooks.prev = await prefetchPage(prevPage);
  prefetchedPage.prev = prevPage;
}

// TOAST
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

// LOADER
function showSkeletonLoader() {
  booksGrid.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    const skeletonCard = document.createElement("div");
    skeletonCard.className = "skeleton-card";
    skeletonCard.innerHTML = `
            <div class="skeleton skeleton-image"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
        `;
    booksGrid.appendChild(skeletonCard);
  }
}

function hideSkeletonLoader() {
  const loader = document.querySelector(".loader");
  if (loader) {
    loader.remove();
  }
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    saveUserPreferences();
    currentPage = 1;
    fetchBooks();
  }, 1000);
});

genreFilter.addEventListener("change", () => {
  saveUserPreferences();
  currentPage = 1;
  fetchBooks();
});

window.addEventListener("DOMContentLoaded", () => {
  fetchBooks();
});
