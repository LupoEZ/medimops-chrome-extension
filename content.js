// Event listener for pagination
function setupPaginationListener() {
    const paginationContainer = document.querySelector(".pagination");
    if (!paginationContainer) return;

    // Ensure the listener is added after reloading but only once
    paginationContainer.removeEventListener("click", handlePaginationClick);
    paginationContainer.addEventListener("click", handlePaginationClick);
    console.log("Pagination listener added");
}

// Function that is called when a pagination button is clicked
function handlePaginationClick(event) {
    // Check if a pagination button was clicked
    if (event.target.classList.contains("pagination__item")) {
        console.log("Pagination button clicked. Waiting for new items to load...");

        // Wait a short moment before reprocessing the wishlist (to ensure new content is loaded)
        setTimeout(() => {
            console.log("Reprocessing wishlist after pagination change...");
            processNoticeList();
        }, 1000); // Delay to allow page update
    }
}

// Define a map for conditions and their corresponding colors
const conditionColors = new Map([
    ["Neu", "#28a745"],
    ["Gebraucht - Wie neu", "#7cc576"],
    ["Gebraucht - Sehr gut", "#007bff"],
    ["Gebraucht - Gut", "#ff9800"],
    ["Gebraucht - Akzeptabel", "#823303"]
]);

// Replace getProductData with this function that uses stored data
async function getProductDataFromStorage(productId) {
    try {
        // Get stored wishlist data
        const { wishlistData } = await chrome.storage.local.get('wishlistData');

        if (!wishlistData) {
            console.log("No wishlist data found in storage");
            return null;
        }

        // Find the product with matching ID
        const product = wishlistData.find(item => item.id === productId);

        if (!product) {
            console.log(`Product with ID ${productId} not found in storage`);
            return null;
        }

        // Calculate discount info
        const originalPrice = product.price ? product.listPrice + " €" : "N/A";
        const discount = product.discount ? product.discount + "%" : "N/A";
        const title = product.title ? product.title : "N/A";

        return { originalPrice, discount, title };
    } catch (error) {
        console.error("Error getting product data from storage:", error);
        return null;
    }
}

// Updated processNoticeList function
async function processNoticeList() {
    console.log("Wishlist processing begins...");

    // Select all notice-list items
    const items = document.querySelectorAll(".notice-list-product__grid");

    for (const item of items) {
        // Get product URL
        const linkElement = item.querySelector(".notice-list-product__image a");
        if (!linkElement) {
            console.log("Item skipped: No link element found");
            continue;
        }

        const productUrl = linkElement.getAttribute("href");

        // Extract product ID from URL
        const productIdMatch = productUrl.match(/M0([0-9A-Za-z]+)\.html$/); //matches ID's with digits and letters
        if (!productIdMatch) {
            console.log("Item skipped: No product ID matched");
            continue;
        }

        const productId = "M0" + productIdMatch[1];

        // Get current price element
        const priceElement = item.querySelector(".notice-list-product__price");
        if (!priceElement) {
            console.log("Item skipped: No price element found");
            continue;
        }

        // Get condition of the book
        const conditionElement = item.querySelector(".notice-list-product__condition");
        if (conditionElement) {
            const condition = conditionElement.textContent.trim();
            conditionElement.style.color = conditionColors.get(condition) || "black";
        }
        if (conditionElement.textContent.trim() === "Neu") {
            console.log("Item skipped: Condition is 'Neu'");
            continue;
        }



        // Get product data from storage
        const productData = await getProductDataFromStorage(productId);
        if (!productData) continue;
        const { originalPrice, discount, title } = productData;

        if (originalPrice === "null €") {
            console.log("Item skipped: No original price found");
            continue
        }

        console.log(`Item-Data processed for: ${productId} (${title})`);

        // Create and insert the price & discount display
        const infoElement = document.createElement("div");
        infoElement.style.color = "red";
        infoElement.style.fontWeight = "bold";
        infoElement.style.marginTop = "10px";
        infoElement.style.display = "inline-block";
        infoElement.style.textAlign = "right";
        infoElement.textContent = `Original-Preis: ${originalPrice} (${discount} günstiger)`;

        // Get the parent container for pricing
        const pricingContainer = priceElement.closest(".notice-list-product__pricing");

        // Add the infoElement to the grid in the new "info" column
        item.style.gridTemplateColumns = "90px auto auto 200px"; // Update grid layout
        item.style.gridTemplateAreas = '"image description info pricing" "image buttons buttons buttons" "line line line line"'; // Define areas

        // Insert the info element at the beginning of the pricing container
        pricingContainer.parentNode.insertBefore(infoElement, pricingContainer);
    }

    console.log("...Wishlist processing ended");

    setupPaginationListener();
}

//Fallback function to fetch the original price and discount directly from the product page
async function getProductData(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();

        // Create a temporary DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");

        // Find the element containing the data
        const savingsElement = doc.querySelector(".PriceBox_savings__F5rxd");
        if (!savingsElement) return null;

        // Extract the original price (first <span> inside savingsElement)
        const priceSpan = savingsElement.querySelector("span");
        if (!priceSpan) return null;

        const originalPrice = priceSpan.textContent.trim(); // Example: "5,98 €"

        // Extract discount percentage (last parentheses in the text)
        const discountMatch = savingsElement.textContent.match(/\((\d+)%\)/);
        const discount = discountMatch ? discountMatch[1] + "%" : "N/A";

        return { originalPrice, discount };
    } catch (error) {
        console.error("Failed to fetch original price:", error);
        return null;
    }
}


processNoticeList();
//TODO: Extension Button to manually deactivate and activate the Extension