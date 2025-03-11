// Function to add delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to fetch and cache original price
async function getOriginalPrice(url) {
    try {
        // Check cache first
        const cachedData = localStorage.getItem(url);
        if (cachedData) {
            console.log(`Using cached data for: ${url}`);
            return JSON.parse(cachedData);
        }

        console.log(`Fetching price data from: ${url}`);

        // Fetch page content
        const response = await fetch(url);
        const text = await response.text();

        // Create a temporary DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");

        // Find the element containing original price and discount
        const savingsElement = doc.querySelector(".PriceBox_savings__F5rxd");
        if (!savingsElement) return null;

        // Extract the original price (first <span> inside savingsElement)
        const priceSpan = savingsElement.querySelector("span");
        if (!priceSpan) return null;

        const originalPrice = priceSpan.textContent.trim(); // Example: "5,98 €"

        // Extract discount percentage (last parentheses in the text)
        const discountMatch = savingsElement.textContent.match(/\((\d+)%\)/);
        const discount = discountMatch ? discountMatch[1] + "%" : "N/A";

        const priceData = { originalPrice, discount };

        // Cache data in localStorage for 10 minutes
        localStorage.setItem(url, JSON.stringify(priceData));
        setTimeout(() => localStorage.removeItem(url), 10 * 60 * 1000);

        return priceData;
    } catch (error) {
        console.error("Failed to fetch original price:", error);
        return null;
    }
}

// Function to update wishlist items
async function updateWishlist() {
    console.log("Updating wishlist...");

    const items = document.querySelectorAll(".notice-list-product__grid");
    console.log(`Found ${items.length} wishlist items.`);

    for (const item of items) {
        if (item.querySelector(".custom-discount-info")) {
            console.log("Skipping already processed item.");
            continue;
        }

        const linkElement = item.querySelector(".notice-list-product__image a");
        if (!linkElement) continue;

        const productUrl = "https://www.medimops.de" + linkElement.getAttribute("href");

        const priceElement = item.querySelector(".notice-list-product__price");
        if (!priceElement) continue;

        const productData = await getOriginalPrice(productUrl);
        if (!productData) continue;

        const { originalPrice, discount } = productData;

        const infoElement = document.createElement("div");
        infoElement.classList.add("custom-discount-info");
        infoElement.style.color = "red";
        infoElement.style.fontWeight = "bold";
        infoElement.style.marginTop = "5px";
        infoElement.textContent = `Original: ${originalPrice} (${discount} off)`;

        priceElement.parentNode.appendChild(infoElement);

        // Add a delay before the next request
        await delay(1000);
    }
}

// MutationObserver to detect changes in the wishlist
const observer = new MutationObserver(() => {
    console.log("Mutation detected, updating wishlist...");
    updateWishlist();
});

observer.observe(document.body, { childList: true, subtree: true });

// Run once initially
updateWishlist();
