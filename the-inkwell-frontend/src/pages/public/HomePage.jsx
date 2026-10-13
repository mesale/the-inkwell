import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import BookCard from "../../components/BookCard";
import api from "../../api/axiosInstance";
import { getBooksFromResponse } from "../../utils/book";
import { FiBook } from "react-icons/fi";

const GENRES = ["All Genres", "Business", "Science", "Fiction", "Philosophy", "Biography"];



export default function HomePage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState("All Genres");

  useEffect(() => {
    api.get("/books", { skipAuth: true })
      .then((res) => setBooks(getBooksFromResponse(res)))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredBooks =
    activeGenre === "All Genres"
      ? books
      : books.filter((b) => b.category === activeGenre);

  const availableGenres = [
    "All Genres",
    ...new Set([
      ...GENRES.filter((genre) => genre !== "All Genres"),
      ...books.map((book) => book.category).filter(Boolean),
    ]),
  ];

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased pt-24 overflow-x-hidden">
      <Navbar />


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-16 w-full">

        {/* Popular by Genre */}
        <div className="flex flex-col gap-8 w-full">

          {/* Genre Tabs Header */}
          <div className="flex items-end justify-between border-b border-outline-variant pb-6 mb-4">
            <div>
              <h3 className="headline-md text-primary mb-2">Curated Collections</h3>
              <p className="body-md text-on-surface-variant">Discover titles captivating our community right now.</p>
            </div>
          </div>

          <div className="flex gap-8 overflow-x-auto no-scrollbar pb-4 -mt-6 mb-4 border-b border-surface-variant">
            {availableGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className={`whitespace-nowrap transition-colors pb-2 ${activeGenre === genre
                  ? "text-primary font-bold label-md border-b-2 border-primary"
                  : "text-secondary hover:text-primary font-medium label-md border-b-2 border-transparent"
                  }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Book Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-surface-variant rounded-xl shadow-elevation-1 animate-pulse" />
              ))}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant">
              <p className="text-4xl mb-4 flex justify-center"><FiBook /></p>
              <p className="body-lg">No books found in this genre yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {filteredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}

        </div>
      </main>



      <Footer />
    </div>
  );
}
