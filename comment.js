    //var mongodb=require('./db');
    var ObjectID=require('mongodb').ObjectID;
   //-------------数据库链接池文件-----
    var Db = require('./db');
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
    //-----------------连接池文件结束-------------------
    function Comment(_id,comment){
      //  this.name=name;
      //  this.day=day;
       // this.title=title;
       this._id=new ObjectID(_id);
       this.comment=comment;
    }
    module.exports=Comment;
    //存储一条留言信息
    Comment.prototype.save=function(callback){
       // var name=this.name,
       //     day=this.day,
        //    title=this.title,
            var _id=this._id;
            comment=this.comment;
        //打开数据库
         pool.acquire(function(err, db){
            if (err) {
                return callback(err);
            };
            //读取posts集合
            db.collection('posts',function(err,collection){
                if (err) {
                     pool.release(db);
                     return callback(err);
                };
 //通过用户名，时间及标题查找文档，并把一条留言对象添加到文档的comments数组里
                collection.update({
                 //   "name":name,
                 //   "time.day":day,
                 //   "title":title
                        "_id":_id
                },{$push:{"comments":comment}},function(err){
                         pool.release(db);
                        if (err) {
                            return callback(err);
                        };
                        callback(null);
                    })
                });
            });
 };
