# the-dms-merchant-screen
# The DM's Merchant Screen

**A web-based D&D marketplace and inventory manager.**  

The DM's Merchant Screen allows tabletop RPG players to **shop for items added by their Dungeon Master**, track their gold, record sales, and view detailed information about all purchased items. The website is designed to be simple, fast, and interactive, making in-person tabletop sessions smoother and more organized.  

---

## Features

- **Dynamic Marketplace:** Players see items the DM added them via Google Sheets.  
- **Gold Tracker:** Automatically calculate remaining gold after purchases.  
- **Sales Log:** Keep track of what players sold or bought.  
- **Store & Item Management:** DMs can enable/disable shops and edit item names, descriptions, and categories.  
- **User-Friendly Interface:** Works on desktop and mobile, designed for quick in-session use.  

---

## How It Works

1. The **DM adds items** to a Google Sheet.  
2. Each item has an **Enabled** property to determine if it appears in the market.  
3. Players access the website and can:  
   - Browse **active stores and their items**.  
   - See **item details** including price and description.  
   - Track **gold and inventory** automatically.  
4. DMs can manage stores via the **Store Editor**:  
   - Toggle shops on/off with **Enabled**.  
   - Edit shop names and descriptions.  
   

---

## Notes & Caution

🔴⚠️ **Do not rename sheets or change the order of columns** in the spreadsheets.  

- Use `<br>` to create line breaks in descriptions.  
- Or type `;` and use the **Text Tools** to convert all semicolons to line breaks.  
- Be careful when adding new categories—each item can belong to only one.  
---

## Technologies Used

- **React** — Frontend framework  
- **JavaScript / HTML / CSS** — Core web technologies  
- **Google Sheets API** — Real-time item and shop management  

---

## Getting Started

- Just go to the URL and follow the instructions on screen
