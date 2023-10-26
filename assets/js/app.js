// variables

const cartBtn = document.querySelector('#cartBtn');
const closeCartBtn = document.querySelector('#closeCart');
const cartDOM = document.querySelector('#cart');
const cartOverlay = document.querySelector('#cartOverlay');
const cartItems = document.querySelector('#cartItems');
const cartTotal = document.querySelector('#cartTotal');
const cartContent = document.querySelector('#cartContent');
const productsDOM = document.querySelector('#productsCenter');
const clearCartBtn = document.querySelector('#clearCart');


// cart
let cart = [];
// bag buttons
let bagButtonsDOM = [];

//getting the products
class Products {
    async getProducts() {

        try {
            let result = await fetch('products.json');
            let data = await result.json();
            let products = data.items;

            products = products.map(item => {
                const {title, price} = item.fields;
                const {id} = item.sys;
                const image = item.fields.image.fields.file.url;
                return {title, price, id, image};
            })

            return products;
        } catch (error) {
            console.log(error);
        }
    }
}

//display products
class UI {
    displayProducts(products) {
        let result = '';

        products.forEach(product => {
            result += `
            <article class = "product">
        \t\t\t<div class = "imgContainer">
        \t\t\t\t<img src = ${product.image} alt = "product" class = "productImg">
            \t\t\t\t<button class = "bagBtn" data-id = ${product.id}>
            \t\t\t\t\t<i class = "fas fa-shopping-cart"></i>
            \t\t\t\t\tAdd to Cart
            \t\t\t\t</button>
        \t\t\t</div>

        \t\t\t<h3>${product.title}</h3>
        \t\t\t<h4>$${product.price}</h4>
        \t\t</article>
            `
        })
        productsDOM.innerHTML = result;
    }

    getBagButtons() {
        const bagButtons = [...document.querySelectorAll(".bagBtn")];
        bagButtonsDOM = bagButtons;

        bagButtons.forEach(bagButton => {
            let id = bagButton.dataset.id;
            let inCart = cart.find(item => item.id === id);

            if (inCart) {
                bagButton.innerText = "In Cart";
                bagButton.disabled = true;
            }

            bagButton.addEventListener('click', (event) => {
                event.target.innerText = "In Cart";
                event.target.disabled = true;

                // get product from products
                let cartItem = {...Storage.getProduct(id), amount: 1};

                // add product to the cart
                cart = [...cart, cartItem];

                // save the cart in the local storage
                Storage.saveCart(cart);

                // set cart values
                this.setCartValues(cart);

                // display cart item
                this.addCartItem(cartItem);

                // show the cart
                this.showCart();
            });

        });
    }

    setCartValues(cart) {
        let tempTotal = 0;
        let itemsTotal = 0;

        cart.map(item => {
            tempTotal += item.price * item.amount;
            itemsTotal += item.amount;
        });

        cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
        cartItems.innerText = itemsTotal;
    }

    addCartItem(item) {
        const div = document.createElement('div');
        div.classList.add('cartItem');
        div.innerHTML = `
        <img src = ${item.image} alt = "Product">
        <div>
\t\t\t\<t></t><h4>${item.title}</h4>
\t\t\t\<t></t><h5>$${item.price}</h5>        
\t\t\t\<t></t><span class="removeItem" data-id=${item.id}>Remove</span>
        </div>
\t\t\t\t<div>
\t\t\t\t\t<i class="fas fa-chevron-up" data-id=${item.id}></i>
\t\t\t\t\t<p class="itemAmount">${item.amount}</p>
\t\t\t\t\t<i class="fas fa-chevron-down" data-id=${item.id}></i>
\t\t\t\t</div>
        `
        cartContent.appendChild(div);
        console.log(cartContent);
    }

    showCart() {
        cartOverlay.classList.add('transparentBcg');
        cartDOM.classList.add('showCart');
    }

    setupApp() {
        cart = Storage.getCart();
        this.setCartValues(cart);
        this.populateCart(cart);

        //event listeners
        cartBtn.addEventListener('click', this.showCart);
        closeCartBtn.addEventListener('click', this.hideCart);
    }

    populateCart(cart) {
        cart.forEach(item => this.addCartItem(item));
    }

    hideCart() {
        cartOverlay.classList.remove('transparentBcg');
        cartDOM.classList.remove('showCart');
    }

    cartLogic() {
        // clear cart button
        clearCartBtn.addEventListener('click', () => {
            this.clearCart();
        });

        // cart functionality
        cartContent.addEventListener('click', event => {
            if (event.target.classList.contains('removeItem')) {

                let removeItem = event.target;
                let id = removeItem.dataset.id;
                cartContent.removeChild(removeItem.parentElement.parentElement);
                this.removeItem(id);
            }
            else if (event.target.classList.contains('fa-chevron-up')) {

                let addAmount = event.target;
                let id = addAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);
                tempItem.amount = tempItem.amount + 1;
                Storage.saveCart(cart);
                this.setCartValues(cart);
                addAmount.nextElementSibling.innerText = tempItem.amount;
                console.log(addAmount);
            }
            else if (event.target.classList.contains('fa-chevron-down')) {
                let lowerAmount = event.target;
                let id = lowerAmount.dataset.id;
                let tempItem = cart.find(item => item.id === id);

                tempItem.amount = tempItem.amount - 1;

                if (tempItem.amount > 0) {
                    Storage.saveCart(cart);
                    this.setCartValues(cart);
                    lowerAmount.previousElementSibling.innerText = tempItem.amount;
                } else {
                    cartContent.removeChild(lowerAmount.parentElement.parentElement);
                    this.removeItem(id);
                }

            }
        });

    }

    clearCart() {
        let cartItems = cart.map(item => item.id);
        cartItems.forEach(id => this.removeItem(id));

        while (cartContent.children.length > 0) {
            cartContent.removeChild(cartContent.children[0]);
        }
        this.hideCart();
    }

    removeItem(id) {
        cart = cart.filter(item => item.id !== id);
        this.setCartValues(cart);
        Storage.saveCart(cart);

        let button = this.getSingleButton(id);
        button.disabled = false;
        button.innerHTML = `<i class="fas fa-shopping-cart"></i>add to cart`;
    }

    getSingleButton(id) {
        return bagButtonsDOM.find(button => button.dataset.id === id);
    }
}

//local storage
class Storage {
    static saveProducts(products) {
        localStorage.setItem("products", JSON.stringify(products))
    }

    static getProduct(id) {
        let products = JSON.parse(localStorage.getItem("products"));
        return products.find(product => product.id === id);
    }

    static saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    static getCart() {
        return localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
    }
}

document.addEventListener("DOMContentLoaded", () => {

    const ui = new UI();
    const products = new Products();

    // setup App
    ui.setupApp();

    // get all products
    products.getProducts().then(products => {
        ui.displayProducts(products);
        Storage.saveProducts(products);
    }).then(() => {
        ui.getBagButtons();
        ui.cartLogic();
    });
});
