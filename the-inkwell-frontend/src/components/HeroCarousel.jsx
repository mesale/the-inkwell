import { useState } from "react";

const FEATURED_BOOKS = [
  {
    id: 1,
    title: "Big Magic: Creative Living Beyond Fear",
    author: "Elizabeth Gilbert",
    rating: 3,
    votes: "1,987,765",
    description: "A masterful exploration of memory and the quiet whispers of history. This pick dives deep into the journals of a forgotten librarian.",
    cover: "https://covers.openlibrary.org/b/id/8739161-L.jpg",
  },
  {
    id: 2,
    title: "Attack of The Planet",
    author: "Andrea Jordan",
    rating: 3,
    votes: "1,987,765",
    description: "A thrilling sci-fi adventure that tests the limits of humanity's survival and resilience.",
    cover: "https://placehold.co/400x600/f59e0b/fff?text=Attack+of+The+Planet",
  },
  {
    id: 3,
    title: "Ten Thousand Skies Above You",
    author: "Claudia Gray",
    rating: 4,
    votes: "1,987,765",
    description: "An incredible journey through multiple dimensions and alternate lives.",
    cover: "https://covers.openlibrary.org/b/id/8228691-L.jpg",
  },
];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);

  const prev = () => setActive((a) => (a - 1 + FEATURED_BOOKS.length) % FEATURED_BOOKS.length);
  const next = () => setActive((a) => (a + 1) % FEATURED_BOOKS.length);

  const book = FEATURED_BOOKS[active];

  return (
    <div className="relative w-full py-12 px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center bg-surface-variant p-12 relative overflow-hidden rounded-lg shadow-elevation-1">
        {/* Left Side Info */}
        <div className="lg:col-span-7 z-10 flex flex-col justify-center min-h-[400px]">
          <span className="label-md text-primary tracking-[0.2em] mb-4 block uppercase">
            Curated Selection
          </span>
          <h2 className="display-lg text-primary mb-6 leading-tight">
            Book of the Month:<br />
            <span className="italic text-secondary">{book.title}</span>
          </h2>
          <p className="body-lg text-on-surface-variant mb-8 max-w-xl">
            {book.description}
          </p>
          <p className="label-md text-secondary mb-8">
            by {book.author}
          </p>

          <div className="flex items-center gap-6">
            <button className="btn-primary px-8 py-4 label-md">
              Reserve a Copy
            </button>
            <button className="btn-secondary px-8 py-4 label-md">
              Read Preview
            </button>
          </div>
        </div>

        {/* Right Side Image */}
        <div className="lg:col-span-5 relative group flex justify-center">
          <div className="aspect-[2/3] w-full max-w-sm bg-white shadow-elevation-3 transition-transform duration-500 group-hover:scale-[1.02] overflow-hidden">
            <img
              src={book.cover}
              alt={book.title}
              className="w-full h-full object-cover transition-opacity duration-500"
              key={book.cover}
            />
          </div>
        </div>

        {/* Artistic Texture */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>

        {/* Carousel Navigation */}
        <div className="absolute bottom-6 right-6 flex gap-4 z-20">
          <button
            onClick={prev}
            className="p-3 bg-surface border border-outline-variant rounded-full text-primary hover:border-primary hover:bg-surface-variant transition-colors active:scale-90"
            aria-label="Previous Book"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="p-3 bg-surface border border-outline-variant rounded-full text-primary hover:border-primary hover:bg-surface-variant transition-colors active:scale-90"
            aria-label="Next Book"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
