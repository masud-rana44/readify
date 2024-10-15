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

  bookCard.innerHTML = `
  <img src=${book.formats["image/jpeg"]} alt=${book.title} />
  <div class="book-info">
    <h3 class="book-title">${book.title}</h3>
  </div>
  `;

  return bookCard;
}

fetchBooks();
