'use strict';

const assert = require('assert');

function ItemDAO(database) {

    let searchItemCount = 0;

    this.db = database;
    this.getCategories = (callback) => {

        let categories = [{
            _id: 'All',
            num: 0
        }];

        let cursor = this.db.collection('item').aggregate([{
            $group: {
                _id: "$category",
                count: {$sum: 1},
            }
        }, {
            $sort: {_id: 1}
        }]);

        let counter = 0;

        this.db.collection('item').find().forEach(() => {

            counter++;
        }, () => {

            categories[0].num = counter;
        });

        cursor.forEach((doc) => {

            let category = {
                _id: doc._id,
                num: doc.count
            };

            categories.push(category);
        }, () => {

            callback(categories);
        });
    };

    this.getItems = (category, page, itemsPerPage, callback) => {

        let findParams = {};
        let pageItems = [];

        if (category !== 'All') {

            findParams = {
                category: 'Apparel'
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
    };

    this.getNumItems = (category, callback) => {

        let findParams = {};
        let numItems = 0;

        if (category !== 'All') {

            findParams = {
                category: 'Apparel'
            };
        }

        let cursor = this.db.collection('item').find(findParams);

        cursor.forEach(() => {

            numItems++;
        }, () => {

            callback(numItems);
        });
    };

    this.searchItems = (query, page, itemsPerPage, callback) => {

        let items = [];
        let regexQuery = {
            $regex: `${query}`,
            $options: 'i'
        };

        searchItemCount = 0;

        let cursor = this.db.collection('item').find({
            $or: [{
                title: regexQuery
            }, {
                slogan: regexQuery
            }, {
                description: regexQuery
            }]
        })
            .skip(page * itemsPerPage)
            .limit(itemsPerPage)
            .sort({'_id': 1});

        cursor.forEach((doc) => {

            searchItemCount++;
            items.push(doc);
        }, () => {

            callback(items);
        });
    };

    this.getNumSearchItems = (query, callback) => {

        callback(searchItemCount);
    };

    this.getItem = function(itemId, callback) {

        this.db.collection('item').find({'_id': itemId}).forEach((doc) => {

            callback(doc);
        });
    };

    this.getRelatedItems = (callback) => {

        this.db.collection("item").find({})
            .limit(4)
            .toArray(function(err, relatedItems) {
                assert.equal(null, err);
                callback(relatedItems);
            });
    };

    this.addReview = (itemId, comment, name, stars, callback) => {

        let reviewDoc = {
            name: name,
            comment: comment,
            stars: stars,
            date: Date.now()
        };

        this.db.collection('item').update({'_id': itemId}, {$push: {'reviews': reviewDoc}});

        this.db.collection('item').find({'_id': itemId}).forEach((doc) => {

           doc.reviews = reviewDoc;
           callback(doc);
        });
    };
}

module.exports.ItemDAO = ItemDAO;
