// Game state - Currency in D&D system (1 gold = 10 silver = 100 copper)
let playerCurrency = {
    gold: 0,
    silver: 0,
    copper: 0
};
let currentItem = null;
let currentShop = 'weapons';
let purchasedItems = [];
let soldItems = [];
let startingCurrency = { gold: 0, silver: 0, copper: 0 };


// Function to extract Sheet ID from Google Sheets URL
function extractSheetId(url) {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Function to initialize Google Sheets URLs with provided Sheet ID
function initializeGoogleSheetsUrls(sheetId) {
    if (!sheetId) return false;
    
    window.SHEET_ID = sheetId;
    window.ITEMS_SHEET_URL = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=Items&tqx=out:json`;
    window.STORES_SHEET_URL = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=Stores&tqx=out:json`;
    window.SITE_CONFIG_SHEET_URL = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=SiteConfig&tqx=out:json`;
    
    return true;
}

let shopData = {}; // Will be populated from Google Sheets
let storeItems = {}; // Will be populated from Google Sheets
let siteConfig = {
    site_title: "Default Market",
    site_subtitle: "Website for D&D player to shop in game ! "
};

// Parse site configuration from Google Sheets
function parseSiteConfig(jsonData) {
    const config = {};
    const rows = jsonData.table.rows;
    
    rows.forEach(row => {
        if (!row.c || !row.c[0] || !row.c[1]) return;
        
        const setting = row.c[0]?.v;
        const value = row.c[1]?.v;
        
        if (setting && value) {
            config[setting] = value;
        }
    });
    
    return config;
}

// Load site configuration from Google Sheets
async function loadSiteConfig() {
    try {
        const response = await fetch(SITE_CONFIG_SHEET_URL);
        const text = await response.text();
        const jsonData = JSON.parse(text.substr(47).slice(0, -2));
        const loadedConfig = parseSiteConfig(jsonData);
        
        // Update siteConfig with loaded values
        if (loadedConfig.site_title) siteConfig.site_title = loadedConfig.site_title;
        if (loadedConfig.site_subtitle) siteConfig.site_subtitle = loadedConfig.site_subtitle;
        
        console.log('Site config loaded from Google Sheets');
        updateSiteHeader();
    } catch (error) {
        console.error('Failed to load site config:', error);
        updateSiteHeader(); // Use defaults
    }
}

// Update the site header with loaded config
function updateSiteHeader() {
    document.querySelector('header h1').textContent = siteConfig.site_title;
    document.querySelector('header .subtitle').textContent = siteConfig.site_subtitle;
}

// Parse store configuration with enabled filter
function parseStoreData(jsonData) {
    const stores = {};
    const rows = jsonData.table.rows;
    
    rows.forEach(row => {
        if (!row.c || !row.c[0] || !row.c[1]) return;
        
        const shop = row.c[0]?.v;
        const title = row.c[1]?.v;
        const description = row.c[2]?.v || '';
        const enabled = row.c[3]?.v;
        
        if (!shop || !title) return;
        
        // Only include enabled stores
        if (enabled === true || enabled === 'TRUE' || enabled === 'true') {
            stores[shop] = {
                title: title,
                description: description
            };
        }
    });
    
    return stores;
}

// Parse items with enabled filter
function parseSheetData(jsonData) {
    const items = {};
    const rows = jsonData.table.rows;
    
    rows.forEach(row => {
        if (!row.c || !row.c[1]) return;
        
        const shop = row.c[1]?.v;
        const name = row.c[2]?.v;
        const gold = row.c[3]?.v || 0;
        const silver = row.c[4]?.v || 0;
        const copper = row.c[5]?.v || 0;
        const rarity = row.c[6]?.v || 'common';
        const preview = row.c[7]?.v || '';
        const description = row.c[8]?.v || '';
        const stats = row.c[9]?.v || '';
        const enabled = row.c[10]?.v;
        
        if (!shop || !name) return;
        
        // Only include enabled items
        if (enabled === true || enabled === 'TRUE' || enabled === 'true') {
            if (!items[shop]) {
                items[shop] = [];
            }
            
            items[shop].push({
                name,
                price: { gold, silver, copper },
                rarity,
                preview,
                description,
                stats
            });
        }
    });
    
    return items;
}

// Load store configuration from Google Sheets
async function loadStoreConfig() {
    try {
        const response = await fetch(STORES_SHEET_URL);
        const text = await response.text();
        const jsonData = JSON.parse(text.substr(47).slice(0, -2));
        shopData = parseStoreData(jsonData);
        console.log('Store config loaded from Google Sheets');
    } catch (error) {
        console.error('Failed to load store config:', error);
        loadBackupStores();
    }
}

// Load items from Google Sheets
async function loadStoreItems() {
    try {
        const response = await fetch(ITEMS_SHEET_URL);
        const text = await response.text();
        const jsonData = JSON.parse(text.substr(47).slice(0, -2));
        storeItems = parseSheetData(jsonData);
        console.log('Items loaded from Google Sheets');
    } catch (error) {
        console.error('Failed to load from Google Sheets:', error);
        loadBackupItems();
    }
}

// Backup store configuration
function loadBackupStores() {
    shopData = {
        weapons: {
        title: "Weapon Shop",
        description: "Fine blades and ranged weapons for the discerning adventurer"
        },
        armory: {
        title: "Armory",
        description: "Protective gear and shields to keep you safe in battle"
        },
        magic: {
            title: "Magic Shop",
            description: "Mystical artifacts and enchanted items of great power"
        },
         apothecary: {
        title: "Apothecary",
        description: "Healing potions and remedies for what ails you"
    },
        };
}

// Backup items (fallback data)
function loadBackupItems() {
    storeItems = {
        weapons: [
        {
            name: "Longsword +1",
            price: { gold: 15, silver: 0, copper: 0 },
            rarity: "uncommon",
            preview: "A finely crafted blade that gleams with magical enhancement.",
            description: "This longsword is magically enhanced, granting a +1 bonus to attack and damage rolls. Ancient runes along the fuller glow faintly blue when drawn in anger.",
            stats: "Damage: 1d8 + 1 slashing<br>Properties: Versatile (1d10), Magical<br>Weight: 3 lbs"
        },
        {
            name: "Shortbow",
            price: { gold: 25, silver: 0, copper: 0 },
            rarity: "common",
            preview: "A simple yet reliable ranged weapon.",
            description: "Made from seasoned yew, this shortbow is perfect for hunters and scouts. Offers excellent accuracy at short to medium range.",
            stats: "Damage: 1d6 piercing<br>Properties: Ammunition (range 80/320), Two-handed<br>Weight: 2 lbs"
        },
        {
            name: "Battleaxe",
            price: { gold: 10, silver: 0, copper: 0 },
            rarity: "common",
            preview: "A heavy axe designed for combat.",
            description: "A sturdy steel-headed axe mounted on a hickory handle. Its weight and balance make it effective in the hands of a skilled warrior.",
            stats: "Damage: 1d8 slashing<br>Properties: Versatile (1d10)<br>Weight: 4 lbs"
        }
    ],
    armory: [
        {
            name: "Chainmail Armor",
            price: { gold: 75, silver: 0, copper: 0 },
            rarity: "uncommon",
            preview: "Interlocking metal rings provide flexible protection.",
            description: "Consists of thousands of interlocking metal rings. Provides AC 16, but imposes disadvantage on Stealth checks. Requires Strength 13 to wear.",
            stats: "AC: 16<br>Stealth: Disadvantage<br>Weight: 55 lbs<br>Strength Requirement: 13"
        },
        {
            name: "Shield +1",
            price: { gold: 150, silver: 0, copper: 0 },
            rarity: "uncommon",
            preview: "A reinforced shield with magical enhancements.",
            description: "A steel shield magically enhanced to give +1 bonus to AC. Can be wielded alongside other armor for additional protection.",
            stats: "AC Bonus: +3 (includes +1 enhancement)<br>Weight: 6 lbs<br>Properties: Magical<br>Requires Attunement"
        },
        {
            name: "Leather Armor",
            price: { gold: 10, silver: 0, copper: 0 },
            rarity: "common",
            preview: "Supple leather crafted into protective gear.",
            description: "Basic armor made of hardened leather. Provides protection while allowing agility.",
            stats: "AC: 11 + Dex modifier<br>Weight: 10 lbs<br>No Stealth penalty"
        }
    ],
    magic: [
       {
            name: "Ring of Protection",
            price: { gold: 200, silver: 0, copper: 0 },
            rarity: "rare",
            preview: "A silver band inscribed with protective wards.",
            description: "Grants +1 bonus to AC and saving throws while worn. Requires attunement.",
            stats: "AC Bonus: +1<br>Saving Throw Bonus: +1<br>Attunement: Required<br>Slot: Ring"
        },
        {
            name: "Staff of Fireballs",
            price: { gold: 1500, silver: 0, copper: 0 },
            rarity: "very rare",
            preview: "An ornate staff crackling with fire.",
            description: "This staff holds 7 charges. Can cast Fireball (3rd level) using 1 charge. Regains 1d6+1 charges daily at dawn. Requires attunement by a spellcaster.",
            stats: "Charges: 7 (regains 1d6+1 at dawn)<br>Spell: Fireball (3rd level, 1 charge)<br>Save DC: 15<br>Attunement: Spellcaster"
        },
        {
            name: "Wand of Magic Missiles",
            price: { gold: 500, silver: 0, copper: 0 },
            rarity: "uncommon",
            preview: "A slender wand humming with arcane energy.",
            description: "A wand that launches Magic Missile spells. Holds 7 charges, regains 1d6+1 at dawn. Requires attunement.",
            stats: "Charges: 7 (regains 1d6+1 at dawn)<br>Spell: Magic Missile (1st level, 1 charge)<br>Range: 120 ft.<br>Attunement: Required"
        }
    
    ],
    apothecary: [
         {
            name: "Potion of Healing",
            price: { gold: 50, silver: 0, copper: 0 },
            rarity: "common",
            preview: "A crimson liquid that sparkles with restorative magic.",
            description: "Restores 2d4+2 hit points when consumed.",
            stats: "Effect: Restore 2d4 + 2 HP<br>Duration: Instantaneous<br>Rarity: Common"
        },
        {
            name: "Potion of Greater Healing",
            price: { gold: 150, silver: 0, copper: 0 },
            rarity: "uncommon",
            preview: "A more potent healing draught with golden flecks.",
            description: "Restores 4d4+4 hit points when consumed.",
            stats: "Effect: Restore 4d4 + 4 HP<br>Duration: Instantaneous<br>Rarity: Uncommon"
        },
        {
            name: "Antitoxin",
            price: { gold: 50, silver: 0, copper: 0 },
            rarity: "common",
            preview: "A clear liquid that neutralizes poison.",
            description: "Grants advantage on saving throws against poison for 1 hour.",
            stats: "Effect: Advantage on saves vs poison<br>Duration: 1 hour<br>Type: Consumable"
        }
    ],
      
    };
}

// Generate navigation buttons from store config
function generateNavigation() {
    const nav = document.querySelector('.shop-navigation');
    nav.innerHTML = '';
    
    let isFirst = true;
    for (const [shopKey, shopInfo] of Object.entries(shopData)) {
        const button = document.createElement('button');
        button.className = isFirst ? 'nav-btn active' : 'nav-btn';
        button.setAttribute('data-shop', shopKey);
        button.textContent = shopInfo.title;
        button.onclick = () => switchShop(shopKey);
        
        nav.appendChild(button);
        
        if (isFirst) {
            currentShop = shopKey;
            isFirst = false;
        }
    }
}

// Currency conversion functions
function convertToCopper(currency) {
    return currency.gold * 100 + currency.silver * 10 + currency.copper;
}

function convertFromCopper(totalCopper) {
    const gold = Math.floor(totalCopper / 100);
    const silver = Math.floor((totalCopper % 100) / 10);
    const copper = totalCopper % 10;
    return { gold, silver, copper };
}

function formatPrice(price) {
    const parts = [];
    if (price.gold > 0) parts.push(`${price.gold} gold`);
    if (price.silver > 0) parts.push(`${price.silver} silver`);
    if (price.copper > 0) parts.push(`${price.copper} copper`);
    return parts.join(', ') || '0 copper';
}

function canAfford(price) {
    const playerTotal = convertToCopper(playerCurrency);
    const priceTotal = convertToCopper(price);
    return playerTotal >= priceTotal;
}

function calculateChange(price) {
    const playerTotal = convertToCopper(playerCurrency);
    const priceTotal = convertToCopper(price);
    
    if (playerTotal < priceTotal) {
        return null;
    }
    
    const changeInCopper = playerTotal - priceTotal;
    return convertFromCopper(changeInCopper);
}

// Shop navigation
function switchShop(shopType) {
    currentShop = shopType;
    
    // Update active navigation button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-shop="${shopType}"]`).classList.add('active');
    
    // Update shop header
    document.getElementById('shop-title').textContent = shopData[shopType].title;
    document.getElementById('shop-description').textContent = shopData[shopType].description;
    
    // Reload store items
    initializeStore();
}

// Initialize store
async function initializeStore() {
    // Ensure items are loaded
    if (Object.keys(storeItems).length === 0) {
        await loadStoreItems();
    }
    
    const storeGrid = document.getElementById('store-grid');
    storeGrid.innerHTML = '';

    const items = storeItems[currentShop] || [];
    
    items.forEach((item, index) => {
        const itemCard = createItemCard(item, index);
        storeGrid.appendChild(itemCard);
    });

    updateCurrencyDisplay();
}

// Create item card
function createItemCard(item, index) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.onclick = () => openModal(item);

    card.innerHTML = `
        <div class="item-name">${item.name}</div>
        <div class="item-price">${formatPrice(item.price)}</div>
        <div class="item-rarity ${item.rarity}">${item.rarity.toUpperCase()}</div>
        <div class="item-preview">${item.preview}</div>
    `;

    return card;
}

// Modal scroll indicator management
function updateScrollIndicators(modalElement) {
    const isScrollable = modalElement.scrollHeight > modalElement.clientHeight;
    const isScrolledDown = modalElement.scrollTop > 20;
    const isScrolledToBottom = modalElement.scrollTop + modalElement.clientHeight >= modalElement.scrollHeight - 20;
    
    modalElement.classList.toggle('scrollable', isScrollable && !isScrolledToBottom);
    modalElement.classList.toggle('scrolled-down', isScrolledDown);
    modalElement.classList.toggle('scrolled-bottom', isScrolledToBottom);
}

// Modal functions
function openModal(item) {
    currentItem = item;
    
    document.getElementById('modal-title').textContent = item.name;
    document.getElementById('modal-price').innerHTML = `${formatPrice(item.price)}`;
    document.getElementById('modal-rarity').textContent = item.rarity.toUpperCase();
    document.getElementById('modal-rarity').className = `item-rarity ${item.rarity}`;
    document.getElementById('modal-description').textContent = item.description;
    document.getElementById('modal-stats').innerHTML = `
        <div class="stats-title">Item Statistics</div>
        ${item.stats}
    `;

    updatePaymentSection(item);

    const modal = document.getElementById('item-modal');
    modal.style.display = 'block';
    
    const modalContent = modal.querySelector('.modal-content');
    setTimeout(() => {
        updateScrollIndicators(modalContent);
        modalContent.addEventListener('scroll', () => updateScrollIndicators(modalContent));
    }, 100);
}

function updatePaymentSection(item) {
    const priceBreakdown = document.getElementById('price-breakdown');
    const changeCalculator = document.getElementById('change-calculator');
    const buyButton = document.getElementById('buy-button');
    
    let breakdown = '<div class="price-line"><span>Item Price:</span><span>' + formatPrice(item.price) + '</span></div>';
    breakdown += '<div class="price-line"><span>Your Currency:</span><span>' + formatPrice(playerCurrency) + '</span></div>';
    breakdown += '<div class="price-line total"><span>Total Cost:</span><span>' + formatPrice(item.price) + '</span></div>';
    
    if (canAfford(item.price)) {
        const change = calculateChange(item.price);
        if (change.gold > 0 || change.silver > 0 || change.copper > 0) {
            changeCalculator.style.display = 'block';
            document.getElementById('change-display').innerHTML = `
                <div class="change-line">Gold: ${change.gold}</div>
                <div class="change-line">Silver: ${change.silver}</div>
                <div class="change-line">Copper: ${change.copper}</div>
            `;
        } else {
            changeCalculator.style.display = 'block';
            document.getElementById('change-display').innerHTML = '<div class="change-line">Exact change - no change needed!</div>';
        }
        
        buyButton.disabled = false;
        buyButton.textContent = `Purchase for ${formatPrice(item.price)}`;
    } else {
        changeCalculator.style.display = 'block';
        const needed = convertToCopper(item.price) - convertToCopper(playerCurrency);
        const neededCurrency = convertFromCopper(needed);
        
        document.getElementById('change-display').innerHTML = `
            <div class="insufficient-funds">
                Insufficient funds! You need ${formatPrice(neededCurrency)} more.
            </div>
        `;
        
        buyButton.disabled = true;
        buyButton.textContent = 'Insufficient funds';
    }
    
    priceBreakdown.innerHTML = breakdown;
}

function closeModal() {
    document.getElementById('item-modal').style.display = 'none';
    currentItem = null;
}

// Purchase function
function purchaseItem() {
    if (!currentItem || !canAfford(currentItem.price)) {
        showNotification('Insufficient funds!', 'error');
        return;
    }

    purchasedItems.push({
        name: currentItem.name,
        price: { ...currentItem.price }
    });

    const playerTotal = convertToCopper(playerCurrency);
    const priceTotal = convertToCopper(currentItem.price);
    const newTotal = playerTotal - priceTotal;
    playerCurrency = convertFromCopper(newTotal);
    
    updateCurrencyDisplay();
    showNotification(`Successfully purchased ${currentItem.name}!`, 'success');
    closeModal();
}

// Sell item functions
function openSellModal() {
    const modal = document.createElement('div');
    modal.id = 'sell-modal';
    modal.className = 'modal';
    modal.style.display = 'block';
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeSellModal()">&times;</span>
            <div class="modal-header">
                <h2 class="modal-title">Sell Item</h2>
            </div>
            <div class="modal-description">
                What would you like to sell?
            </div>
            <div class="sell-input-group">
                <label for="sell-item-name">Item Name:</label>
                <input type="text" id="sell-item-name" class="sell-input" placeholder="Enter item name">
            </div>
            <div class="currency-input-section">
                <div class="currency-input-group">
                    <label for="sell-gold">Gold Received:</label>
                    <input type="number" id="sell-gold" min="0" value="0" class="currency-input">
                </div>
                <div class="currency-input-group">
                    <label for="sell-silver">Silver Received:</label>
                    <input type="number" id="sell-silver" min="0" value="0" class="currency-input">
                </div>
                <div class="currency-input-group">
                    <label for="sell-copper">Copper Received:</label>
                    <input type="number" id="sell-copper" min="0" value="0" class="currency-input">
                </div>
            </div>
            <button class="buy-btn" onclick="sellItem()">Sell Item</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeSellModal() {
    const modal = document.getElementById('sell-modal');
    if (modal) {
        modal.remove();
    }
}

function sellItem() {
    const itemName = document.getElementById('sell-item-name').value.trim();
    const gold = parseInt(document.getElementById('sell-gold').value) || 0;
    const silver = parseInt(document.getElementById('sell-silver').value) || 0;
    const copper = parseInt(document.getElementById('sell-copper').value) || 0;
    
    if (!itemName) {
        showNotification('Please enter an item name!', 'error');
        return;
    }
    
    if (gold === 0 && silver === 0 && copper === 0) {
        showNotification('Please enter a sale amount!', 'error');
        return;
    }
    
    const salePrice = { gold, silver, copper };
    soldItems.push({
        name: itemName,
        price: salePrice
    });
    
    playerCurrency.gold += gold;
    playerCurrency.silver += silver;
    playerCurrency.copper += copper;
    
    updateCurrencyDisplay();
    showNotification(`Successfully sold ${itemName}!`, 'success');
    closeSellModal();
}

// Shopping summary functions
function showShoppingSummary() {
    const modal = document.createElement('div');
    modal.id = 'summary-modal';
    modal.className = 'modal';
    modal.style.display = 'block';
    
    let totalSpent = { gold: 0, silver: 0, copper: 0 };
    let totalEarned = { gold: 0, silver: 0, copper: 0 };
    
    purchasedItems.forEach(item => {
        totalSpent.gold += item.price.gold;
        totalSpent.silver += item.price.silver;
        totalSpent.copper += item.price.copper;
    });
    
    soldItems.forEach(item => {
        totalEarned.gold += item.price.gold;
        totalEarned.silver += item.price.silver;
        totalEarned.copper += item.price.copper;
    });
    
    let purchasedList = '';
    if (purchasedItems.length > 0) {
        purchasedItems.forEach((item, index) => {
            purchasedList += `
                <div class="summary-item clickable-item" onclick="showPurchasedItemDetail(${index})">
                    <span>${item.name}</span>
                    <span>${formatPrice(item.price)}</span>
                    <span class="click-hint">View</span>
                </div>
            `;
        });
    } else {
        purchasedList = '<div class="summary-item"><span>No items purchased</span><span>-</span></div>';
    }
    
    let soldList = '';
    if (soldItems.length > 0) {
        soldItems.forEach(item => {
            soldList += `
                <div class="summary-item">
                    <span>${item.name}</span>
                    <span>${formatPrice(item.price)}</span>
                </div>
            `;
        });
    } else {
        soldList = '<div class="summary-item"><span>No items sold</span><span>-</span></div>';
    }
    
    const startingTotal = convertToCopper(startingCurrency);
    const currentTotal = convertToCopper(playerCurrency);
    const netChange = currentTotal - startingTotal;
    const netCurrency = convertFromCopper(Math.abs(netChange));
    const netString = netChange >= 0 ? 
        `+${formatPrice(netCurrency)}` : 
        `-${formatPrice(netCurrency)}`;
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeSummaryModal()">&times;</span>
            <div class="modal-header">
                <h2 class="modal-title">Shopping Summary</h2>
            </div>
            
            <div class="summary-section">
                <div class="summary-title">Items Purchased</div>
                <div class="summary-list">
                    ${purchasedList}
                </div>
                <div class="summary-total">Total Spent: ${formatPrice(totalSpent)}</div>
            </div>
            
            <div class="summary-section">
                <div class="summary-title">Items Sold</div>
                <div class="summary-list">
                    ${soldList}
                </div>
                <div class="summary-total">Total Earned: ${formatPrice(totalEarned)}</div>
            </div>
            
            <div class="summary-section">
                <div class="summary-title">Currency Summary</div>
                <div class="currency-summary">
                    <div class="currency-line">
                        <span class="currency-label">Starting Gold</span>
                        <span class="currency-amount">${startingCurrency.gold} GP</span>
                    </div>
                    <div class="currency-line">
                        <span class="currency-label">Starting Silver</span>
                        <span class="currency-amount">${startingCurrency.silver} SP</span>
                    </div>
                    <div class="currency-line">
                        <span class="currency-label">Starting Copper</span>
                        <span class="currency-amount">${startingCurrency.copper} CP</span>
                    </div>
                </div>
                
                <div class="final-currency">
                    <div class="currency-line">
                        <span class="currency-label">Current Gold</span>
                        <span class="currency-amount">${playerCurrency.gold} GP</span>
                    </div>
                    <div class="currency-line">
                        <span class="currency-label">Current Silver</span>
                        <span class="currency-amount">${playerCurrency.silver} SP</span>
                    </div>
                    <div class="currency-line">
                        <span class="currency-label">Current Copper</span>
                        <span class="currency-amount">${playerCurrency.copper} CP</span>
                    </div>
                </div>
            </div>
            
            <button class="buy-btn" onclick="resetShopping()">New Shopping Session</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeSummaryModal() {
    const modal = document.getElementById('summary-modal');
    if (modal) {
        modal.remove();
    }
}

function resetShopping() {
    purchasedItems = [];
    soldItems = [];
    startingCurrency = { ...playerCurrency };
    closeSummaryModal();
    showNotification('New shopping session started!', 'success');
}

// Show detailed view of purchased item
function showPurchasedItemDetail(itemIndex) {
    const purchasedItem = purchasedItems[itemIndex];
    if (!purchasedItem) return;
    
    let originalItem = null;
    for (let shopType in storeItems) {
        const found = storeItems[shopType].find(item => item.name === purchasedItem.name);
        if (found) {
            originalItem = found;
            break;
        }
    }
    
    if (!originalItem) {
        originalItem = {
            name: purchasedItem.name,
            price: purchasedItem.price,
            rarity: "unknown",
            preview: "Previously purchased item",
            description: "This item was purchased earlier in your shopping session.",
            stats: "No additional details available"
        };
    }
    
    const detailModal = document.createElement('div');
    detailModal.id = 'item-detail-modal';
    detailModal.className = 'modal';
    detailModal.style.display = 'block';
    detailModal.style.zIndex = '2100';
    
    detailModal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeItemDetailModal()">&times;</span>
            <div class="modal-header">
                <h2 class="modal-title">${originalItem.name}</h2>
                <div class="modal-price">${formatPrice(originalItem.price)}</div>
                <div class="item-rarity ${originalItem.rarity}">${originalItem.rarity.toUpperCase()}</div>
                <div class="purchased-badge">PURCHASED</div>
            </div>
            <div class="modal-description">${originalItem.description}</div>
            <div class="stats-section">
                <div class="stats-title">Item Statistics</div>
                ${originalItem.stats}
            </div>
            <button class="buy-btn" onclick="closeItemDetailModal()" style="background: linear-gradient(145deg, #6b5c43, #8a7850);">
                Close Details
            </button>
        </div>
    `;
    
    document.body.appendChild(detailModal);
}

function closeItemDetailModal() {
    const modal = document.getElementById('item-detail-modal');
    if (modal) {
        modal.remove();
    }
}

// Update currency display
function updateCurrencyDisplay() {
    document.getElementById('gold-amount').textContent = playerCurrency.gold;
    document.getElementById('silver-amount').textContent = playerCurrency.silver;
    document.getElementById('copper-amount').textContent = playerCurrency.copper;
}

// Currency setup functions
function setupPlayerCurrency() {
    // Get and validate Google Sheets URL first
    const sheetsUrl = document.getElementById('sheets-url').value.trim();
    
    if (sheetsUrl) {
        const sheetId = extractSheetId(sheetsUrl);
        
        if (!sheetId) {
            showNotification('Invalid Google Sheets URL. Please check the URL format.', 'error');
            return;
        }
        
        // Initialize with user-provided Sheet ID
        initializeGoogleSheetsUrls(sheetId);
        showNotification('Google Sheets URL configured successfully!', 'success');
    } else {
        showNotification('No Google Sheets URL provided. Using backup data.', 'error');
    }
    
    // Get currency values
    const gold = parseInt(document.getElementById('input-gold').value) || 0;
    const silver = parseInt(document.getElementById('input-silver').value) || 0;
    const copper = parseInt(document.getElementById('input-copper').value) || 0;
    
    playerCurrency = { gold, silver, copper };
    startingCurrency = { gold, silver, copper };
    updateCurrencyDisplay();
    
    document.getElementById('currency-setup-modal').style.display = 'none';
    
    // Load data with new URLs
    loadConfiguration();
}



// Function to load all configuration data
async function loadConfiguration() {
    await loadSiteConfig();
    await loadStoreConfig();
    generateNavigation();
    await loadStoreItems();
    
    if (Object.keys(shopData).length > 0) {
        const firstShop = Object.keys(shopData)[0];
        switchShop(firstShop);
    }
}

// Setup currency modal scroll indicators
function setupCurrencyModal() {
    const modal = document.getElementById('currency-setup-modal');
    const modalContent = modal.querySelector('.modal-content');
    
    setTimeout(() => {
        updateScrollIndicators(modalContent);
        modalContent.addEventListener('scroll', () => updateScrollIndicators(modalContent));
    }, 100);
}

// Show notification
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    

    setTimeout(() => {
        notification.textContent = '';
    }, 3000);
}

// Google Sheets template URL
const TEMPLATE_URL = 'https://docs.google.com/spreadsheets/d/1UiTBIv-VNlvuVXKJB5471_GredFjyu4Gc-UmrQvoWjU/copy?gid=577684602#gid=577684602';

// Role selection functions
function selectPlayer() {
    document.getElementById('role-selection-modal').style.display = 'none';
    document.getElementById('currency-setup-modal').style.display = 'block';
}

function selectDM() {
    document.getElementById('dm-instructions').style.display = 'block';
    document.getElementById('player-btn').style.display = 'none';
    document.getElementById('dm-btn').style.display = 'none';
    document.getElementById('testing-btn').style.display = 'none';
}

function selectTesting(){
     document.getElementById('role-selection-modal').style.display = 'none';
    document.getElementById('currency-setup-modal').style.display = 'block';
    document.getElementById('url-input-group').style.display='none';
    document.getElementById('modal-description').style.display='none';
}

function copyTemplate() {
    window.open(TEMPLATE_URL, '_blank');
    showNotification('Template opened in new tab. Make a copy and set sharing permissions.', 'success');
}

function dmContinue() {
    document.getElementById('role-selection-modal').style.display = 'none';
    document.getElementById('currency-setup-modal').style.display = 'block';
}


// Event listeners
document.addEventListener('DOMContentLoaded', async function() {

      // Role selection event listeners
    document.getElementById('player-btn').onclick = selectPlayer;
    document.getElementById('dm-btn').onclick = selectDM;
    document.getElementById('copy-template-btn').onclick = copyTemplate;
    document.getElementById('dm-continue-btn').onclick = dmContinue;
    document.getElementById('testing-btn').onclick = selectTesting;
    
    // Existing event listeners...
    document.getElementById('start-shopping').onclick = setupPlayerCurrency;

     // Load site configuration 
    await loadSiteConfig();

    // Load store configuration 
    await loadStoreConfig();
    
    // Generate navigation buttons
    generateNavigation();
    
    // Load items from Google Sheets
    await loadStoreItems();
    
    // Initialize the first store
    if (Object.keys(shopData).length > 0) {
        const firstShop = Object.keys(shopData)[0];
        switchShop(firstShop);
    }
    
    // Setup currency first
    document.getElementById('start-shopping').onclick = setupPlayerCurrency;
    
    // Setup currency modal scroll indicators
    setupCurrencyModal();
    
    // Action button event listeners
    document.getElementById('sell-btn').onclick = openSellModal;
    document.getElementById('finish-shopping-btn').onclick = showShoppingSummary;
    
    // Other event listeners
    document.querySelector('.close').onclick = closeModal;
    document.getElementById('buy-button').onclick = purchaseItem;

    window.onclick = function(event) {
        const modal = document.getElementById('item-modal');
        const setupModal = document.getElementById('currency-setup-modal');
        if (event.target === modal) {
            closeModal();
        }
    };

    // Keyboard navigation
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
    
    // Allow Enter key in currency setup
    document.querySelectorAll('.currency-input').forEach(input => {
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                setupPlayerCurrency();
            }
        });
    });
});