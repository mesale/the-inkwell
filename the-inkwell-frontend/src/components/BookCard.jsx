import { Link } from "react-router-dom";
import { getBookImageUrl } from "../utils/book";

export default function BookCard({ book }) {
  const { id, title, author, price, category, condition } = book;
  const imageUrl = getBookImageUrl(book);

  return (
    <Link to={`/books/${id}`} className="block w-full group cursor-pointer">
      {/* Book Cover with soft shadow */}
      <div className="aspect-[2/3] w-full bg-surface-variant rounded-xl shadow-elevation-1 mb-6 overflow-hidden transition-all duration-300 group-hover:shadow-elevation-3 group-hover:-translate-y-2">
        <img
          src={imageUrl || "https://placehold.co/200x300?text=Book"}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
      </div>

      {/* Info Section beneath the cover */}
      <div className="flex flex-col">
        <h4 className="font-display font-semibold text-xl text-primary mb-1 group-hover:text-primary-container transition-colors line-clamp-2 leading-snug">
          {title}
        </h4>
        <p className="label-md text-secondary uppercase tracking-wider mb-2">
          {author}
        </p>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-stone">
          <span className="body-lg text-primary font-bold">${price}</span>
          <span className="caption text-on-surface-variant bg-surface-variant px-2 py-1 rounded-sm font-medium">
            {condition} · {category}
          </span>
        </div>
      </div>
    </Link>
  );
}
