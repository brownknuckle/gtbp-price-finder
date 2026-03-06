// GA4 event tracking — replace G-XXXXXXXXXX in index.html to activate

declare function gtag(...args: any[]): void;

function track(eventName: string, params?: Record<string, any>) {
  try {
    if (typeof gtag !== "undefined") {
      gtag("event", eventName, params);
    }
  } catch {
    // gtag not loaded — silently skip
  }
}

export const analytics = {
  search(productName: string) {
    track("search", { search_term: productName });
  },

  viewResults(productName: string, resultCount: number) {
    track("view_item_list", {
      item_list_name: productName,
      items: [{ item_name: productName }],
      result_count: resultCount,
    });
  },

  clickBuy(retailer: string, productName: string, price: number) {
    track("select_item", {
      item_list_name: productName,
      items: [{
        item_name: productName,
        item_brand: retailer,
        price,
        currency: "GBP",
      }],
    });
  },

  addWatchlist(productName: string) {
    track("add_to_wishlist", {
      items: [{ item_name: productName }],
    });
  },
};
