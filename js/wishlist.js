const wishlistGrid = document.getElementById("wishlist-grid");
let savedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

function getWishlistedBooks() {
  if (savedWishlist.length === 0) {
    wishlistGrid.innerHTML =
      '<p class="text-center">Your wishlist is empty.</p>';
    return;
  }

  wishlistGrid.innerHTML = "";

  savedWishlist.forEach((book) => {
    const bookCard = createBookCard(book);
    wishlistGrid.appendChild(bookCard);
  });
}

function createBookCard(book) {
  const card = document.createElement("div");
  card.className = "book-card fade-in";
  card.setAttribute("data-id", book.id);

  card.innerHTML = `
    <div class="book-image">
      <img src=${book.image} alt=${book.title} loading="lazy">
    </div>
    <div class="book-info">
        <h3 class="book-title">${book.title}</h3>
        <p class="book-author">${book.authors}</p>
        <p class="book-id">ID: ${book.id}</p>
        <button class="wishlist-btn" data-id="${book.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </button>
    </div>
`;

  const wishlistBtn = card.querySelector(".wishlist-btn");

  card.addEventListener("click", (e) => {
    if (!e.target.closest(".wishlist-btn")) {
      window.location.href = `book-details.html?id=${book.id}`;
    }
  });

  wishlistBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    removeFromWishlist(book.id);
  });

  return card;
}

function removeFromWishlist(bookId) {
  savedWishlist = savedWishlist.filter((book) => book.id !== bookId);
  localStorage.setItem("wishlist", JSON.stringify(savedWishlist));

  const bookCard = document.querySelector(`.book-card[data-id='${bookId}']`);
  if (bookCard) {
    bookCard.remove();
  }
}

getWishlistedBooks();
