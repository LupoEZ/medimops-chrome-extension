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

        if (discount === "N/A") {
            console.warn(`No discount data found for: ${productUrl}`);
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
}


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