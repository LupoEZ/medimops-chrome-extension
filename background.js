//TODO: Store and retrieve wishlist items using chrome.storage
async function fetchNoticelistData() {
    try {
        const response = await fetch("https://www.medimops.de/MeinMerkzettel/");
        const text = await response.text();

        // Parse the HTML response
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");

        // Extract the JSON data from the script tag
        const scriptTag = doc.querySelector('script[type="application/json"]');
        if (!scriptTag) {
            throw new Error("JSON script tag not found");
        }

        const jsonData = JSON.parse(scriptTag.textContent);
        const products = jsonData.props.pageProps.initialProps.originalServerResponse.data.noticelistProducts;

        // Process and store the wishlist data
        const wishlistData = Object.values(products).map(product => {
            return {
                id: product.id,
                title: product.title,
                link: product.link,
                price: product.variants[0].price,
                discount: product.variants[0].listPriceDiscountPercent
            };
        });

        // Store the data using chrome.storage
        chrome.storage.local.set({ wishlistData }, () => {
            console.log("Wishlist data stored successfully.");
        });
    } catch (error) {
        console.error("Failed to fetch wishlist data:", error);
    }
}

// Call the function when the background script is loaded
fetchNoticelistData();










//TODO: Use chrome.alarms to check prices at intervals
//TODO: Send a chrome.notifications alert if a discount is found

