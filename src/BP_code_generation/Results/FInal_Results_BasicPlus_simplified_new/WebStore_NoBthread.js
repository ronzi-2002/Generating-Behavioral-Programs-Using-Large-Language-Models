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
 5. Logged in administrator
 6. Logged out administrator
*/

ctx.registerQuery('Customer', entity => entity.type == 'customer');
ctx.registerQuery('Customer.loggedIn', entity => entity.type == 'customer' && entity.isLoggedIn);
ctx.registerQuery('Customer.loggedOut', entity => entity.type == 'customer' && !entity.isLoggedIn);
ctx.registerQuery('Administrator', entity => entity.type == 'administrator');
ctx.registerQuery('Administrator.loggedIn', entity => entity.type == 'administrator' && entity.isLoggedIn);
ctx.registerQuery('Administrator.loggedOut', entity => entity.type == 'administrator' && !entity.isLoggedIn);
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


/*
Customers will be able to retrieve their purchase history through their accounts.
*/
function retrievePurchaseHistoryEvent(username) {
    return Event("retrievePurchaseHistoryEvent", {username: username});
}

ctx.bthread('Retrieve purchase history', 'Customer.loggedIn', function (customer) {
    while (true) {
        sync({waitFor: [retrievePurchaseHistoryEvent(customer.username)]});
        sync({request: [displayPurchaseHistoryEvent(customer.username, customer.purchaseHistory)]});
    }
});

function displayPurchaseHistoryEvent(username, purchaseHistory) {
    return Event("displayPurchaseHistoryEvent", {username: username, purchaseHistory: purchaseHistory});
}
/*
Customers will be able to log into their account.The login process is as follows. The customers will provide their username and password. If it is correct,a random 4 digit code will be sent to the customers phone number. The customer will need to provide the code to login successfully.
*/
/*
function loginRequestEvent(username, password) {
    return Event("loginRequestEvent", {username: username, password: password});
}

function sendVerificationCodeEvent(username, code) {
    return Event("sendVerificationCodeEvent", {username: username, code: code});
}

function verifyCodeEvent(username, code) {
    return Event("verifyCodeEvent", {username: username, code: code});
}

function loginSuccessEvent(username) {
    return Event("loginSuccessEvent", {username: username});
}

ctx.bthread('Handle login request', 'Customer', function (customer) {
    while (true) {
        let loginRequest = sync({waitFor: [loginRequestEvent(customer.username)]});
        if (loginRequest.data.password === customer.password) {
            let code = Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit code
            sync({request: [sendVerificationCodeEvent(customer.username, code)]});
            let verification = sync({waitFor: [verifyCodeEvent(customer.username, code)]});
            if (verification.data.code === code) {
                sync({request: [loginSuccessEvent(customer.username)]});
            }
        }
    }
});

ctx.registerEffect('sendVerificationCodeEvent', function (data) {
    let customer = ctx.getEntityById(data.username);
    // Simulate sending code to customer's phone number
});

ctx.registerEffect('loginSuccessEvent', function (data) {
    let customer = ctx.getEntityById(data.username);
    customer.isLoggedIn = true;
});
*/
function loginRequestEvent(username, password) {
    return Event("loginRequestEvent", {username: username, password: password});
}

function sendVerificationCodeEvent(username, code) {
    return Event("sendVerificationCodeEvent", {username: username, code: code});
}

function verifyCodeEvent(username, code) {
    return Event("verifyCodeEvent", {username: username, code: code});
}

function loginSuccessEvent(username) {
    return Event("loginSuccessEvent", {username: username});
}

ctx.bthread('Handle login request', 'Customer', function (customer) {
    while (true) {
        let loginRequest = sync({waitFor: [anyEventNameWithData("loginRequestEvent", {username: customer.username})]});
        if (loginRequest.data.password === customer.password) {
            let code = Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit code
            sync({request: [sendVerificationCodeEvent(customer.username, code)]});
            let verification = sync({waitFor: [anyEventNameWithData("verifyCodeEvent", {username: customer.username, code: code})]});
            if (verification.data.code === code) {
                sync({request: [loginSuccessEvent(customer.username)]});
            }
        }
    }
});

ctx.registerEffect('sendVerificationCodeEvent', function (data) {
    let customer = ctx.getEntityById(data.username);
    // Simulate sending code to customer's phone number
});

ctx.registerEffect('loginSuccessEvent', function (data) {
    let customer = ctx.getEntityById(data.username);
    customer.isLoggedIn = true;
});
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
/*
Logged out customers can't logout. 
*/
ctx.bthread('Prevent logged out customers from logging out', 'Customer.loggedOut', function (customer) {
    while (true) {
        sync({block: [logoutEvent(customer.username)]});
    }
});

/*
Logged in customers cannot login again.
*/
ctx.bthread('Prevent logged in customers from logging in again', 'Customer.loggedIn', function (customer) {
    while (true) {
        sync({block: [loginRequestEvent(customer.username, customer.password)]});
    }
});
/*
Administrators will be able to update the categories in the inventory management system.
*/
function updateCategoryEvent(categoryName, subCategories) {
    return Event("updateCategoryEvent", {categoryName: categoryName, subCategories: subCategories});
}

ctx.registerEffect('updateCategoryEvent', function (data) {
    let category = ctx.getEntityById(data.categoryName);
    category.subCategories = data.subCategories;
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
/*
ctx.bthread('Block administrator actions if not logged in', 'Administrator.loggedOut', function (admin) {
    while (true) {
        sync({
            block: [
                updateCategoryEvent(admin.id, anyString, anyArray),
                updateProductCategoryEvent(admin.id, anyString, anyString),
                updateProductPriceEvent(admin.id, anyString, anyNumber)
            ]
        });
    }
});
*/
//After Post-Processing
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
    customer.shoppingCart.push({
        productName: product.name,
        price: product.price,
        category: product.category
    });
});
/*
The shopping cart will display the number of items in the cart and the total cost.
*/
function displayCartDetailsEvent(username) {
    return Event("displayCartDetailsEvent", {username: username});
}

ctx.bthread('Display shopping cart details', 'Customer', function (customer) {
    while (true) {
        sync({waitFor: [displayCartDetailsEvent(customer.username)]});
        let totalItems = customer.shoppingCart.length;
        let totalCost = customer.shoppingCart.reduce((sum, item) => sum + item.price, 0);
        sync({request: [showCartDetailsEvent(customer.username, totalItems, totalCost)]});
    }
});

function showCartDetailsEvent(username, totalItems, totalCost) {
    return Event("showCartDetailsEvent", {username: username, totalItems: totalItems, totalCost: totalCost});
}
/*
Customers will be able to remove products from the shopping cart.
*/
function removeProductFromCartEvent(username, productName) {
    return Event("removeProductFromCartEvent", {username: username, productName: productName});
}

ctx.registerEffect('removeProductFromCartEvent', function (data) {
    let customer = ctx.getEntityById(data.username);
    customer.shoppingCart = customer.shoppingCart.filter(item => item.productName !== data.productName);
});
/*
After customer requests to checkout, a billing request is sent to its credit card number. If the bank approves the transaction, the customer will receive an email confirmation of his purchase . 
*/


function checkoutRequestEvent(username) {
    return Event("checkoutRequestEvent", {username: username});
}

function billingRequestEvent(username, amount) {
    return Event("billingRequestEvent", {username: username, amount: amount});
}

function bankApprovalEvent(username) {
    return Event("bankApprovalEvent", {username: username});
}

function sendConfirmationEmailEvent(username) {
    return Event("sendConfirmationEmailEvent", {username: username});
}

ctx.bthread('Handle checkout process', 'Customer.loggedIn', function (customer) {
    while (true) {
        sync({waitFor: [checkoutRequestEvent(customer.username)]});
        let totalCost = customer.shoppingCart.reduce((sum, item) => sum + item.price, 0);
        sync({request: [billingRequestEvent(customer.username, totalCost)]});
        sync({waitFor: [bankApprovalEvent(customer.username)]});
        sync({request: [sendConfirmationEmailEvent(customer.username)]});
    }
});

