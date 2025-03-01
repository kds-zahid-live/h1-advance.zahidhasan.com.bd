import { ExternalLink } from "lucide-react";

export function FloatingButton() {
  return (
    <a
      href="https://tools.zahidhasan.com.bd/"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed left-6 bottom-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 hover:shadow-xl transition-all duration-300 animate-float"
    >
      <ExternalLink className="w-4 h-4" />
      Get More Tools
    </a>
  );
}
