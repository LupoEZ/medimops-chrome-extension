// Listen for extension installation or update
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed or updated");
    fetchAllNoticelistData();

    // Set up alarm for periodic checking
    chrome.alarms.create("checkWishlist", { periodInMinutes: 60 });
});

// Listen for browser startup
chrome.runtime.onStartup.addListener(() => {
    console.log("Browser started");
    fetchAllNoticelistData();
});

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "checkWishlist") {
        console.log("Checking wishlist for updates");
        fetchAllNoticelistData();
    }
});

// Listen for notification click
chrome.notifications.onClicked.addListener((notificationId) => {
    chrome.action.openPopup(); // Open the popup when notification is clicked
});

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

        // Get previously stored data for comparison
        const { wishlistData: previousData } = await chrome.storage.local.get('wishlistData');

        // Get user preferences for notifications
        const { discountThreshold = 50, conditionFilter = 'all' } =
            await chrome.storage.local.get(['discountThreshold', 'conditionFilter']);

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

        // Find items with significant discount changes
        const notifyItems = findSignificantDiscountChanges(previousData, wishlistData, discountThreshold, conditionFilter);

        // Send notifications if needed
        if (notifyItems.length > 0) {
            sendNotifications(notifyItems);
        }

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

function findSignificantDiscountChanges(oldData, newData, discountThreshold, conditionFilter) {
    if (!oldData) return []; // No previous data to compare

    const notifyItems = [];
    const oldItemMap = new Map(oldData.map(item => [item.id, item]));

    for (const newItem of newData) {
        const oldItem = oldItemMap.get(newItem.id);

        // Skip if item doesn't meet filter conditions
        if (conditionFilter !== 'all' && newItem.condition !== conditionFilter) {
            continue;
        }

        // Conditions for notification:
        // 1. The item exists in both old and new data
        // 2. The new discount meets or exceeds threshold
        // 3. The discount has increased from below threshold to above threshold
        if (oldItem &&
            newItem.discount && parseInt(newItem.discount, 10) >= discountThreshold &&
            (!oldItem.discount || parseInt(oldItem.discount, 10) < discountThreshold)) {

            notifyItems.push({
                ...newItem,
                oldDiscount: oldItem.discount || '0'
            });
        }
    }

    return notifyItems;
}

function sendNotifications(items) {
    if (items.length === 0) return;

    // For a single item
    if (items.length === 1) {
        const item = items[0];
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'images/icon48.png', // Update path to match your manifest
            title: 'Neuer Rabatt!',
            message: `"${item.title}" ist jetzt mit ${item.discount}% Rabatt verfügbar! (vorher: ${item.oldDiscount}%)`,
            priority: 2
        });
        return;
    }

    // For multiple items (up to 3 titles shown explicitly)
    const itemTitles = items.map(item => `"${item.title}" (${item.discount}%)`);
    let message = '';

    message = "Neue Rabbate verfügbar für:\n" + itemTitles.join('\n');

    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon48.png', // Update path to match your manifest
        title: 'Neue Rabatte!',
        message: message,
        priority: 2
    });
}


// // Call the function when the background script is loaded
// // fetchAllNoticelistData();
