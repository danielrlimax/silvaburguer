const whatsappNumber = "5519997103303"; 
let cart = [];

// 1. Filtro de Categorias
function filterMenu(category) {
    const buttons = document.querySelectorAll('.cat-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if(btn.innerText.toLowerCase() === category.toLowerCase() || (category === 'todos' && btn.innerText === 'Todos')) {
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

// 2. Adicionar ao Carrinho
function addToCart(name, price) {
    cart.push({ name, price });
    updateCartUI();
    
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

// 3. Atualizar Interface do Carrinho
function updateCartUI() {
    const total = cart.reduce((acc, item) => acc + item.price, 0);
    document.getElementById('cart-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
    document.getElementById('cart-count').innerText = `${cart.length} item(ns)`;
}

// ==========================================
// FUNÇÕES DA TELINHA DE CHECKOUT (NOVO)
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
    
    // Mostra o campo de troco apenas se for Dinheiro
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
        message += `• ${item.name} - R$ ${item.price.toFixed(2).replace('.', ',')}\n`;
    });

    const total = cart.reduce((acc, item) => acc + item.price, 0);
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
    closeModal(); // Fecha a telinha depois de enviar
}