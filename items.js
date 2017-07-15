'use strict';
var MongoClient = require('mongodb').MongoClient, assert = require('assert');

function ItemDAO(database) {

    this.db = database;
    this.getCategories = function(callback) {

        var categories = [{
            _id: 'All',
            num: 0
        }];

        let counter = 0;

        // I want only the categories returned
        // I will then find the total number of items in each category
        // keep track of the total sum, add it to categories[0].num

        var cursor = this.db.collection('item').aggregate({
            // change this so there's a document for category
            // add so that num is $adding instances of it
            // store
        })
            .sort({'title': 1});

        cursor.forEach((doc) => {

            let category = {
                _id: doc.title,
                num: 1
            };

            counter++;
            categories.push(category);
        }, () => {

            categories[0].num = counter;
            callback(categories);
        });

        /*
         * TODO-lab1A
         * Write an aggregation query on the "item" collection to return the
         * total number of items in each category. The documents in the array
         * output by your aggregation should contain fields for "_id" and "num".
         */
    };


    this.getItems = function(category, page, itemsPerPage, callback) {

        let findParams = {};
        let pageItems = [];

        if (category !== 'All') {

            findParams = {
                category: 'Kitchen'
            };
        }

        let cursor = this.db.collection('item').find(findParams)
            .skip(page * itemsPerPage)
            .limit(itemsPerPage)
            .sort({'_id': 1});

        cursor.forEach((doc) => {

            pageItems.push(doc);
        }, () => {

            callback(pageItems);
        });
        /*
         * TODO-lab1B
         *
         * LAB #1B: Implement the getItems() method.
         *
         * Create a query on the "item" collection to select only the items
         * that should be displayed for a particular page of a given category.
         * The category is passed as a parameter to getItems().
         *
         * Use sort(), skip(), and limit() and the method parameters: page and
         * itemsPerPage to identify the appropriate products to display on each
         * page. Pass these items to the callback function.
         *
         * Sort items in ascending order based on the _id field. You must use
         * this sort to answer the final project questions correctly.
         *
         */
    };


    this.getNumItems = function(category, callback) {
        "use strict";

        var numItems = 0;

        /*
         * TODO-lab1C:
         *
         * LAB #1C: Implement the getNumItems method()
         *
         * Write a query that determines the number of items in a category
         * and pass the count to the callback function. The count is used in
         * the mongomart application for pagination. The category is passed
         * as a parameter to this method.
         *
         * See the route handler for the root path (i.e. "/") for an example
         * of a call to the getNumItems() method.
         *
         */

        // TODO Include the following line in the appropriate
        // place within your code to pass the count to the callback.
        callback(numItems);
    }


    this.searchItems = function(query, page, itemsPerPage, callback) {
        "use strict";
        console.log('search');

        /*
         * TODO-lab2A
         *
         * LAB #2A: Implement searchItems()
         *
         * Using the value of the query parameter passed to searchItems(),
         * perform a text search against the "item" collection.
         *
         * Sort the results in ascending order based on the _id field.
         *
         * Select only the items that should be displayed for a particular
         * page. For example, on the first page, only the first itemsPerPage
         * matching the query should be displayed.
         *
         * Use limit() and skip() and the method parameters: page and
         * itemsPerPage to select the appropriate matching products. Pass these
         * items to the callback function.
         *
         * searchItems() depends on a text index. Before implementing
         * this method, create a SINGLE text index on title, slogan, and
         * description. You should simply do this in the mongo shell.
         *
         */

        var item = this.createDummyItem();
        var items = [];
        for (var i = 0; i < 5; i++) {
            items.push(item);
        }

        // TODO-lab2A Replace all code above (in this method).

        // TODO Include the following line in the appropriate
        // place within your code to pass the items for the selected page
        // of search results to the callback.
        callback(items);
    }


    this.getNumSearchItems = function(query, callback) {
        "use strict";

        var numItems = 0;

        /*
         * TODO-lab2B
         *
         * LAB #2B: Using the value of the query parameter passed to this
         * method, count the number of items in the "item" collection matching
         * a text search. Pass the count to the callback function.
         *
         * getNumSearchItems() depends on the same text index as searchItems().
         * Before implementing this method, ensure that you've already created
         * a SINGLE text index on title, slogan, and description. You should
         * simply do this in the mongo shell.
         */

        callback(numItems);
    }


    this.getItem = function(itemId, callback) {
        "use strict";

        /*
         * TODO-lab3
         *
         * LAB #3: Implement the getItem() method.
         *
         * Using the itemId parameter, query the "item" collection by
         * _id and pass the matching item to the callback function.
         *
         */

        var item = this.createDummyItem();

        // TODO-lab3 Replace all code above (in this method).

        // TODO Include the following line in the appropriate
        // place within your code to pass the matching item
        // to the callback.
        callback(item);
    }


    this.getRelatedItems = function(callback) {
        "use strict";

        this.db.collection("item").find({})
            .limit(4)
            .toArray(function(err, relatedItems) {
                assert.equal(null, err);
                callback(relatedItems);
            });
    };


    this.addReview = function(itemId, comment, name, stars, callback) {
        "use strict";

        /*
         * TODO-lab4
         *
         * LAB #4: Implement addReview().
         *
         * Using the itemId parameter, update the appropriate document in the
         * "item" collection with a new review. Reviews are stored as an
         * array value for the key "reviews". Each review has the fields:
         * "name", "comment", "stars", and "date".
         *
         */

        var reviewDoc = {
            name: name,
            comment: comment,
            stars: stars,
            date: Date.now()
        }

        // TODO replace the following two lines with your code that will
        // update the document with a new review.
        var doc = this.createDummyItem();
        doc.reviews = [reviewDoc];

        // TODO Include the following line in the appropriate
        // place within your code to pass the updated doc to the
        // callback.
        callback(doc);
    }


    this.createDummyItem = function() {
        "use strict";

        var item = {
            _id: 1,
            title: "Gray Hooded Sweatshirt",
            description: "The top hooded sweatshirt we offer",
            slogan: "Made of 100% cotton",
            stars: 0,
            category: "Apparel",
            img_url: "/img/products/hoodie.jpg",
            price: 29.99,
            reviews: []
        };

        return item;
    }
}


module.exports.ItemDAO = ItemDAO;
