const booksGrid = document.getElementById("booksGrid");
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

async function fetchBooks() {
  const searchTerm = searchInput.value;
  const selectedGenre = genreFilter.value;

  const params = new URLSearchParams({
    page: currentPage,
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
    totalPages = Math.ceil(data.count / booksPerPage);
    books = data.results;

    console.log({ data });

    // Render the books data
    const fragment = document.createDocumentFragment();
    booksGrid.innerHTML = "";

    if (data.count === 0) {
      booksGrid.innerHTML = '<p class="text-center">No books found.</p>';
      return;
    }

    data.results.forEach((book) => {
      const bookCard = createBookCard(book);
      fragment.appendChild(bookCard);
    });

    booksGrid.appendChild(fragment);
    renderPagination();
    updateGenre();
  } catch (error) {
    console.error("Error fetching books:", error);
    return null;
  }
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
    <button class="wishlist-btn" data-id=${book.id}>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${
        isWishlisted ? "currentColor" : "none"
      }" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
    </button>
  </div>
  `;

  const wishlistBtn = bookCard.querySelector(".wishlist-btn");
  wishlistBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleWishlist(book);
  });

  bookCard.addEventListener("click", () => {
    window.location.href = `book-details.html?id=${book.id}`;
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
  } else {
    wishlist.splice(index, 1);
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

  // Next Button
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

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    currentPage = 1;
    fetchBooks();
  }, 1000);
});

genreFilter.addEventListener("change", () => {
  currentPage = 1;
  fetchBooks();
});

window.addEventListener("DOMContentLoaded", () => {
  fetchBooks();
});
