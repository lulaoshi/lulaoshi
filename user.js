var crypto = require('crypto');
var async = require('async');
var Db=require('./db');
///////////数据链接池的链接///////////////////
var poolModule = require('generic-pool');
var pool = poolModule.Pool({
    name : 'mongoPool',
    create : function(callback) {
    var mongodb = Db();
    mongodb.open(function (err, db) {
    callback(err, db);
    })
},
    destroy : function(mongodb) {
        mongodb.close();
    },
    max : 100,
    min : 5,
    idleTimeoutMillis : 30000,
    log : true
});

////////////////////////////////

function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
};
    module.exports = User;
    User.prototype.save = function(callback) {
        var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
        head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
        var user =
        {
            name: this.name,
            password: this.password,
            email: this.email,
            head: head
        };
    async.waterfall([
        function (cb) {
            pool.acquire(function (err, db) {
            cb(err, db);
            });
        },
        function (db, cb) {
                db.collection('users', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
                collection.insert(user, {
                safe: true
                }, function (err, user) {
                    cb(err, user);
            });
        }
    ], function (err, user) {
            pool.release(db);
            callback(err, user[0]);
        });
    };
User.get = function(name, callback) {
        async.waterfall([
        function (cb) {
            pool.acquire(function (err, db) {
            cb(err, db);
        });
    },
    function (db, cb) {
            db.collection('users', function (err, collection) {
            cb(err, collection);
        });
    },
    function (collection, cb) {
        collection.findOne({
        name: name
    }, function (err, user) {
        cb(err, user);
    });
    }
], function (err, user) {
       // pool.release(db);
        callback(err, user);
    });
};
