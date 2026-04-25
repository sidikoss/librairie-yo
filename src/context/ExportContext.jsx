import { createContext, useContext, useCallback, useMemo } from "react";
import { APP_NAME } from "../config/constants";

const ExportContext = createContext(null);

const EXPORT_FORMATS = {
  PDF: "pdf",
  JSON: "json",
  CSV: "csv",
  TEXT: "text",
};

export function ExportProvider({ children }) {
  const exportToJSON = useCallback((data, filename = "export") => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    downloadBlob(blob, `${filename}.json`);
  }, []);

  const exportToCSV = useCallback((data, columns, filename = "export") => {
    if (!data || data.length === 0) return;

    const headers = columns.map((c) => c.label || c.key).join(",");
    const rows = data.map((item) =>
      columns
        .map((c) => {
          const value = item[c.key];
          if (typeof value === "string" && value.includes(",")) {
            return `"${value}"`;
          }
          return value;
        })
        .join(",")
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${filename}.csv`);
  }, []);

  const exportToText = useCallback((content, filename = "export") => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    downloadBlob(blob, `${filename}.txt`);
  }, []);

  const exportCartToText = useCallback((cart, format = "text") => {
    const lines = [
      "=== Librairie YO - Récapitulatif ===",
      "",
      ...cart.items.map(
        (item, index) =>
          `${index + 1}. ${item.title}\n   ${item.author}\n   ${item.price.toLocaleString()} GNF`
      ),
      "",
      "─────────────────────────────────",
      `Total: ${cart.total.toLocaleString()} GNF`,
      "",
      `Date: ${new Date().toLocaleString("fr-FR")}`,
      "",
      APP_NAME,
    ];

    const content = lines.join("\n");

    if (format === "json") {
      exportToJSON(cart.items, "panier");
    } else {
      exportToText(content, "panier");
    }
  }, [exportToJSON, exportToText]);

  const exportOrderToText = useCallback((order, format = "text") => {
    const lines = [
      "=== Librairie YO - Commande ===",
      "",
      `Commande: ${order.id}`,
      `Date: ${new Date(order.createdAt).toLocaleString("fr-FR")}`,
      "",
      "Articles:",
      ...order.items.map(
        (item, index) =>
          `${index + 1}. ${item.title}\n   ${item.price.toLocaleString()} GNF`
      ),
      "",
      "─────────────────────────────────",
      `Total: ${order.total.toLocaleString()} GNF`,
      "",
      `Statut: ${order.status}`,
      "",
    ];

    const content = lines.join("\n");

    if (format === "json") {
      exportToJSON(order, `commande-${order.id}`);
    } else {
      exportToText(content, `commande-${order.id}`);
    }
  }, [exportToJSON, exportToText]);

  const exportCatalogToCSV = useCallback((books, filename = "catalogue") => {
    const columns = [
      { key: "id", label: "ID" },
      { key: "title", label: "Titre" },
      { key: "author", label: "Auteur" },
      { key: "category", label: "Catégorie" },
      { key: "price", label: "Prix (GNF)" },
      { key: "rating", label: "Note" },
      { key: "pages", label: "Pages" },
      { key: "description", label: "Description" },
    ];

    exportToCSV(books, columns, filename);
  }, [exportToCSV]);

  const exportWishlistToText = useCallback((wishlist, format = "text") => {
    const lines = [
      "=== Ma Liste de Souhaits - Librairie YO ===",
      "",
      ...wishlist.map(
        (item, index) =>
          `${index + 1}. ${item.data?.title || item.id}\n   ${item.data?.price?.toLocaleString() || ""} GNF`
      ),
      "",
      `Total: ${wishlist.length} article${wishlist.length !== 1 ? "s" : ""}`,
      "",
      `Date: ${new Date().toLocaleString("fr-FR")}`,
    ];

    const content = lines.join("\n");

    if (format === "json") {
      exportToJSON(wishlist, "favoris");
    } else {
      exportToText(content, "favoris");
    }
  }, [exportToJSON, exportToText]);

  const value = {
    exportToJSON,
    exportToCSV,
    exportToText,
    exportCartToText,
    exportOrderToText,
    exportCatalogToCSV,
    exportWishlistToText,
    formats: EXPORT_FORMATS,
  };

  return (
    <ExportContext.Provider value={value}>
      {children}
    </ExportContext.Provider>
  );
}

export function useExport() {
  const context = useContext(ExportContext);
  if (!context) {
    throw new Error("useExport must be used within ExportProvider");
  }
  return context;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}