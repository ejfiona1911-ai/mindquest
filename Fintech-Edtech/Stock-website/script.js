
const stocks = [
    { symbol: "RELIANCE", name: "Reliance Industries", market: "IN", price: 1450 },
    { symbol: "TCS", name: "Tata Consultancy Services", market: "IN", price: 3200 },
    { symbol: "INFY", name: "Infosys", market: "IN", price: 1500 },
    { symbol: "HDFCBANK", name: "HDFC Bank", market: "IN", price: 1700 },
    { symbol: "AAPL", name: "Apple Inc.", market: "US", price: 230 },
    { symbol: "MSFT", name: "Microsoft", market: "US", price: 510 },
    { symbol: "GOOGL", name: "Alphabet", market: "US", price: 250 },
    { symbol: "AMZN", name: "Amazon", market: "US", price: 225 }
];

let balance = 1000;
let holdings = {};
let currentMarket = "IN";

function renderStocks() {
    const stockList = document.getElementById("stockList");

    if (!stockList) return;

    const filteredStocks = stocks.filter(
        stock => stock.market === currentMarket
    );

    stockList.innerHTML = filteredStocks.map(stock => `
        <div class="stock-card">
            <h3>${stock.symbol}</h3>
            <p>${stock.name}</p>
            <h2>${stock.market === "IN" ? "₹" : "$"}${stock.price.toLocaleString()}</h2>
            <div class="trade-actions">
                <input
                    type="number"
                    id="quantity-${stock.symbol}"
                    min="1"
                    step="1"
                    value="1"
                    aria-label="Quantity of ${stock.symbol}"
                >
                <button class="buy-btn"
                    onclick="buyStock('${stock.symbol}')">
                    Buy
                </button>
                <button class="sell-btn"
                    onclick="sellStock('${stock.symbol}')">
                    Sell
                </button>
            </div>
        </div>
    `).join("");
}

function updateDashboard() {
    const balanceElement = document.getElementById("balance");

    if (balanceElement) {
        balanceElement.textContent =
            balance.toLocaleString();
    }

    const invested = Object.entries(holdings).reduce(
        (total, [symbol, quantity]) => {
            const stock = stocks.find(item => item.symbol === symbol);
            return total + (stock ? stock.price * quantity : 0);
        },
        0
    );

    const investedElement = document.getElementById("invested");
    const totalValueElement = document.getElementById("totalValue");
    const profitLossElement = document.getElementById("profitLoss");

    if (investedElement) investedElement.textContent = invested.toLocaleString();
    if (totalValueElement) totalValueElement.textContent =
        (balance + invested).toLocaleString();
    if (profitLossElement) profitLossElement.textContent = "0";

    renderHoldings();
}

function buyStock(symbol) {
    const stock = stocks.find(item => item.symbol === symbol);
    const quantityInput = document.getElementById(`quantity-${symbol}`);
    const quantity = Number(quantityInput?.value);

    if (!stock || !Number.isInteger(quantity) || quantity < 1) {
        alert("Enter a valid whole-number quantity.");
        return;
    }

    const cost = stock.price * quantity;

    if (cost > balance) {
        alert("Not enough virtual points for this purchase.");
        return;
    }

    balance -= cost;
    holdings[symbol] = (holdings[symbol] || 0) + quantity;

    updateDashboard();
    alert(`You bought ${quantity} share(s) of ${symbol} using virtual points.`);
}

function sellStock(symbol) {
    const stock = stocks.find(item => item.symbol === symbol);
    const quantityInput = document.getElementById(`quantity-${symbol}`);
    const quantity = Number(quantityInput?.value);

    if (!stock || !Number.isInteger(quantity) || quantity < 1) {
        alert("Enter a valid whole-number quantity.");
        return;
    }

    if ((holdings[symbol] || 0) < quantity) {
        alert("You do not own enough shares to sell.");
        return;
    }

    balance += stock.price * quantity;
    holdings[symbol] -= quantity;

    if (holdings[symbol] === 0) {
        delete holdings[symbol];
    }

    updateDashboard();
    alert(`You sold ${quantity} share(s) of ${symbol} for virtual points.`);
}

function renderHoldings() {
    const holdingsElement = document.getElementById("holdings");

    if (!holdingsElement) return;

    const entries = Object.entries(holdings);

    if (entries.length === 0) {
        holdingsElement.innerHTML = "<p>You haven't bought any stocks yet.</p>";
        return;
    }

    holdingsElement.innerHTML = entries.map(([symbol, quantity]) => {
        const stock = stocks.find(item => item.symbol === symbol);
        const currency = stock.market === "IN" ? "₹" : "$";

        return `
            <div class="holding-card">
                <strong>${stock.name} (${symbol})</strong>
                <p>Quantity: ${quantity}</p>
                <p>Sample value: ${currency}${(stock.price * quantity).toLocaleString()}</p>
            </div>
        `;
    }).join("");
}

document.querySelectorAll("[data-market]").forEach(tab => {
    tab.addEventListener("click", () => {
        currentMarket = tab.dataset.market;

        document.querySelectorAll("[data-market]").forEach(item => {
            item.classList.remove("active");
        });

        tab.classList.add("active");
        renderStocks();
    });
});

renderStocks();
updateDashboard();
