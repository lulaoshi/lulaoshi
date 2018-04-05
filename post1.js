//返回原始发表的内容（markdown 格式）
Post.edit = function(name, day, title, callback) {
//打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        //根据用户名、发表日期及文章名进行查询
        collection.findOne({
            "name": name,
            "time.day": day,
            "title": title
            }, function (err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, doc);//返回查询的一篇文章（markdown 格式）
            });
        });
    });
};

