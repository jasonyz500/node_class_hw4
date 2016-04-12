let isLoggedIn = require('./middlewares/isLoggedIn')
let then = require('express-then')
let Twitter  = require('twitter')
let _ = require('lodash')

let network: {
  'icon': 'twitter',
  'name': 'Twitter',
  'class': 'btn-info'    
}

module.exports = (app) => {
    let passport = app.passport

    app.get('/', (req, res) => res.render('index.ejs'))

    app.get('/profile', isLoggedIn, (req, res) => {
        res.render('profile.ejs', {
            user: req.user,
            message: req.flash('error')
        })
    })

    app.get('/logout', (req, res) => {
        req.logout()
        res.redirect('/')
    })

    app.post('/login', passport.authenticate('local', {
        successRedirect: '/profile',
        failureRedirect: '/',
        failureFlash: true
    }))

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/',
        failureFlash: true
    }))

    let scope = 'email'

    // Authentication route & Callback URL
    app.get('/auth/facebook', passport.authenticate('facebook', {scope}))
    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

    // Authorization route & Callback URL
    app.get('/connect/facebook', passport.authorize('facebook', {scope}))
    app.get('/connect/facebook/callback', passport.authorize('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

    app.get('/auth/twitter', passport.authenticate('twitter', {scope}))
    app.get('/auth/twitter/callback', passport.authenticate('twitter', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

    app.get('/connect/twitter', passport.authorize('twitter', {scope}))
    app.get('/connect/twitter/callback', passport.authorize('twitter', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

    app.get('/compose', isLoggedIn, (req,res) => {
        res.render('compose.ejs')
    })

    app.get('/timeline', isLoggedIn, then(async (req,res) => {
        let twitterClient = new Twitter({
            consumer_key: 'pV6fzM5jZUnPkqsybQV66s5g2',
            consumer_secret: 'zl0rcuoLkSs1VU8sQZpBEKkOkSbL6PHavpRcfs79lIjmMUzLfh',
            access_token_key: req.user.twitter.token,
            access_token_secret: req.user.twitter.secret
        })
        
        let tweets = await twitterClient.promise.get('statuses/home_timeline')

        let twitterPosts = _.map(tweets, function(tweet){
            return {
                id: tweet.id_str,
                image: tweet.user.profile_image_url,
                text: tweet.text,
                name: tweet.user.name,
                username: "@" + tweet.user.screen_name,
                liked: tweet.favorited,
                retweeted: tweet.retweeted,
                retweedStatusId: tweet.retweeted && tweet.retweeted_status ? tweet.retweeted_status.id_str : null,
            }
        })

        res.render('timeline.ejs',{
            posts: twitterPosts || []
        })
    }));

    app.post('/compose', isLoggedIn, then(async (req,res) => {    
        let twitterClient = new Twitter({
            consumer_key: 'pV6fzM5jZUnPkqsybQV66s5g2',
            consumer_secret: 'zl0rcuoLkSs1VU8sQZpBEKkOkSbL6PHavpRcfs79lIjmMUzLfh',
            access_token_key: req.user.twitter.token,
            access_token_secret: req.user.twitter.secret
        })

        let status = req.body.reply
        if (status.length > 140) {
            return req.flash('error', 'Status is over 140 characters')
        }
        if (!status) {
            return req.flash('error', 'Status cannot be empty')
        }     

        await twitterClient.promise.post('statuses/update', {status})      

        res.redirect('/timeline') 
    }))

    app.get('/reply/:id', isLoggedIn, then(async(req, res) => {
        let twitterClient = new Twitter({
            consumer_key: 'pV6fzM5jZUnPkqsybQV66s5g2',
            consumer_secret: 'zl0rcuoLkSs1VU8sQZpBEKkOkSbL6PHavpRcfs79lIjmMUzLfh',
            access_token_key: req.user.twitter.token,
            access_token_secret: req.user.twitter.secret
        })
        let id = req.params.id
        let tweet = await twitterClient.promise.get('/statuses/show/' + id)

        let renderTweet = {
            id: tweet.id_str,
            image: tweet.user.profile_image_url,
            text: tweet.text,
            name: tweet.user.name,
            username: "@" + tweet.user.screen_name,
            liked: tweet.favorited
        }

        res.render('reply.ejs', {
            post: renderTweet
        })
    }))

    app.post('/reply/:id', isLoggedIn, then(async(req, res) => {
        let id = req.params.id
        let twitterClient = new Twitter({
            consumer_key: 'pV6fzM5jZUnPkqsybQV66s5g2',
            consumer_secret: 'zl0rcuoLkSs1VU8sQZpBEKkOkSbL6PHavpRcfs79lIjmMUzLfh',
            access_token_key: req.user.twitter.token,
            access_token_secret: req.user.twitter.secret
        })

        let reply = req.body.reply
        if(reply.length > 140) {
          return req.flash('error', 'Status is over 140 characters')
        }
        if(!reply) {
          return req.flash('error', 'Status cannot be empty')
        }

        await twitterClient.promise.post('statuses/update', {
            status: reply,
            in_reply_to_status_id: id
        })

        res.redirect('/timeline')
    }))

    app.get('/share/:id', isLoggedIn, then(async(req, res) => {
        let twitterClient = new Twitter({
            consumer_key: 'pV6fzM5jZUnPkqsybQV66s5g2',
            consumer_secret: 'zl0rcuoLkSs1VU8sQZpBEKkOkSbL6PHavpRcfs79lIjmMUzLfh',
            access_token_key: req.user.twitter.token,
            access_token_secret: req.user.twitter.secret
        })
        let id = req.params.id
        let tweet = await twitterClient.promise.get('/statuses/show/' + id)

        let renderTweet = {
            id: tweet.id_str,
            image: tweet.user.profile_image_url,
            text: tweet.text,
            name: tweet.user.name,
            username: "@" + tweet.user.screen_name,
            liked: tweet.favorited,
        }

        res.render('share.ejs', {
            post: renderTweet
        })
    }))

    app.post('/share/:id', isLoggedIn, then(async (req,res) => {  
        let twitterClient = new Twitter({
            consumer_key: 'pV6fzM5jZUnPkqsybQV66s5g2',
            consumer_secret: 'zl0rcuoLkSs1VU8sQZpBEKkOkSbL6PHavpRcfs79lIjmMUzLfh',
            access_token_key: req.user.twitter.token,
            access_token_secret: req.user.twitter.secret
        })
        let id = req.params.id
        let share = req.body.share;

        if (share.length > 140) {
            return req.flash('error', 'Status is over 140 characters')
        }
        if (!share.length) {
            return req.flash('error', 'Status cannot be empty')
        }
              
        await twitterClient.promise.post('statuses/retweet/' + id, {share})
          
        res.redirect('/timeline')
    }))

}