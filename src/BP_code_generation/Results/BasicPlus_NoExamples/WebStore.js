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

ctx.bthread('Support customer account creation', function () {
    while (true) {
        sync({waitFor: [anyEventNameWithData("createAccountEvent")]});
    }
});
/*
Customers will be able to configure and update their contact information within their profiles.
*/
function updateContactInfoEvent(username, addressInfo, phoneNumber) {
    return Event("updateContactInfoEvent", {
        username: username,
        addressInfo: addressInfo,
        phoneNumber: phoneNumber
    });
}

ctx.registerEffect('updateContactInfoEvent', function (data) {
    let customer = ctx.getEntityById(data.username);
    customer.addressInfo = data.addressInfo;
    customer.phoneNumber = data.phoneNumber;
});

ctx.bthread('Allow customers to update their contact information', 'Customer', function (customer) {
    while (true) {
        sync({waitFor: [anyEventNameWithData("updateContactInfoEvent", {username: customer.username})]});
    }
});

/*
Customers will be able to get their purchase history through their accounts.
*/
ctx.bthread('Allow customers to access their purchase history', 'Customer', function (customer) {
    while (true) {
        sync({waitFor: [anyEventNameWithData("requestPurchaseHistoryEvent", {username: customer.username})]});
        sync({request: [providePurchaseHistoryEvent(customer.username, customer.purchaseHistory)]});
    }
});

function requestPurchaseHistoryEvent(username) {
    return Event("requestPurchaseHistoryEvent", {username: username});
}

function providePurchaseHistoryEvent(username, purchaseHistory) {
    return Event("providePurchaseHistoryEvent", {username: username, purchaseHistory: purchaseHistory});
}
/*
Customers will be able to log into their accounts.
*/
function loginEvent(username, password) {
    return Event("loginEvent", {
        username: username,
        password: password
    });
}

ctx.registerEffect('loginEvent', function (data) {
    let customer = ctx.getEntityById(data.username);
    if (customer.password === data.password) {
        customer.isLoggedIn = true;
    }
});

ctx.bthread('Support customer login', function () {
    while (true) {
        let event = sync({waitFor: [anyEventNameWithData("loginEvent")]});
        let customer = ctx.getEntityById(event.data.username);
        if (customer && customer.password === event.data.password) {
            sync({request: [loginSuccessEvent(customer.username)]});
        } else {
            sync({request: [loginFailureEvent(customer.username)]});
        }
    }
});

function loginSuccessEvent(username) {
    return Event("loginSuccessEvent", {username: username});
}

function loginFailureEvent(username) {
    return Event("loginFailureEvent", {username: username});
}
/*
Customers will be able to log out of their accounts.
*/
function logoutEvent(username) {
    return Event("logoutEvent", {username: username});
}

ctx.registerEffect('logoutEvent', function (data) {
    let customer = ctx.getEntityById(data.username);
    customer.isLoggedIn = false;
});

ctx.bthread('Support customer logout', 'Customer', function (customer) {
    while (true) {
        sync({waitFor: [anyEventNameWithData("logoutEvent", {username: customer.username})]});
    }
});

/*
Logged out customers can't logout. 
*/
ctx.bthread('Prevent logged out customers from logging out', 'Customer.loggedOut', function (customer) {
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
/*
Administrators will be able to update the products placed in categories.
*/
/*
Administrators will be able to update the specific details of each product.
*/
/*
Customers will be able to add products into the shopping cart.
*/
/*
The shopping cart will display the number of items in the cart and the total cost.
*/
/*
Customers will be able to add or remove products from the shopping cart before checkout and order confirmation.
*/
/*
Customers will be able to confirm the order after checkout. If the order is incorrect, the customer will be able to revise and update their order. The customer will then receive a confirmation email with the specific order details.
*/

