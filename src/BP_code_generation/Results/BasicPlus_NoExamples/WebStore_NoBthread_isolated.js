/*
Customer: username(which is unique), password, isLoggedIn, creditCardNumber, purchaseHistory, adresssInfo, phone number and shopping cart.
*/
function customer(username, password, isLoggedIn, creditCardNumber, purchaseHistory, addressInfo, phoneNumber, shoppingCart) {
    return ctx.Entity(username, 'customer', {
        username: username,
        password: password,
        isLoggedIn: isLoggedIn,
        creditCardNumber: creditCardNumber,
        purchaseHistory: purchaseHistory,
        addressInfo: addressInfo,
        phoneNumber: phoneNumber,
        shoppingCart: shoppingCart
    });
}
/*
Product: name(Unique), price, category 
*/
function product(name, price, category) {
    return ctx.Entity(name, 'product', {
        name: name,
        price: price,
        category: category
    });
}
/*
Category: name(Unique), sub categories
*/
function category(name, subCategories) {
    return ctx.Entity(name, 'category', {
        name: name,
        subCategories: subCategories
    });
}
/*
Administrator: username(which is unique), password, isLoggedIn
*/
function administrator(username, password, isLoggedIn) {
    return ctx.Entity(username, 'administrator', {
        username: username,
        password: password,
        isLoggedIn: isLoggedIn
    });
}

/*
Needed queries:
 1. Customer
 2. Logged in customer
 3. Logged out customer
 4. Administrator
*/

ctx.registerQuery('Customer', entity => entity.type == 'customer');
ctx.registerQuery('Customer.loggedIn', entity => entity.type == 'customer' && entity.isLoggedIn);
ctx.registerQuery('Customer.loggedOut', entity => entity.type == 'customer' && !entity.isLoggedIn);
ctx.registerQuery('Administrator', entity => entity.type == 'administrator');
/*
Customers will be able to create accounts to store their customer profiles.
*/
function createAccountEvent(username, password, creditCardNumber, addressInfo, phoneNumber) {
    return Event("createAccountEvent", {
        username: username,
        password: password,
        creditCardNumber: creditCardNumber,
        addressInfo: addressInfo,
        phoneNumber: phoneNumber
    });
}

ctx.registerEffect('createAccountEvent', function (data) {
    ctx.populateContext(customer(data.username, data.password, false, data.creditCardNumber, [], data.addressInfo, data.phoneNumber, []));
});
/*
Customers will be able to configure and update their contact information within their profiles.
*/
function updateContactInfoEvent(username, addressInfo, phoneNumber) {
    return Event("updateContactInfoEvent", {username: username, addressInfo: addressInfo, phoneNumber: phoneNumber});
}

ctx.registerEffect('updateContactInfoEvent', function (data) {
    let customer = ctx.getEntityById(data.username);
    customer.addressInfo = data.addressInfo;
    customer.phoneNumber = data.phoneNumber;
});

ctx.bthread('Allow customers to update their contact information', 'Customer', function (customer) {
    while (true) {
        sync({waitFor: [updateContactInfoEvent(customer.username, customer.addressInfo, customer.phoneNumber)]});
    }
});


/*
Customers will be able to retrieve their purchase history through their accounts.
*/
function retrievePurchaseHistoryEvent(username) {
    return Event("retrievePurchaseHistoryEvent", {username: username});
}

ctx.bthread('Retrieve purchase history', 'Customer.loggedIn', function (customer) {
    sync({waitFor: [retrievePurchaseHistoryEvent(customer.username)]});
    sync({request: [displayPurchaseHistoryEvent(customer.username, customer.purchaseHistory)]});
});

function displayPurchaseHistoryEvent(username, purchaseHistory) {
    return Event("displayPurchaseHistoryEvent", {username: username, purchaseHistory: purchaseHistory});
}
/*
Summery of existing events you can use if needed:
1. createAccountEvent(username, password, creditCardNumber, addressInfo, phoneNumber) - has effect
2. updateContactInfoEvent(username, addressInfo, phoneNumber)  - has effect
3. retrievePurchaseHistoryEvent(username)
4. displayPurchaseHistoryEvent(username, purchaseHistory)
*/
/*
Customers will be able to log into their accounts, and get indicated of the action outcome. 
*/
function loginEvent(username, password) {
    return Event("loginEvent", {username: username, password: password});
}

ctx.registerEffect('loginEvent', function (data) {
    let customer = ctx.getEntityById(data.username);
    if (customer && customer.password === data.password) {
        customer.isLoggedIn = true;
    }
});

ctx.bthread('Notify login status', 'Customer', function (customer) {
    while (true) {
    let event = sync({waitFor: [loginEvent(customer.username, customer.password)]});
    if (customer.isLoggedIn) {
        sync({request: [loginSuccessfulEvent(customer.username)]});
    } else {
        sync({request: [loginFailedEvent(customer.username)]});
    }
    }
});

function loginSuccessfulEvent(username) {
    return Event("loginSuccessfulEvent", {username: username});
}

function loginFailedEvent(username) {
    return Event("loginFailedEvent", {username: username});
}
/*
Customers will be able to log out of their accounts.
*/
function logoutEvent(username) {
    return Event("logoutEvent", {username: username});
}

ctx.registerEffect('logoutEvent', function (data) {
    let customer = ctx.getEntityById(data.username);
    if (customer) {
        customer.isLoggedIn = false;
    }
});
/*
Logged out customers can't logout. 
*/
ctx.bthread('Prevent logout for logged out customers', 'Customer.loggedOut', function (customer) {
    sync({block: [logoutEvent(customer.username)]});
});

/*
Logged in customers cannot login again.
*/
ctx.bthread('Prevent logged in customers from logging in', 'Customer.loggedIn', function (customer) {
    sync({block: [loginEvent(customer.username, customer.password)]});
});
/*
Administrators will be able to update the categories in the inventory management system.
*/
function updateCategoryEvent(adminUsername, categoryName, subCategories) {
    return Event("updateCategoryEvent", {
        adminUsername: adminUsername,
        categoryName: categoryName,
        subCategories: subCategories
    });
}

ctx.registerEffect('updateCategoryEvent', function (data) {
    let category = ctx.getEntityById(data.categoryName);
    if (category) {
        category.subCategories = data.subCategories;
    }
});


/*
Administrators will be able to update the products category.
*/
function updateProductCategoryEvent(adminUsername, productName, newCategory) {
    return Event("updateProductCategoryEvent", {
        adminUsername: adminUsername,
        productName: productName,
        newCategory: newCategory
    });
}

ctx.registerEffect('updateProductCategoryEvent', function (data) {
    let product = ctx.getEntityById(data.productName);
    if (product) {
        product.category = data.newCategory;
    }
});
/*
Administrators will be able to update the specific detail(price) of each product.
*/
function updateProductPriceEvent(adminUsername, productName, newPrice) {
    return Event("updateProductPriceEvent", {
        adminUsername: adminUsername,
        productName: productName,
        newPrice: newPrice
    });
}

ctx.registerEffect('updateProductPriceEvent', function (data) {
    let product = ctx.getEntityById(data.productName);
    if (product) {
        product.price = data.newPrice;
    }
});

/*
All administrators actions are only possible if the administrator is logged in. 

//All administrators actions are not possible if the administrator is not logged in.

*/
ctx.bthread('Restrict administrator actions to logged-in status', 'Administrator.loggedOut', function (admin) {
    sync({
        block: [
            anyEventNameWithData("updateCategoryEvent", {adminUsername: admin.username}),
            anyEventNameWithData("updateProductCategoryEvent", {adminUsername: admin.username}),
            anyEventNameWithData("updateProductPriceEvent", {adminUsername: admin.username})
        ]
    });
});

/*
Customers will be able to add products into the shopping cart.
*/
function addProductToCartEvent(username, productName) {
    return Event("addProductToCartEvent", {username: username, productName: productName});
}

ctx.registerEffect('addProductToCartEvent', function (data) {
    let customer = ctx.getEntityById(data.username);
    let product = ctx.getEntityById(data.productName);
    if (customer && product) {
        customer.shoppingCart.push(product);
    }
});
/*
The shopping cart will display the number of items in the cart and the total cost.
*/
function displayCartContentsEvent(username) {
    return Event("displayCartContentsEvent", {username: username});
}

ctx.bthread('Display shopping cart contents', 'Customer.loggedIn', function (customer) {
    while (true) {
        
    sync({waitFor: [displayCartContentsEvent(customer.username)]});
    let totalCost = customer.shoppingCart.reduce((sum, product) => sum + product.price, 0);
    let itemCount = customer.shoppingCart.length;
    sync({request: [showCartDetailsEvent(customer.username, itemCount, totalCost)]});
    }
});

function showCartDetailsEvent(username, itemCount, totalCost) {
    return Event("showCartDetailsEvent", {username: username, itemCount: itemCount, totalCost: totalCost});
}
/*
Customers will be able to or remove products from the shopping cart.
*/
function removeProductFromCartEvent(username, productName) {
    return Event("removeProductFromCartEvent", {username: username, productName: productName});
}


ctx.registerEffect('removeProductFromCartEvent', function (data) {
    let customer = ctx.getEntityById(data.username);
    let productIndex = customer.shoppingCart.findIndex(product => product.name === data.productName);
    if (productIndex !== -1) {
        customer.shoppingCart.splice(productIndex, 1);
    }
});
/*
After customer requests to checkout, a billing request is sent to its credit card number. if credit card approves the transaction, the customer will receive an email confirmation of his purchase .*/

function checkoutEvent(username) {
    return Event("checkoutEvent", {username: username});
}

function billingRequestEvent(username, amount) {
    return Event("billingRequestEvent", {username: username, amount: amount});
}

function billingApprovedEvent(username) {
    return Event("billingApprovedEvent", {username: username});
}

function sendConfirmationEmailEvent(username) {
    return Event("sendConfirmationEmailEvent", {username: username});
}

ctx.bthread('Handle checkout process', 'Customer.loggedIn', function (customer) {
    while(true) {
        sync({waitFor: [checkoutEvent(customer.username)]});
        let totalCost = customer.shoppingCart.reduce((sum, product) => sum + product.price, 0);
        sync({request: [billingRequestEvent(customer.username, totalCost)]});
        sync({waitFor: [billingApprovedEvent(customer.username)]});
        sync({request: [sendConfirmationEmailEvent(customer.username)]});
    }
});

ctx.registerEffect('billingApprovedEvent', function (data) {
    let customer = ctx.getEntityById(data.username);
    if (customer) {
        customer.purchaseHistory.push(...customer.shoppingCart);
        customer.shoppingCart = [];  // Clear the shopping cart after purchase
    }
});

