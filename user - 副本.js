///////////数据链接池的链接///////////////////
var Db=require('./db');
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
var crypto=require('crypto');
function User(user)//函数对象
{
    this.name=user.name;
    this.password=user.password;
    this.email=user.email;
};
module.exports=User;
////////////////存储用户信息 对象原型
User.prototype.save=function(callback){
    //添加注册用户的头像
    var md5 = crypto.createHash('md5');
    email_MD5=md5.update(this.email.toLowerCase()).digest('hex'),
    head="http://www.gravatar.com/avatar/"+email_MD5+"?s=48";
    //要存入数据库的文档信息
            var user={
                name:this.name,
                password:this.password,
                email:this.email,
                head:head
            };
        //打开数据库
       pool.acquire(function (err, db) {
            if (err) {
                return callback(err);
            };
            //读取users集合
            db.collection('users',function(err,collection){
                if (err) {
                  //  pool.release(db);
                    return callback(err);
                };
                //将用户数据插入users集合
                collection.insert(user,function(err,user){
                    pool.release(db);
                    if (err) {
                        return callback(err);
                    };
                    callback(null,user[0]);
                
                });
            });
        });
};

///////////////////读取用户信息
User.get=function(name,callback){
    //打开数据库
   pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        };
        //读取users集合
        db.collection('users',function(err,collection){
            if (err) {
                pool.release(db);
                return callback(err);
            };
            //查找用户名
            collection.findOne({name:name},function(err,user){
                pool.release(db);
                if (err) {
                    return callback(err);
                };
                callback(null,user);
            });
        });
    });
};
