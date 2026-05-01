import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { X, Trash2 } from "lucide-react";
import { WA_NUMBER } from "../../config/constants";

export default function CartSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { items, removeItem, total, clearCart } = useCart();

  const waMessage = items.length > 0 
    ? `Commande Librairie YO:\n${items.map(i => `- ${i.title} (${i.unitPrice} GNF)`).join('\n')}\nTotal: ${total} GNF`
    : '';

  return (
    <div className={`fixed right-0 top-0 w-80 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">🛒 Panier</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Votre panier est vide
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4">
              {items.map((item) => (
                <div key={item.bookId} className="flex justify-between items-start border-b pb-3">
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-green-600 font-bold text-sm">{item.unitPrice?.toLocaleString()} GNF</p>
                  </div>
                  <button 
                    onClick={() => removeItem(item.bookId)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between font-bold text-lg mb-4">
                <span>Total:</span>
                <span>{total?.toLocaleString()} GNF</span>
              </div>
              
              {WA_NUMBER && (
                <a
                  href={`https://wa.me/${WA_NUMBER.replace(/^0/, '224')}?text=${encodeURIComponent(waMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-600 text-white block text-center py-3 rounded-lg hover:bg-red-700 transition mb-2"
                >
                  Commander via WhatsApp
                </a>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => { onClose(); navigate('/panier'); }}
                  className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Voir détails
                </button>
                <button
                  onClick={clearCart}
                  className="flex-1 text-red-500 text-sm hover:text-red-700 transition"
                >
                  Vider
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

