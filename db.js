var settings = require('../settings.js');
//下边这几属性应该是mongodb中自带的属性吧
Db = require('mongodb').Db,
Connection=require('mongodb').Connection,
Server=require('mongodb').Server;
//实例化一个对象出来
/*module.exports=new Db(settings.db,
        new Server(settings.host,settings.port),
        {safe:true});
*/
module.exports = function() {
return new Db(settings.db, new Server(settings.host, settings.port), {safe: true, poolSize: 1});
}
