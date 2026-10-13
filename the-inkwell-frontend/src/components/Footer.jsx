export default function Footer() {
  return (
    <footer className="w-full px-8 py-12 flex flex-col items-center gap-8 bg-primary mt-12">
      <div className="flex flex-col items-center gap-4">
        <h2 className="font-display font-bold text-2xl text-on-primary tracking-tight">
          The<span className="italic text-surface opacity-60 font-medium ml-1">Inkwell.</span>
        </h2>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
          <a href="#" className="text-on-primary opacity-60 body-md hover:text-on-primary transition-colors">About Us</a>
          <a href="#" className="text-on-primary opacity-60 body-md hover:text-on-primary transition-colors">Sustainability</a>
          <a href="#" className="text-on-primary opacity-60 body-md hover:text-on-primary transition-colors">Shipping Policy</a>
          <a href="/store/apply" className="text-on-primary opacity-60 body-md hover:text-on-primary transition-colors">Become a Store</a>
          <a href="#" className="text-on-primary opacity-60 body-md hover:text-on-primary transition-colors">Terms of Service</a>
          <a href="#" className="text-on-primary opacity-60 body-md hover:text-on-primary transition-colors">Privacy</a>
        </div>
      </div>
      <p className="caption text-on-primary opacity-60">© 2026 The Inkwell Bookstore Ecosystem. Curating depth for the discerning reader.</p>
    </footer>
  );
}
