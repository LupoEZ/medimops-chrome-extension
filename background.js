//TODO: Store and retrieve wishlist items using chrome.storage
// async function fetchNoticelistData() {
//     try {
//         const response = await fetch("https://www.medimops.de/MeinMerkzettel/", {
//             credentials: 'include',
//         });
//         const text = await response.text();
//         console.log("Response status:", response.status);
//         console.log("Response text first 500 chars:", text.substring(0, 500));
//
//         console.log("Contains any script tags:", text.includes("<script"));
//
//         // Use regex to extract JSON data from script tags
//         const scriptTagRegex = /<script\s+type="application\/json"[^>]*>([\s\S]*?)<\/script>/i;
//         const match = text.match(scriptTagRegex);
//         if (!match || !match[1]) {
//             throw new Error("JSON script tag not found");
//         }
//
//         const jsonContent = match[1].trim();
//         const jsonData = JSON.parse(jsonContent);
//         const products = jsonData.props.pageProps.initialProps.originalServerResponse.data.noticelistProducts;
//
//         // Process and store the wishlist data
//         const wishlistData = Object.values(products).map(product => {
//             return {
//                 id: product.id,
//                 title: product.title,
//                 link: product.link,
//                 price: product.variants[0].price,
//                 discount: product.variants[0].listPriceDiscountPercent
//             };
//         });
//
//         // Store the data using chrome.storage
//         chrome.storage.local.set({ wishlistData }, () => {
//             console.log("Wishlist data stored successfully.");
//         });
//     } catch (error) {
//         console.error("Failed to fetch wishlist data:", error);
//     }
// }

async function fetchNoticelistData() {
    try {
        const response = await fetch("https://www.medimops.de/MeinMerkzettel/", {
            credentials: 'include',
        });
        const text = await response.text();
        console.log("Response status:", response.status);

        // Log script tags to find where the data might be
        const scriptTags = text.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [];
        console.log(`Found ${scriptTags.length} script tags`);

        // Look for script tags with JSON data
        let jsonData = null;
        for (let i = 0; i < scriptTags.length; i++) {
            const script = scriptTags[i];
            // Look for likely candidates - script tags with product data
            if (script.includes('noticelistProducts') ||
                script.includes('wishlist') ||
                script.includes('pageProps') ||
                script.includes('__NEXT_DATA__')) {

                console.log(`Found candidate script tag #${i}:`, script.substring(0, 100));

                try {
                    // Try to extract JSON content from various formats
                    let content = script;
                    // Remove the script tags
                    content = content.replace(/<script[^>]*>/, '').replace(/<\/script>$/, '').trim();

                    // Parse the JSON
                    const data = JSON.parse(content);
                    console.log("Successfully parsed JSON from script tag #" + i);
                    jsonData = data;
                    break;
                } catch (e) {
                    console.log(`Failed to parse script tag #${i}:`, e.message);
                }
            }
        }

        if (!jsonData) {
            // Next.js typically uses __NEXT_DATA__ script
            const nextDataMatch = text.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
            if (nextDataMatch && nextDataMatch[1]) {
                try {
                    jsonData = JSON.parse(nextDataMatch[1].trim());
                    console.log("Found data in __NEXT_DATA__ script");
                } catch (e) {
                    console.log("Failed to parse __NEXT_DATA__:", e.message);
                }
            }
        }

        if (!jsonData) {
            throw new Error("Could not find wishlist data in any script tag");
        }

        // Try to navigate the data structure to find products
        console.log("JSON data structure:", Object.keys(jsonData));

        // Extract products based on the found structure
        let products = null;

        if (jsonData.props?.pageProps?.initialProps?.originalServerResponse?.data?.noticelistProducts) {
            products = jsonData.props.pageProps.initialProps.originalServerResponse.data.noticelistProducts;
        }

        if (!products) {
            throw new Error("Products not found in JSON data");
        }

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

