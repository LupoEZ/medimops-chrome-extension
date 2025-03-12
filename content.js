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

//go through all notice-list items
async function processNoticeList() {
    console.log("Wishlist processing begins...");

    // Select all notice-list items
    const items = document.querySelectorAll(".notice-list-product__grid");

    for (const item of items) {
        // Get product URL
        const linkElement = item.querySelector(".notice-list-product__image a");
        if (!linkElement) continue;

        const productUrl = "https://www.medimops.de" + linkElement.getAttribute("href");

        // Get current price element (= price best second hand condition or "new")
        const priceElement = item.querySelector(".notice-list-product__price");
        if (!priceElement) continue;

        console.log(`Fetching data for: ${productUrl}`);

        // Fetch original price and discount from the product page
        const productData = await getProductData(productUrl);
        if (!productData) continue;

        const { originalPrice, discount } = productData;

        //TODO: doesn't work correct - should show when no discount data present but doesn't get triggered yet
        if (discount === "N/A") {
            console.log(`No discount data found for: ${productUrl}`);
        }

        // Create and insert the price & discount display
        const infoElement = document.createElement("div");
        infoElement.style.color = "red";
        infoElement.style.fontWeight = "bold";
        infoElement.style.marginTop = "5px";
        infoElement.textContent = `Original: ${originalPrice} (${discount} off)`;

        priceElement.parentNode.appendChild(infoElement);
    }

    console.log("...Wishlist processing ended");

    setupPaginationListener();
}

//fetch product price 'original' (means price for 'New') and discount with best condition (like the one presented by the notice-list)
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
