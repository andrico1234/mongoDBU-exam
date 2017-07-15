'use strict';

const assert = require('assert'),
    bodyParser = require('body-parser'), {CartDAO} = require('./cart'),
    express = require('express'), {ItemDAO} = require('./items'), {MongoClient} = require('mongodb'),
    nunjucks = require('nunjucks');

let app = express();
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use('/static', express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded({extended: true}));

const env = nunjucks.configure('views', {
    autoescape: true,
    express: app
});

const nunjucksDate = require('nunjucks-date');
nunjucksDate.setDefaultFormat('MMMM Do YYYY, h:mm:ss a');
env.addFilter("date", nunjucksDate);

const ITEMS_PER_PAGE = 5;
const USERID = "558098a65133816958968d88";

MongoClient.connect('mongodb://localhost:27017/mongomart', function(err, db) {

    assert.equal(null, err);
    console.log("Successfully connected to MongoDB.");

    let items = new ItemDAO(db);
    let cart = new CartDAO(db);

    const router = express.Router();

    router.get("/", function(req, res) {

        var page = req.query.page ? parseInt(req.query.page) : 0;
        var category = req.query.category ? req.query.category : "All";

        items.getCategories(function(categories) {

            items.getItems(category, page, ITEMS_PER_PAGE, function(pageItems) {

                items.getNumItems(category, function(itemCount) {

                    let numPages = 0;
                    if (itemCount > ITEMS_PER_PAGE) {
                        numPages = Math.ceil(itemCount / ITEMS_PER_PAGE);
                    }

                    res.render('home', {
                        category_param: category,
                        categories: categories,
                        useRangeBasedPagination: false,
                        itemCount: itemCount,
                        pages: numPages,
                        page: page,
                        items: pageItems
                    });

                });
            });
        });
    });


    router.get("/search", function(req, res) {

        var page = req.query.page ? parseInt(req.query.page) : 0;
        var query = req.query.query ? req.query.query : "";

        items.searchItems(query, page, ITEMS_PER_PAGE, function(searchItems) {

            items.getNumSearchItems(query, function(itemCount) {

                var numPages = 0;

                if (itemCount > ITEMS_PER_PAGE) {
                    numPages = Math.ceil(itemCount / ITEMS_PER_PAGE);
                }

                res.render('search', {
                    queryString: query,
                    itemCount: itemCount,
                    pages: numPages,
                    page: page,
                    items: searchItems
                });

            });
        });
    });

    router.get("/item/:itemId", function(req, res) {

        var itemId = parseInt(req.params.itemId);

        items.getItem(itemId, function(item) {

            if (item == null) {
                res.status(404).send("Item not found.");
                return;
            }

            var stars = 0;
            var numReviews = 0;
            var reviews = [];

            if ("reviews" in item) {
                numReviews = item.reviews.length;

                for (var i = 0; i < numReviews; i++) {
                    var review = item.reviews[i];
                    stars += review.stars;
                }

                if (numReviews > 0) {
                    stars = stars / numReviews;
                    reviews = item.reviews;
                }
            }

            items.getRelatedItems(function(relatedItems) {

                //console.log('related', relatedItems);
                res.render("item", {
                    userId: USERID,
                    item: item,
                    stars: stars,
                    reviews: reviews,
                    numReviews: numReviews,
                    relatedItems: relatedItems
                });
            });
        });
    });

    router.post("/item/:itemId/reviews", function(req, res) {

        var itemId = parseInt(req.params.itemId);
        var review = req.body.review;
        var name = req.body.name;
        var stars = parseInt(req.body.stars);

        items.addReview(itemId, review, name, stars, function(itemDoc) {
            res.redirect("/item/" + itemId);
        });
    });

    router.get("/cart", function(req, res) {

        res.redirect("/user/" + USERID + "/cart");
    });


    router.get("/user/:userId/cart", function(req, res) {

        let userId = req.params.userId;
        cart.getCart(userId, function(userCart) {

            let total = cartTotal(userCart);

            console.log('total', total);
            res.render("cart", {
                userId: userId,
                updated: false,
                cart: userCart,
                total: total
            });
        });
    });


    router.post("/user/:userId/cart/items/:itemId", function(req, res) {

        var userId = req.params.userId;
        var itemId = parseInt(req.params.itemId);

        var renderCart = function(userCart) {
            var total = cartTotal(userCart);
            res.render("cart", {
                userId: userId,
                updated: true,
                cart: userCart,
                total: total
            });
        };

        cart.itemInCart(userId, itemId, function(item) {
            if (item == null) {
                items.getItem(itemId, function(item) {
                    item.quantity = 1;
                    cart.addItem(userId, item, function(userCart) {
                        renderCart(userCart);
                    });

                });
            } else {
                cart.updateQuantity(userId, itemId, item.quantity + 1, function(userCart) {
                    renderCart(userCart);
                });
            }
        });
    });


    router.post("/user/:userId/cart/items/:itemId/quantity", function(req, res) {

        var userId = req.params.userId;
        var itemId = parseInt(req.params.itemId);
        var quantity = parseInt(req.body.quantity);

        cart.updateQuantity(userId, itemId, quantity, function(userCart) {
            var total = cartTotal(userCart);
            res.render("cart", {
                userId: userId,
                updated: true,
                cart: userCart,
                total: total
            });
        });
    });


    function cartTotal(userCart) {

        let total = 0;
        console.log(userCart.items);

        for (let i = 0; i < userCart.items.length; i++) {
            var item = userCart.items[i];
            total += item.price * item.quantity;

            console.log('i', i);
            console.log('total', total);
        }

        return total;
    }

    app.use('/', router);

    // Start the server listening
    var server = app.listen(3000, function() {

        const port = server.address().port;
        console.log('Mongomart server listening on port %s.', port);
    });
});
