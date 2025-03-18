// Default filter values
let discountThreshold = 50;
let conditionFilter = 'all';

// Load saved filter values if available
chrome.storage.local.get(['discountThreshold', 'conditionFilter'], (data) => {
  if (data.discountThreshold) {
    discountThreshold = data.discountThreshold;
    document.getElementById('threshold').value = discountThreshold;
  }

  if (data.conditionFilter) {
    conditionFilter = data.conditionFilter;
    document.getElementById('conditionFilter').value = conditionFilter;
  }
});

// Apply filters button
document.getElementById('applyFilters').addEventListener('click', () => {
  // Get values from form elements
  discountThreshold = parseInt(document.getElementById('threshold').value, 10);
  conditionFilter = document.getElementById('conditionFilter').value;

  // Save filters to storage
  chrome.storage.local.set({
    discountThreshold,
    conditionFilter
  });

  // Reload items with new filters
  loadWishlistItems();
});

// Load and filter wishlist items
function loadWishlistItems() {
  chrome.storage.local.get('wishlistData', (data) => {
    const container = document.getElementById('items-container');
    container.innerHTML = '';

    if (!data.wishlistData || data.wishlistData.length === 0) {
      container.textContent = 'No items found in your wishlist.';
      return;
    }

    // Apply both filters: discount threshold and condition
    const filteredItems = data.wishlistData.filter(item => {
      // First check discount
      const hasValidDiscount = item.discount &&
                              parseInt(item.discount, 10) >= discountThreshold;

      // Then check condition if needed
      const matchesCondition = conditionFilter === 'all' ||
                              item.condition === conditionFilter;

      return hasValidDiscount && matchesCondition;
    });

    if (filteredItems.length === 0) {
      let message = `No items with discount ≥ ${discountThreshold}%`;
      if (conditionFilter !== 'all') {
        message += ` and condition "${conditionFilter}"`;
      }
      message += ' found.';
      container.textContent = message;
      return;
    }

    // Sort by discount (highest first)
    filteredItems.sort((a, b) => parseInt(b.discount, 10) - parseInt(a.discount, 10));

    // Create elements for each item
    filteredItems.forEach(item => {
      const itemElement = document.createElement('div');
      itemElement.className = 'item';

      const titleElement = document.createElement('div');
      titleElement.className = 'title';
      titleElement.textContent = item.title;

      const discountElement = document.createElement('div');
      discountElement.className = 'discount';
      discountElement.textContent = `Discount: ${item.discount}%`;

      const priceElement = document.createElement('div');
      priceElement.textContent = `Price: ${item.price}`;

      const conditionElement = document.createElement('div');
      conditionElement.textContent = `Condition: ${item.condition}`;

      const linkElement = document.createElement('a');
      linkElement.href = item.link;
      linkElement.textContent = 'View on Medimops';
      linkElement.target = '_blank';

      // Add click handler to open the link
      linkElement.addEventListener('click', (e) => {
        chrome.tabs.create({ url: item.link });
        e.preventDefault();
      });

      // Add all elements to the item container
      itemElement.appendChild(titleElement);
      itemElement.appendChild(discountElement);
      itemElement.appendChild(priceElement);
      itemElement.appendChild(conditionElement);
      itemElement.appendChild(linkElement);

      container.appendChild(itemElement);
    });
  });
}

// Load items when popup opens
document.addEventListener('DOMContentLoaded', loadWishlistItems);