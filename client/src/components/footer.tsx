export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="py-6 text-center text-sm text-gray-600">
      © {currentYear} Tag Extractor - Created with{" "}
      <span className="text-red-500 animate-pulse">❤️</span> by Zahid Hasan
    </footer>
  );
}
