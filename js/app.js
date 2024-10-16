const booksGrid = document.getElementById("booksGrid");

const baseUrl = "https://gutendex.com/books";

async function fetchBooks() {
  try {
    const response = await fetch(baseUrl);
    const data = await response.json();

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
  } catch (error) {
    console.error("Error fetching books:", error);
    return null;
  }
}

function createBookCard(book) {
  const bookCard = document.createElement("div");
  bookCard.className = "book-card";
  const isWishlisted = false;
  const bookTitle =
    book.title.length > 40 ? `${book.title.slice(0, 40)}...` : book.title;

  bookCard.innerHTML = `
  <img src=${book.formats["image/jpeg"]} alt=${book.title} />
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

  return bookCard;
}

fetchBooks();
