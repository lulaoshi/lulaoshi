var ObjectID = require('mongodb').ObjectID;
///////////////使用连接池进行链接////////////////////////////
    var Db = require('./db');
   // var markdown = require('markdown').markdown;
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
///////////////////文章模型post对象
function Post(name,head,title,tags,post)
{
    this.name=name;
    this.head=head;
    this.title=title;
    this.tags=tags;//添加标签
    this.post=post;
}
module.exports=Post;
//存储一篇文章及相关信息
Post.prototype.save=function(callback){
    var date= new Date();
    //存储各种时间，方便扩展
    var time={
        date:date,
        year:date.getFullYear(),
        month:date.getFullYear()+'-'+(date.getMonth()+1),
        day:date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate(),
        minute:date.getFullYear()+"-"+(date.getMonth()+1)+'-'+date.getDate()+""+
        date.getHours()+":"+(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes()) 
    }
    //要存入数据库的文档
/*    var post={
        name:this.name,
        time:time,
        title:this.title,
        post:this.post,
        comments:[] //留言板
    };
    */
    //复制教程代码
var post = {
name: this.name,
head:this.head,
time: time,
title:this.title,
tags:this.tags,//发表文章添加标签
post: this.post,
comments: [],
reprint_info:{},
pv:0//增加PV统计
};
    //打开数据库 看，这是回调函数
   pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        };
        //读取posts集合
        db.collection('posts',function(err,collection){
            if (err) {
                pool.release(db);
                return callback(err);
            };
            //将文档插入posts集合
            collection.insert(post,{
                safe:true
            },function(err){
                pool.release(db);
                if (err) {
                    return callback(err);
                };
                callback(null);
            });
        });
    });
}
    //读取文章及其相关信息
    //获取一个人的所有文章 或获取所有人的文章
    Post.getTen=function(name,page,callback)
    {
        //打开数据库
       pool.acquire(function (err, db) {
            if (err) {
                return callback(err);
            };
            //读取posts集合
            db.collection('posts',function(err,collection){
                if (err) {
                    pool.release(db);
                    return callback(err);
                };
                var query={};
                if (name) {
                    query.name=name;
                };
                //使用count返回特定的查询次数total
                collection.count(query,function(err,total){
                //根据query对象查询文章,并跳过前(page-1)*10个结果，并返回后边的10个
                collection.find(query,{
                    skip:(page-1)*10,
                    limit:3
                }).sort({
                    time:-1
                }).toArray(function(err,docs){
                    pool.release(db);
                    if (err) {
                        return callback(err);
                    };
                 /*  docs.forEach(function(doc){
                        doc.post=markdown.toHTML(doc.post);
                    });
                    */
                    callback(null,docs,total);
                });
            });
          });
        });
     };  
    //获取一篇文章
    Post.getOne=function(_id,callback){
        //打开数据库
       pool.acquire(function (err, db) {
            if (err) {
                return callback(err);
            };
            //读取posts集合
            db.collection('posts',function(err,collection){
                if (err) {
                    pool.release(db);
                    return callback(err);
                };
                //根据用户名，发表日期及文章名进行查询
                collection.findOne({
                  //  "name":name,
                  //  "time.day":day,
                  //  "title":title
                  "_id":new ObjectID(_id)
                },function(err,doc){
                    if (err) {
                        pool.release(db);
                        return callback(err);
                    };
        if (doc) {
        //每访问1次，PV增加1
        collection.update({
          //  "name":name,
         // "time.day":day,
         //   "time":title
          "_id":new ObjectID(_id)
        },{
            $inc:{"pv":1}
        },function(err){
            pool.release(db);
            if (err) {
                return callback(err);
            }
        });
     /*   doc.post = markdown.toHTML(doc.post);
        
        if (doc.comments) {
            doc.comments.forEach(function (comment) {
            comment.content = markdown.toHTML(comment.content);
            });   
        }
        */

                    callback(null,doc);
        }
                });
            });
        
        });
    };

//对文章进行编辑和删除 返回原始发表的内容
    Post.edit=function(name,day,title,callback){
        //打开数据库
       pool.acquire(function (err, db) {
            if (err) {
                return callback(err);
            }; 
            //读取posts集合
            db.collection('posts',function(err,collection){
                if (err) {
                    mongo.close();
                    return callback(err);
                };
                //根据用户名，发表日期及文章名进行查询
                collection.findOne({
                    "name":name,
                    "time.day":day,
                    "title":title
                },function(err,doc){
                    pool.release(db);
                    if (err) {
                        return callback(err);
                    };
                    callback(null,doc);
                });
            });
        })
    };

//--------更新一篇文章及相关信息------------
Post.update=function(name,day,title,post,callback)
{
    //打开数据库
   pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        };
        //读取posts集合
        db.collection('posts',function(err,collection){
            if (err) {
                pool.release(db);
                return callback(err);
            };
            //更新文章内容
            collection.update({
                "name":name,
                "time.day":day,
                "title":title
            },{$set:{post:post}},function(err){
                pool.release(db);
                if (err) {
                    return callback(err);
                };
                callback(null);
            });
        })
    });
};
////////////////////////请独立完成删除模块//////////////////////////
Post.remove=function(name,day,title,callback){
//打开数据库
   pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        };
        //读取posts集合
        db.collection('posts',function(err,collection){
            if (err) {
                pool.release(db);
                return callback(err);
            }
            //根据用户名,日期和标题查找并删除一篇文章
            collection.remove({
                "name":name,
                "time.day":day,
                "title":title
            },{
                w:1
            },function(err){
                pool.release(db);
                if (err) {
                    return callback(err);
                };
                callback(null);//前边加一个return 
            });
        });
    });
};
////返回所有文章的存档信息////////////////////////////////////
Post.getArchive=function(callback){
    //打开数据库
   pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        };
        db.collection('posts',function(err,collection){
            if (err) {
                pool.release(db);
                return callback(err);
            };
            //返回只包含name,time,title属性的文档
            //组成的存储数组
            collection.find({},{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function(err,docs){
              pool.release(db);
              if (err) {
                return callback(err);
              };
              callback(null,docs);
            });
        });
    });
}
//获取所有的标签内容
Post.getTags=function(callback)
{
   pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        };
        db.collection('posts',function(err,collection){
                if (err) {
                    pool.release(db);
                    return callback(err);
                };
                collection.distinct('tags',function(err,docs){
                    pool.release(db);
                    if (err) {
                        return callback(err);
                    };
                    callback(null,docs);   
                })
        });
    })
}
//返回含有特定标签的文章
Post.getTag=function(tag,callback){
   pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        };
        db.collection('posts',function(err,collection){
            if (err) {
                pool.release(db);
                return callback(err);
            };
            //查询所有tags数组内包含的tag文档
            //并返回只包含name,time,title组成的数组
            collection.find({
                "tags":tag
            },{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function(err,docs){
                pool.release(db);
                if (err) {
                    return callback(err);
                };
                callback(null,docs);
            });
        });
    });
}
Post.search=function(keyword,callback){
   pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        };
        db.collection('posts',function(err,collection){
            if (err) {
                pool.release(db);
                return callback(err);
            };
            var pattern=new RegExp(keyword,"i");
            collection.find({
                'title':pattern
            },{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function(err,docs){
                pool.release(db);
                if (err) {
                    return callback(err);
                };
                callback(null,docs)
            });
        });
    });
};
//转载文章的模型数据
//这里我们在 Post.reprint() 内实现了被转载的原文章的更新和转载后文章的存储。
Post.reprint=function(reprint_from,reprint_to,callback){
   pool.acquire(function (err, db) {
        if (err) {
            return callback(err);
        };
        db.collection('posts',function(err,collection){
            if (err) {
                pool.release(db);
                return callback(err);
            };
            //找原文档
            collection.findOne({
                "name":reprint_from.name,
                "time.day":reprint_from.day,
                "title":reprint_from.title
            },function(err,doc){
                if (err) {
                    pool.release(db);
                    return callback(err);
                };
                var date = new Date();
                var time={
                    date:date,
                    year:date.getFullYear(),
                    month:date.getFullYear()+"-"+(date.getMonth()+1),
                    day:date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate(),
                    minute:date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+""+
                    date.getHours()+":"+(date.getMinutes()<10 ?'0' + date.getMinutes():date.getMinutes())
                }
                delete doc._id;//删掉原来的_id
                doc.name = reprint_to.name;
                doc.head = reprint_to.head;
                doc.time=time;
                doc.title=(doc.title.search(/[转载]/)>-1)?doc.title:"[转载]"+doc.title;
                doc.comments=[];
                doc.reprint_info={"reprint_from":reprint_from};
                doc.pv=0;
                //更新被转载的原文档的reprint_info内的reprint_to
                collection.update({
                    "name":reprint_from.name,
                    "time.day":reprint_from.day,
                    "title":reprint_from.title
                },{
                    $push:{
                        "reprint_info.reprint_to":{
                            "name":doc.name,
                            "day":time.day,
                            "title":doc.title
                        }
                    }
                },function(err){
                    if (err) {
                        pool.release(db);
                        return callback(err);
                    };
                });

                //将转载生成的副本修改后存入数据库，并返回存储后的文档
                collection.insert(doc,{
                    safe:true
                },function(err,post){
                    pool.release(db);
                    if (err) {
                        return callback(err);
                    };
                    callback(err,post[0]);
                });
            })
        });
    });
}
