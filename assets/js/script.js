const whatsappNumber = "5514997827338"; 
let cart = [];

// ==========================================
// LÓGICA DE ARMAZENAMENTO (LOCALSTORAGE)
// ==========================================
const CART_EXPIRATION_MS = 60 * 60 * 1000; 

function saveCart() {
    const cartData = { items: cart, timestamp: new Date().getTime() };
    localStorage.setItem('silvaBurguerCart', JSON.stringify(cartData));
}

function loadCart() {
    const savedCartData = localStorage.getItem('silvaBurguerCart');
    if (savedCartData) {
        const parsedData = JSON.parse(savedCartData);
        const currentTime = new Date().getTime();
        
        if (currentTime - parsedData.timestamp < CART_EXPIRATION_MS) {
            cart = parsedData.items;
        } else {
            localStorage.removeItem('silvaBurguerCart');
        }
    }
}

// ==========================================
// INTEGRAÇÃO GOOGLE SHEETS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    loadMenuFromCSV();
});

async function loadMenuFromCSV() {
    try {
        const planilhalink = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ44nTwWdvXf_nfAwXQmTUi43sMnusZOsGbipkChc1vg5f4WfdkvWgqrwLxDIkLKvG3Sc2Jrnrkl9MS/pub?gid=45705687&single=true&output=csv'; 
        
        const response = await fetch(planilhalink);
        if (!response.ok) throw new Error('Falha na planilha');
        
        const csvText = await response.text();
        renderSystem(csvText);
        updateCartUI(); // Atualiza contador após o sistema carregar
    } catch (error) {
        console.error("Erro:", error);
        document.getElementById('menu-container').innerHTML = 
            `<p style="color:var(--primary-color); text-align: center; width: 100%; grid-column: 1 / -1; margin-top: 50px;">Erro ao carregar o cardápio. Verifique sua conexão.</p>`;
    }
}

function parseCSVLine(line) {
    let result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        let char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes; 
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result.map(col => col.trim());
}

function renderSystem(csvText) {
    const container = document.getElementById('menu-container');
    const addonsContainer = document.getElementById('modal-addons-list');
    
    container.innerHTML = '';
    addonsContainer.innerHTML = '';

    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const dataRows = lines.slice(1); 

    const renderedCategories = new Set();
    const categoryTitles = {
        'burgers': 'LANCHES',
        'porcoes': 'PORÇÕES',
        'bebidas': 'BEBIDAS'
    };

    dataRows.forEach(row => {
        const cols = parseCSVLine(row); 
        if (cols.length < 6) return;

        const categoria = cols[0];
        const nome = cols[1];
        const descricao = cols[2];
        const imagem = cols[3];
        const tipoAcao = cols[4];
        const preco1 = parseFloat(cols[5]);
        const preco2 = cols[6] ? parseFloat(cols[6]) : 0;
        const variacoesStr = cols[7] ? cols[7] : '';

        // Injeta os Adicionais no Modal
        if (categoria === 'adicionais' && tipoAcao === 'Adicional') {
            addonsContainer.innerHTML += `
                <label class="addon-item">
                    <input type="checkbox" class="addon-checkbox" value="${preco1}" data-name="${nome}" onchange="updateModalPrice()"> 
                    <div class="addon-details">
                        <span class="addon-name">${nome}</span>
                        <span class="addon-price">+ R$ ${preco1.toFixed(2).replace('.', ',')}</span>
                    </div>
                </label>
            `;
            return; 
        }

        // Cria as Divisórias Dinâmicas
        if (!renderedCategories.has(categoria)) {
            renderedCategories.add(categoria);
            const title = categoryTitles[categoria] || categoria.toUpperCase();
            
            container.innerHTML += `
                <div class="category-divider" data-category="${categoria}">
                    <div class="divider-content">
                        <h2>${title}</h2>
                        <hr>
                    </div>
                </div>
            `;
        }

        let itemHTML = '';

        if (tipoAcao === 'Lanche_Combo') {
            itemHTML = `
                <div class="menu-item" data-category="${categoria}">
                    <img src="${imagem}" alt="${nome}" class="item-image">
                    <div class="item-details">
                        <h3>${nome}</h3>
                        <p>${descricao}</p>
                        <div class="price-actions">
                            <button class="btn-add" onclick="openAddonModal('${nome} (Só o Lanche)', ${preco1})">R$ ${preco1.toFixed(2).replace('.', ',')}<br><small>Só o Lanche</small></button>
                            <button class="btn-add combo" onclick="openAddonModal('${nome} (COM FRITAS)', ${preco2})">R$ ${preco2.toFixed(2).replace('.', ',')}<br><small>Com Fritas</small></button>
                        </div>
                    </div>
                </div>
            `;
        } 
        else if (tipoAcao === 'Direto') {
            itemHTML = `
                <div class="menu-item single-price" data-category="${categoria}">
                    <img src="${imagem}" alt="${nome}" class="item-image">
                    <div class="item-details">
                        <h3>${nome}</h3>
                        <p>${descricao}</p>
                        <span class="price">R$ ${preco1.toFixed(2).replace('.', ',')}</span>
                        <button class="btn-add-single" onclick="addToCart('${categoria === 'bebidas' ? 'Bebida: ' : 'Porção: '}${nome}', ${preco1}, this)">+ Adicionar</button>
                    </div>
                </div>
            `;
        } 
        else if (tipoAcao === 'Modal_Bebida') {
            const variacoesArray = variacoesStr.split('|').map(v => `'${v.trim()}'`); 
            itemHTML = `
                <div class="menu-item single-price" data-category="${categoria}">
                    <img src="${imagem}" alt="${nome}" class="item-image">
                    <div class="item-details">
                        <h3>${nome}</h3>
                        <p>${descricao}</p>
                        <span class="price">R$ ${preco1.toFixed(2).replace('.', ',')}</span>
                        <button class="btn-add-single" onclick="openDrinkModal('${nome}', ${preco1}, [${variacoesArray}])">+ Adicionar</button>
                    </div>
                </div>
            `;
        }
        container.innerHTML += itemHTML;
    });
}

// ==========================================
// FILTRO DE CATEGORIAS RESTAURADO
// ==========================================
function filterMenu(category) {
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if(btn.getAttribute('onclick').includes(`'${category}'`)) {
            btn.classList.add('active');
        }
    });

    const items = document.querySelectorAll('.menu-item');
    items.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        if (category === 'todos' || itemCategory === category) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });

    const dividers = document.querySelectorAll('.category-divider');
    dividers.forEach(div => {
        const divCategory = div.getAttribute('data-category');
        if (category === 'todos' || divCategory === category) {
            div.style.display = 'block';
        } else {
            div.style.display = 'none';
        }
    });
}

// ==========================================
// LÓGICA DE ADICIONAIS DO LANCHE
// ==========================================
let currentBurger = null;

function openAddonModal(name, price) {
    currentBurger = { name: name, basePrice: price, currentPrice: price };
    
    document.querySelectorAll('.addon-checkbox[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('burger-notes').value = '';
    
    document.getElementById('modal-burger-name').innerText = name;
    updateModalPrice();
    
    document.getElementById('addon-modal').style.display = 'flex';
}

function closeAddonModal() {
    document.getElementById('addon-modal').style.display = 'none';
    currentBurger = null;
}

function updateModalPrice() {
    let total = currentBurger.basePrice;
    document.querySelectorAll('#addon-modal .addon-checkbox:checked').forEach(cb => {
        total += parseFloat(cb.value);
    });
    currentBurger.currentPrice = total;
    document.getElementById('modal-total-price').innerText = total.toFixed(2).replace('.', ',');
}

function confirmBurgerWithAddons() {
    let selectedAddons = [];
    document.querySelectorAll('#addon-modal .addon-checkbox:checked').forEach(cb => {
        selectedAddons.push({
            name: cb.getAttribute('data-name'),
            price: parseFloat(cb.value)
        });
    });

    const notes = document.getElementById('burger-notes').value.trim();
    const addonsString = selectedAddons.map(a => a.name).sort().join('|');
    
    const itemKey = `${currentBurger.name}-${addonsString}-${notes}`;

    const existingItem = cart.find(item => item.key === itemKey);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            key: itemKey,
            name: currentBurger.name,
            price: currentBurger.currentPrice, 
            quantity: 1,
            addons: selectedAddons,
            notes: notes 
        });
    }

    saveCart(); 
    updateCartUI();
    closeAddonModal();
    alert(currentBurger.name + " adicionado ao carrinho!");
}

// ==========================================
// LÓGICA DE VARIAÇÕES DE BEBIDAS
// ==========================================
let currentDrink = null;

function openDrinkModal(baseName, price, options) {
    currentDrink = { name: baseName, price: price };
    
    document.getElementById('modal-drink-name').innerText = baseName;
    document.getElementById('modal-drink-price').innerText = price.toFixed(2).replace('.', ',');
    
    const optionsContainer = document.getElementById('drink-options-list');
    optionsContainer.innerHTML = '';
    
    options.forEach((opt, index) => {
        const isChecked = index === 0 ? 'checked' : '';
        optionsContainer.innerHTML += `
            <label class="addon-item">
                <input type="radio" name="drink-variation" class="addon-checkbox" value="${opt}" ${isChecked}> 
                <div class="addon-details">
                    <span class="addon-name">${opt}</span>
                </div>
            </label>
        `;
    });
    
    document.getElementById('drink-modal').style.display = 'flex';
}

function closeDrinkModal() {
    document.getElementById('drink-modal').style.display = 'none';
    currentDrink = null;
}

function confirmDrink() {
    if (!currentDrink) return;
    
    const selectedOption = document.querySelector('input[name="drink-variation"]:checked').value;
    addToCart(selectedOption, currentDrink.price);
    
    closeDrinkModal();
    alert(selectedOption + " adicionada ao carrinho!");
}

// ==========================================
// CARRINHO (PARA ITENS SEM MODAL)
// ==========================================
function addToCart(name, price, btnElement = null) {
    const itemKey = name;
    const existingItem = cart.find(item => item.key === itemKey);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ key: itemKey, name, price, quantity: 1, addons: [] });
    }
    
    saveCart(); 
    updateCartUI();
    
    const btn = btnElement || (window.event ? window.event.currentTarget : null);
    
    if (btn && btn.classList && btn.classList.contains('btn-add-single')) {
        const originalHTML = btn.innerHTML;
        const originalBg = btn.style.background;
        const originalColor = btn.style.color;

        btn.innerHTML = "Adicionado!";
        btn.style.background = "#25d366";
        btn.style.color = "#fff";

        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = originalBg;
            btn.style.color = originalColor;
        }, 800);
    }
}

function updateCartUI() {
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    document.getElementById('cart-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    
    if(totalItems === 0) {
        document.getElementById('cart-count').innerText = `Nenhum item`;
    } else {
        document.getElementById('cart-count').innerText = `${totalItems} item(ns)`;
    }
}

// ==========================================
// RENDERIZAÇÃO E REMOÇÃO DE ITENS (CHECKOUT MODAL)
// ==========================================
function renderCartItems() {
    const listContainer = document.getElementById('cart-items-list');
    listContainer.innerHTML = ""; 

    if (cart.length === 0) {
        listContainer.innerHTML = "<p style='color: var(--text-muted); padding: 10px;'>Carrinho vazio</p>";
        return;
    }

    cart.forEach((item, index) => {
        const itemElement = document.createElement("div");
        itemElement.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #222;";
        
        const addonsText = item.addons && item.addons.length > 0 
            ? `<br><small style="color: var(--text-muted)">+ ${item.addons.map(a => a.name).join(', ')}</small>` 
            : "";
            
        const notesText = item.notes 
            ? `<br><small style="color: var(--primary-color)">Obs: ${item.notes}</small>` 
            : "";

        itemElement.innerHTML = `
            <div style="flex: 1;">
                <span style="font-weight: 600;">${item.quantity}x ${item.name}</span>
                ${addonsText}
                ${notesText}
                <div style="color: var(--primary-color); font-size: 0.9rem;">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</div>
            </div>
            <button onclick="removeFromCart(${index})" style="background: #ff4d4d; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">
                Remover
            </button>
        `;
        listContainer.appendChild(itemElement);
    });
}

function removeFromCart(index) {
    cart.splice(index, 1); 
    saveCart();            
    updateCartUI();        
    renderCartItems();     

    if (cart.length === 0) {
        closeModal(); 
    }
}

// ==========================================
// MODAL DE CHECKOUT & WHATSAPP
// ==========================================
function openModal() {
    if (cart.length === 0) {
        alert("Seu carrinho está vazio! Adicione uma delícia antes de pedir.");
        return;
    }
    renderCartItems(); 
    document.getElementById('checkout-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('checkout-modal').style.display = 'none';
}

function toggleTroco() {
    const paymentMethod = document.getElementById('payment-method').value;
    const trocoContainer = document.getElementById('troco-container');
    
    if (paymentMethod === 'Dinheiro') {
        trocoContainer.style.display = 'block';
    } else {
        trocoContainer.style.display = 'none';
    }
}

function sendWhatsApp() {
    const address = document.getElementById('user-address').value;
    const payment = document.getElementById('payment-method').value;
    const troco = document.getElementById('troco').value;

    if (address.trim() === '') {
        alert("Por favor, digite o seu endereço para entrega.");
        return;
    }

    let message = `*🍔 NOVO PEDIDO - SILVA BURGUER*\n`;
    message += `---------------------------------\n`;

    cart.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        message += `• ${item.quantity}x - ${item.name} - R$ ${itemTotal.toFixed(2).replace('.', ',')}\n`;
        
        if (item.addons && item.addons.length > 0) {
            const addonNames = item.addons.map(a => a.name).join(', ');
            message += `    + _${addonNames}_\n`;
        }
        
        if (item.notes) {
            message += `    *Obs:* _${item.notes}_\n`;
        }
    });

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    message += `---------------------------------\n`;
    message += `💰 *TOTAL DO PEDIDO: R$ ${total.toFixed(2).replace('.', ',')}*\n\n`;
    
    message += `*Forma de pagamento:* ${payment}\n`;
    if (payment === 'Dinheiro' && troco.trim() !== '') {
        message += `*Troco para:* R$ ${troco}\n`;
    }
    
    message += `\n*Endereço de entrega:*\n${address}\n`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    closeModal();

    cart = [];
    localStorage.removeItem('silvaBurguerCart');
    updateCartUI();
}