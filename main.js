const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Sequelize = require('sequelize');
const app = express();
const Op = Sequelize.Op;
app.use((express.static('public')))
// This secret will be used to sign and encrypt cookies
const COOKIE_SECRET = 'cookie secret';

passport.use(new LocalStrategy((email, password, callback)=> {
    User
    .findOne({ where: { email, password }})
    .then((user)=> {
    if (user){
        callback(null, user);
    }else {
        callback(null,false, {
    message: 'Invalid credentials'
});
}
})
.catch(callback);
}));

// Save the user's email address in the cookie
passport.serializeUser((user, cb) => {
    cb(null, user.email);
});

passport.deserializeUser((email, callback) => {
    User
    .findOne({ where: { email }})
    .then((user)=> {
    if (user){
        callback(null, user);
    }else {
        callback(null,false, {
    message: 'Invalid credentials'
});
}
})
.catch(callback);
});

// Create an Express application

// Use Pug for the views
app.set('view engine', 'pug');

// Parse cookies so they're attached to the request as
// request.cookies
app.use(cookieParser(COOKIE_SECRET));

// Parse form data content so it's available as an object through
// request.body
app.use(bodyParser.urlencoded({ extended: true }));

// Keep track of user sessions
app.use(session({
    secret: COOKIE_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Initialize passport, it must come after Express' session() middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', (req, res) => {
    // Render the login page
    res.render('login');
});

app.post('/login',
    // Authenticate user when the login form is submitted
    passport.authenticate('local', {
        // If authentication succeeded, redirect to the home page
        successRedirect: '/',
        // If authentication failed, redirect to the login page
        failureRedirect: '/login'
    })
);

const db = new Sequelize('blog', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});
const Relation = db.define('relation', {
    User1: { type: Sequelize.TEXT },
    User2: { type: Sequelize.TEXT },
    Status: { type: Sequelize.TINYINT},
});

const Comment = db.define('comment', {
    idPost: { type: Sequelize.TINYINT },
    desc: { type: Sequelize.TEXT },
    userName: { type: Sequelize.TEXT },
    NbLike: { type: Sequelize.TINYINT },

});

const Post = db.define('post', {
    user: { type: Sequelize.STRING },
    desc: { type: Sequelize.TEXT },
    nblike: { type: Sequelize.TINYINT },
    Nbcomment: { type: Sequelize.TINYINT },
    share: { type: Sequelize.TINYINT },

});

const User = db.define('user', {
    email: { type: Sequelize.TEXT },
    password: { type: Sequelize.TEXT }
});

app.get('/addFriend', (req, res) => {
    User
        .findAll()
        .then((users) => {
            res.render('addFriend', { users});
        });
});
app.get('/invitation', (req, res) => {
    Relation
        .findAll({ where: { User2:req.user.email, Status:0 }})
        .then((relations) => {
            res.render('invitation', {relations});
        });
});
app.post('/accppted/:relationid', (req, res) => {
    Relation
        .findOne({ where: { id:req.params.relationid }})
        .then((relation) => {

            var Status = relation.Status;
            console.log(relation.Status);
            relation.increment('Status');
            res.redirect('/invitation');
});
});


app.post('/addFriend', (req, res) => {
    User
        .findOne({ where: { email:req.body.username }})
        .then((users) => {
            Relation
            .sync()
                .then(() => Relation.create({
                        User1: req.user.email,
                        User2: users.email,
                        Status: 0,
                    }),
                    console.log(req.user.email),
                    res.redirect('/addFriend'))

        });
});

app.get('/', (req, res) => {
    Post
    .findAll()
    .then((posts) => {
        Relation
            .findAll({ where: {
                [Op.or]: [{User1:req.user.email}, {User2:req.user.email}]
                 , Status:1 }})
            .then((relations) => {
                res.render('homepage', {posts, user: req.user, relations});
            })
});
});
app.get('/post/:postid', (req, res) => {
    Post
    .findOne({ where: { id:req.params.postid }})
    .then(( post) => {
    Comment
    .findAll({ where: { idPost:req.params.postid }})
    .then((comments) => {
    res.render('post',{post, comments} );
    })

});
});

app.post('/', (req, res) => {

Post
    .sync()
    .then(() => Post.create({ user:req.user.email, desc: req.body.desc, nblike:0, comment:0, share:0}))
.then(() => res.redirect('/'));
});

app.post('/post/:postid', (req, res) => {
        const {desc} = req.body;
        Comment
            .sync()
            .then(() => Comment.create({
                    idPost: req.params.postid,
                    desc: req.body.desc,
                    userName: req.user.email,
                    NbLike: 0
                })
            )
            .then((comment) => {
                Post
                    .findOne({where: {id: req.params.postid}})
                    .then((post) => {
                        console.log(post.desc);
                        post.increment('Nbcomment');
                        res.redirect('/post/' + req.params.postid)
                    })
            })
    });



app.get('/inscription', (req, res) => {
    res.render('inscription');
});
app.post('/likePost/:postid', (req, res) => {
    Post
        .findOne({ where: { id:req.params.postid }})
    .then((posts) => {
        var nblike = posts.nblike;
        posts.increment('nblike');
    res.redirect('/');
})
})
app.post('/likePostComment/:commentid', (req, res) => {
    Comment
        .findOne({ where: { id:req.params.commentid }})
    .then((comment) => {
        var NbLike = comment.NbLike;
        console.log(comment.desc);
        comment.increment('NbLike');
    res.redirect('/post/' + comment.idPost);
})
})
app.post('/Postcommentup/:commentid', (req, res) => {
    Post.findOne({ where: { id:req.params.commentid }})
    .then((Post) => {

        Post.update(
    {comment: db.literal('comment + 1'),})
res.redirect('/');

})
})

app.post('/inscription', (req, res) => {
    User.create({email: req.body.username, password: req.body.password})
    .then((user) => {
    req.login(user, ()=>{
    res.redirect('/')
})
})
});



// req+param

db.sync();

app.listen(3000, () => {
    console.log('Listening on port 3000');
});