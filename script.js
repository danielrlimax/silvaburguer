const whatsappNumber = "5515998850796"; 
let cart = [];

// ==========================================
// FILTRO DE CATEGORIAS (Corrigido para ficar amarelo)
// ==========================================
function filterMenu(category) {
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        // Agora ele verifica se a ação do botão contém a categoria exata clicada
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
    
    // Desmarca todos os checkboxes sempre que abrir a janela
    document.querySelectorAll('.addon-checkbox').forEach(cb => cb.checked = false);
    
    // Atualiza os textos da tela
    document.getElementById('modal-burger-name').innerText = name;
    updateModalPrice();
    
    // Mostra o modal de adicionais
    document.getElementById('addon-modal').style.display = 'flex';
}

function closeAddonModal() {
    document.getElementById('addon-modal').style.display = 'none';
    currentBurger = null;
}

function updateModalPrice() {
    let total = currentBurger.basePrice;
    document.querySelectorAll('.addon-checkbox:checked').forEach(cb => {
        total += parseFloat(cb.value);
    });
    currentBurger.currentPrice = total;
    document.getElementById('modal-total-price').innerText = total.toFixed(2).replace('.', ',');
}

function confirmBurgerWithAddons() {
    let selectedAddons = [];
    document.querySelectorAll('.addon-checkbox:checked').forEach(cb => {
        selectedAddons.push({
            name: cb.getAttribute('data-name'),
            price: parseFloat(cb.value)
        });
    });

    // Cria uma chave única para agrupar lanches perfeitamente iguais no carrinho
    const addonsString = selectedAddons.map(a => a.name).sort().join('|');
    const itemKey = `${currentBurger.name}-${addonsString}`;

    const existingItem = cart.find(item => item.key === itemKey);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            key: itemKey,
            name: currentBurger.name,
            price: currentBurger.currentPrice, 
            quantity: 1,
            addons: selectedAddons
        });
    }

    updateCartUI();
    closeAddonModal();
    alert(currentBurger.name + " adicionado ao carrinho!");
}

// ==========================================
// CARRINHO (PARA BEBIDAS E PORÇÕES)
// ==========================================
function addToCart(name, price) {
    const itemKey = name;
    const existingItem = cart.find(item => item.key === itemKey);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ key: itemKey, name, price, quantity: 1, addons: [] });
    }
    
    updateCartUI();
    
    // Feedback visual momentâneo no botão
    const btn = event.currentTarget;
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

function updateCartUI() {
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    document.getElementById('cart-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    document.getElementById('cart-count').innerText = `${totalItems} item(ns)`;
}

// ==========================================
// MODAL DE CHECKOUT & WHATSAPP
// ==========================================
function openModal() {
    if (cart.length === 0) {
        alert("Seu carrinho está vazio! Adicione uma delícia antes de pedir.");
        return;
    }
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
        
        // CORREÇÃO: Formatação dos adicionais com espaçamento e itálico limpo
        if (item.addons && item.addons.length > 0) {
            const addonNames = item.addons.map(a => a.name).join(', ');
            message += `    + _${addonNames}_\n`;
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
}