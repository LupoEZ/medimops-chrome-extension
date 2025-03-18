//TODO: Store and retrieve wishlist items using chrome.storage
async function fetchAllNoticelistData() {
    try {
        // Step 1: Fetch first page to determine pagination
        const firstPageData = await fetchPageData("https://www.medimops.de/MeinMerkzettel/");

        // Extract products from first page
        let allProducts = {...firstPageData.content.noticelistProducts};

        // Get pagination links
        const paginationLinks = firstPageData.content.pagination;
        console.log(`Found ${paginationLinks.length} pagination links`);

        // Step 2: Create requests for all other pages in parallel
        const pagePromises = [];

        for (let i = 1; i < paginationLinks.length; i++) {
            const pageLink = paginationLinks[i];
            if (typeof pageLink === 'string') {
                pagePromises.push(fetchPageData(pageLink));
            }
        }

        // Wait for all page requests to complete
        const pagesData = await Promise.all(pagePromises);

        // Step 3: Merge all product data
        for (const pageData of pagesData) {
            const pageProducts = pageData.content.noticelistProducts;
            allProducts = {...allProducts, ...pageProducts};
        }

        console.log(`Total products collected: ${Object.keys(allProducts).length}`);
        console.log("All products:", allProducts);

        // Process and store all wishlist data
        const wishlistData = Object.values(allProducts).map(product => {
            // Handle cases where product might not have variants
            const hasVariants = product.variants && product.variants.length > 0;

            return {
                id: product.id,
                title: product.title,
                link: product.link,
                available: hasVariants,
                price: hasVariants ? product.variants[0].price : null,
                condition: hasVariants ? product.variants[0].condition : null,
                discount: hasVariants ? product.variants[0].listPriceDiscountPercent : null
            };
        });

        // Store the data using chrome.storage
        chrome.storage.local.set({ wishlistData }, () => {
            console.log("Complete wishlist data stored successfully.");
        });

    } catch (error) {
        console.error("Failed to fetch complete wishlist data:", error);
    }
}

// Helper function to fetch and parse data from a single page
async function fetchPageData(url) {
    console.log(`Fetching data from: ${url}`);

    const response = await fetch(url, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const text = await response.text();

    // Find the JSON data in the Next.js data script
    const scriptTagRegex = /<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i;
    const match = text.match(scriptTagRegex);

    if (!match || !match[1]) {
        throw new Error(`JSON script tag not found on page: ${url}`);
    }

    const jsonContent = match[1].trim();
    const jsonData = JSON.parse(jsonContent);

    return jsonData.props.pageProps.initialProps.originalServerResponse.data;
}

// Call the function when the background script is loaded
fetchAllNoticelistData();










//TODO: Use chrome.alarms to check prices at intervals
//TODO: Send a chrome.notifications alert if a discount is found

