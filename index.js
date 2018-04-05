var crypto = require('crypto'),
User = require('../models/user.js');
Post=require('../models/post.js');
//Comment=require('../models/comment.js');
Comment = require('../models/comment.js');
module.exports = function(app)
{
    app.get('/', function (req, res) {
      /*  Post.getAll(null,function(err,posts){
            if (err) {
                posts=[];
            };
        res.render('index', {
            title: '主页',
            user: req.session.user,
            posts:posts,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
            });
        });
        */
        //判断是否是第一页,并把请求的页数转换成number类型
        var page=req.query.p?parseInt(req.query.p):1;
        //查询并返回第page页的10篇文章
        Post.getTen(null,page,function(err,posts,total){
            if (err){ posts=[];};
            res.render('index',{
                title:'',
                posts:posts,
                page:page,
                isFirstPage:(page-1)==0,
                isLastPage:((page-1)*10+posts.length)==total,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        });
    });
    ///////////////////////////////////////
    app.get('/reg', checkNotLogin);
    app.get('/reg', function (req, res) {
            res.render('reg', {
                title: '注册',
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
    });
    ////////////////////////////////////////
    app.post('/reg', checkNotLogin);
    app.post('/reg', function (req, res)
    {
        var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];
        if (password_re != password)
        {
            req.flash('error', '两次输入的密码不一致!');
            return res.redirect('/reg');
        }
        ///////////////
        var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: name,
            password: password,
            email: req.body.email
        });
        ///////////////////
        User.get(newUser.name, function (err, user)
        {
            if (err)
            {
                req.flash('error', err);
                return res.redirect('/');
            }
            if (user)
            {
                req.flash('error', '用户已存在!');
                return res.redirect('/reg');
            }
            newUser.save(function (err, user)
            {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');
                }
                req.session.user = user;
                req.flash('success', '注册成功!');
                res.redirect('/');
            });
        });
    });

//////////////////////加载用户登录之后的页面/////////////////////////////
    app.get('/login', checkNotLogin);
    app.get('/login', function (req, res)
    {
                res.render('login', {
                    title: '登录',
                    user: req.session.user,
                    success: req.flash('success').toString(),
                     error: req.flash('error').toString()
                });
    });
////////////////////////检测用户登录是否成功///////////////////////////
    app.post('/login', checkNotLogin);
    app.post('/login', function (req, res)
    {
        var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
        User.get(req.body.name, function (err, user) {
            if (!user)
            {
                req.flash('error', '用户不存在!');
                return res.redirect('/login');
            }
            if (user.password != password)
            {
                req.flash('error', '密码错误!');
                return res.redirect('/login');
            }
            req.session.user = user;
            req.flash('success', '登陆成功!');
            res.redirect('/');
        });
    });
////////////////////加载文章发表页面//////////////////////////
    app.get('/post', checkLogin);
    app.get('/post', function (req, res)
    {
        res.render('post', {
            title: '发表',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
         });
    });
    ////////////////////////对文章的发表进行逻辑处理////////////////////////////////
    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
   /*     var currentUser=req.session.user;
        post=new Post(currentUser.name,req.body.title,req.body.post);*/
    var currentUser=req.session.user;
    var tags=[req.body.tag1,req.body.tag2,req.body.tag3];
    //var post = new Post(currentUser.name,req.body.title,tags,req.body.post);
var post=new Post(currentUser.name,currentUser.head,req.body.title,tags,req.body.post);
    post.save(function(err){
            if (err) {
                req.flash('error',err);
                return res.redirect('/');
            };
            req.flash('success','发布成功!');
            res.redirect('/');//发表成功跳转 
        
        });
    });
//////////////////////////退出///////////////////////////
    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功!');
        res.redirect('/');
    });
/////////////////上传///////////
    app.get('/upload', checkLogin);
    app.get('/upload', function (req, res) {
       res.render('upload',{
            title:'文件上传',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
       });
    });

/////////判断文件是否上传///////////////////
app.post('/upload',checkLogin);
app.post('/upload',function(req,res){
    req.flash('success','文件上传成功!');
    res.redirect('/upload');
});
///////////////处理用户文档存储功能///////////////////
app.get('/archive', function (req, res) {
    Post.getArchive(function (err, posts) {
    if (err) {
        req.flash('error', err);
        return res.redirect('/');
    }
    res.render('archive', {
        title: '存档',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
        });
    });
});
///////////////博客标签////////////////////////
app.get('/tags',function(req,res){
    Post.getTags(function(err,posts){
        if (err) {
            req.flash('error',err);
            return res.redirect('/');
        };
        res.render('tags',{
            title:'标签',
            posts:posts,
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    
    })
});
//////////////////处理特定页的标签////////////////
app.get('/tags/:tag',function(req,res){
    Post.getTag(req.params.tag,function(err,posts){
        if (err) {
            req.flash('error',err);
            return res.redirect('/');
        };
        res.render('tag',{
            title:'TAG:'+req.params.tag,
            posts:posts,
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    });
});
/////////////////增加友情连接/////////////////////
app.get('/links',function(req,res){
    res.render('links',{
        title:'友情链接',
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()
    });
});
////////////////处理用户的搜索///////////////////
app.get('/search',function(req,res){
    Post.search(req.query.keyword,function(err,posts){
        if (err) {
            req.flash('error',err);
            return res.redirect('/');
        };
        res.render('search',{
            title:"search:"+req.query.keyword,
            posts:posts,
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()

        });
    })
})
//////////////////////////////////////
//用来处理访问用户页的请求，
app.get('/u/:name',function(req,res){
    var page=req.query.p?parseInt(req.query.p):1;
    //检查用户是否存在
    User.get(req.params.name,function(err,user){
        if (!user) {
            req.flash('error','用户不存在!');
            return res.redirect('/');
        };
        //查询并返回该用户第page页的10篇文章
        Post.getTen(user.name,page,function(err,posts,total){
            if (err) {
                req.flash('error',err);
                return res.redirect('/');
            };
            res.render('user',{
                title:user.name,
                posts:posts,
                page:page,
                isFirstPage:(page-1)==0,
                isLastPage:((page-1)*10 + posts.length)==total,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        });
    });
});
/////////////////添加文章页面的路由规则//////////////////////
app.get('/p/:_id',function(req,res){
        Post.getOne(req.params._id,function(err,post){
            if (err) {
                req.flash('error',err);
                return res.redirect('/');
            };
            res.render('article',{
                title:req.params.title,
                post:post,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        
        });
});
/////////////////////文章的编辑模块//////////////////////////
app.get('/edit/:name/:day/:title',checkLogin);
app.get('/edit/:name/:day/:title',function(req,res){
    var currentUser = req.session.user;
    Post.edit(currentUser.name,req.params.day,req.params.title,function(err,post){
        if (err) {
            req.flash('error',err);
            return res.redirect('back');
        };
        res.render('edit',{
            title:'编辑',
            post:post,
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    });
});
/////////////////////////////路由 响应 留言页面///////////////////////////////////////
app.post('/p/:_id',function(req,res){
    var date=new Date();
    var time=date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+''+
    date.getHours()+":"+(date.getMinutes()<10 ? '0' +date.getMinutes():date.getMinutes());
   //添加未注册头像 
    var md5=crypto.createHash('md5');
    var email_MD5=md5.update(req.body.email.toLowerCase()).digest('hex');
    var head="http://www.gravatar.com/avatar/"+ email_MD5 + "?s=48";
    var comment={
        name:req.body.name,
        head:head,
        email:req.body.email,
        website:req.body.website,
        time:time,
        content:req.body.content
    };

    var newComment=new Comment(req.params._id,comment);
    newComment.save(function(err){
        if (err) {
            req.flash('error',err);
            return res.redirect('back');
        };
        req.flash('success','留言成功!');
        res.redirect('back');
    });
});

/////////////////////////文章的修改页面////////////////////////////
        app.post('/edit/:name/:day/:title',checkLogin);
        app.post('/edit/:name/:day/:title',function(req,res){
            var currentUser =  req.session.user;
            Post.update(currentUser.name,req.params.day,req.params.title,req.body.post,function(err){
                //encodeURI() 函数可把字符串作为 URI 进行编码。
                var url=encodeURI('/u/'+req.params.name+'/'+req.params.day+'/'+req.params.title);
                if (err) {
                    req.flash('error',err);
                    return res.redirect(url);//错误 返回哪儿昵，文章页
                };
                req.flash('success','修改成功!');
                res.redirect(url);//成功!返回
            });
        });
/////////////////////////进行删除的路由控制/////////////////////////
app.get('/remove/:name/:day/:title',checkLogin);
app.get('/remove/:name/:day/:title',function(req,res){
    var currentUser =  req.session.user;
    Post.remove(currentUser.name,req.params.day,req.params.title,function(err){
        if (err) {
            req.flash('error',err);
            return res.redirect('back');
        };
        req.flash('success',"删除成功!");
        res.redirect('/');
    });
});
//////////////转载的路由/////////////////////////
app.get('/reprint/:name/:day/:title',checkLogin);
app.get('/reprint/:name/:day/:title',function(req,res){
    Post.edit(req.params.name,req.params.day,req.params.title,function(err,post){
        if (err) {
            req.flash('error',err);
            return res.redirect(back);
        };
        var currentUser=req.session.user,
            reprint_from={name:post.name,day:post.time.day,title:post.title},
            reprint_to={name:currentUser.name,head:currentUser.head};
            
            Post.reprint(reprint_from,reprint_to,function(){
                if (err) {
                    req.flash('error',err);
                    return res.redirect('back');
                };
                req.flash('success','转载成功!');
                var url=encodeURI('/u/'+post.name+'/'+post.time.day+'/'+post.title);
                //跳转到转载后的文章页面
                res.redirect(url);
            });
    });
});

/////////////////////进行权限控制的两个函数///////////////////////
    app.use(function(req,res){
        res.render('404');
    });

    function checkLogin(req, res, next) {
        if (!req.session.user)
        {
            req.flash('error', '未登录!');
            return res.redirect('/login');
        }
        next();
    }

    function checkNotLogin(req, res, next)
    {
        if (req.session.user)
        {
            req.flash('error', '已登录!');
            res.redirect('back');
        }
        next();
    }
};
