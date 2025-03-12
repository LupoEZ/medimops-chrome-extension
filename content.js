(async function () {
    // Select all wishlist items
    const items = document.querySelectorAll(".notice-list-product__grid");

    for (const item of items) {
        // Get product URL
        const linkElement = item.querySelector(".notice-list-product__image a");
        if (!linkElement) continue;

        const productUrl = "https://www.medimops.de" + linkElement.getAttribute("href");

        // Get current price
        const priceElement = item.querySelector(".notice-list-product__price");
        if (!priceElement) continue;

        const currentPrice = parseFloat(priceElement.textContent.replace(",", ".").replace("€", "").trim());

        // Fetch the original price from the product page
        const originalPrice = await getOriginalPrice(productUrl);
        if (!originalPrice || originalPrice <= currentPrice) continue;

        // Calculate discount percentage
        const discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);

        // Create and insert the discount display
        const discountElement = document.createElement("span");
        discountElement.style.color = "red";
        discountElement.style.fontWeight = "bold";
        discountElement.style.marginLeft = "10px";
        discountElement.textContent = `(${discount}% off)`;

        priceElement.appendChild(discountElement);
    }
})();

// Function to fetch the original price from the product page
async function getOriginalPrice(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();

        // Create a temporary DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");

        // Find the original price on the product page (adjust this selector!)
        const originalPriceElement = doc.querySelector(".product-detail__original-price"); // Adjust if necessary
        if (!originalPriceElement) return null;

        return parseFloat(originalPriceElement.textContent.replace(",", ".").replace("€", "").trim());
    } catch (error) {
        console.error("Failed to fetch original price:", error);
        return null;
    }
}
