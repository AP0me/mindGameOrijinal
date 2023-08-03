const express = require("express");
const app = express();
var nodemailer = require('nodemailer');
var fs = require("fs");
const path = require('path');
const mysql = require('mysql');
const bcrypt = require("bcrypt");
const hbs = require('nodemailer-express-handlebars')
var crypto = require('crypto');
const session = require("express-session");
const passport = require("passport");
const auth = require('./auth');
const player_class = require("./user/player");
const db = require('./user/db');
var cors = require('cors');

app.use(express.urlencoded({extended: true}));
app.use(session({secret: "cats"}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({extended: true}));
app.use(cors());

domain='http://localhost:3000'
//------------------------------------FORGOT PASSWORD------------------------------------
function sendEmail(verifyNum){
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'testingcode1661@gmail.com',
      pass: 'raitdzvsdaudffic'
    }});
  var mailOptions = {
    from: 'testingcode1661@gmail.com',
    to: Pmail,
    subject: 'Sending Email using Node.js',
    template: 'content',
    context: {
      verify_code: verifyNum,
      action_url: "https://localhost:3000/verify"
    }
  };
  //point to the template folder.
  const handlebarOptions = {
    viewEngine: {
      partialsDir: path.resolve('C:/Users/User/OneDrive/Desktop/x/Software Engine/views'),
      defaultLayout: false,
    },
    viewPath: path.resolve('C:/Users/User/OneDrive/Desktop/x/Software Engine/views'),
  };
  //use a template file with nodemailer.
  transporter.use('compile', hbs(handlebarOptions))
  transporter.sendMail(mailOptions, function(error, info){
  if (error) {console.log(error);}else {console.log('Email sent: ' + info.response);}});
}
function InsertIntoPlayer(first_name, player, email, passwordHash){
    var insert_sql = "INSERT INTO player_account(first_name, player_name, player_icon, email, login_password_hash, created_at) VALUES (?,?,?,?,?,?)";
    var values = [first_name, player, 1, email, passwordHash, new Date()];
    db.query(insert_sql, values, function(err,result){if(err) throw err;});
}

app.get('/forgot',(req, res) => {
  res.redirect(domain+'/forgot');
});
app.post('/forgot',(req, res) => {
  Pmail=req.body.Pmail      //take posted Pmail data;
  //generate the verification code (TVC)
  verifyNum=Math.floor(Math.random() * 10000);
  command0="SELECT `id` FROM `player_account` WHERE `email`='"+Pmail+"';";
  db.query(command0, function (err, result) {
    if (err) throw err;
    if(result.length == 1){
      console.log(result);
      idPmail=result[0]["id"];
      command1="SELECT COUNT(*) FROM `token_password_reset` WHERE `user_id`="+idPmail+";";
      db.query(command1, function (err, resulting) {
        if (err) throw err;
        if(resulting[0]["COUNT(*)"]>0){
          command1="DELETE FROM `token_password_reset` WHERE `user_id`="+idPmail+";";
          db.query(command1, function (err, result) {if (err) throw err;});
        }
        //add (TVC) and corresponding Pmail in database.
        command1="INSERT INTO `token_password_reset` (`user_id`,`token`) VALUES ("+idPmail+","+verifyNum+");";
        db.query(command1, function (err, result) {if (err) throw err;});
        sendEmail(verifyNum);
      });
    }
  });
  res.redirect('/verify');
});

app.get('/verify',(req, res) => {
  res.redirect(domain+'/verify');
});
app.post('/verify',(req, res) => {
  verfNum= parseInt(req.body.verf);   //take posted verification code (PVC).
  newPass= req.body.newpass;      //take posted new password. (NP)
  Pmail= req.body.Pmail;        //take posted Pmail.

  //get verification code from database (DVC) as verifyNum corresponding to Pmail if it exists for given Pmail.
  command2="SELECT token FROM `token_password_reset` WHERE `user_id`= (SELECT `id` FROM `player_account` WHERE `email`='"+Pmail+"');";
  db.query(command2, function (err, result) {
    if (err) throw err;
    console.log(result);
    if(result.length == 1){
      verifyNum=result[0]["token"];
      //see if (PVC) is same as (DVC).
      console.log(verifyNum); console.log(verfNum);
      if (verifyNum==verfNum){
        //change password of player with email set as Pmail to (NP) if (PVC) is same as (DVC).
        passwordHash=crypto.createHash('sha256').update(newPass).digest('base64');
        command3="UPDATE `player_account` SET `login_password_hash` = '"+passwordHash+"' WHERE `email`='"+Pmail+"';";
        db.query(command3, function (err, result) {if (err) throw err;});
        //delete verification code after it was used to change password.
        //Add later: delete after verfication code after timeout.
        command4="DELETE FROM `token_password_reset` WHERE `user_id`='(SELECT `id` FROM `player_account` WHERE `email`="+Pmail+")';";
        db.query(command4, function (err, result) {if (err) throw err;});

        console.log(newPass);
        res.redirect('/login');
      }
      else{
        //res.json({html: "verify.html"}); react api testcode.
        res.redirect(domain+'/verify');
      }
    }
    else{
      //res.json({html: "verify.html"}); react api testcode.
      res.redirect(domain+'/verify');
    }
  });
});
//----------------------------------LOG IN/SIGN UP-----------------------------------------

app.get('/login',(req, res) => {
    res.redirect(domain+'/login')
});
app.post('/login', (req, res) => {
    //variables for input from the users
    email= req.body.player;
    passwordHash=crypto.createHash('sha256').update(req.body.password).digest('base64');
    
    try{
        var player = new player_class(email);

        var count_sql = `SELECT COUNT(*) as count FROM player_account WHERE email = "${email}" and login_password_hash = "${passwordHash}"`;
        db.query(count_sql, function (err, result) {
            if (err) throw err;

            //if the password is not match the user will be warned
            if(parseInt(result[0]["count"]) == 0){
                res.end("Wrong Password");
            }else{
                res.redirect(domain+'/account');
            }
        });

    }catch (error){
        console.log(error);
    }
});

app.get('/signup',(req, res) => {
    res.redirect(domain+'/signup')
});
app.post('/signup', (req, res) => {
    //variables for input from the users
    avatar = req.body.icon;
    first_name = req.body.name;
    player_name= req.body.player;
    email= req.body.email;
    password= req.body.password;
    
    try{
        var player = new player_class(email, first_name, player_name, password, avatar);
    }catch (err){
        console.log(err);
    }
    res.redirect(domain+'/login');
    
});

function isLoggedIn(req, res, next){
  req.user ? next() : res.sendStatus(401);
};
app.get('/auth/google', 
  passport.authenticate('google', {scope: ['email', 'profile']})
);
app.get('/google/callback',
  passport.authenticate('google', {
    successRedirect: '/protected',
    failureRedirect: '/auth/failure'
  })
);
app.get('/auth/failure', (res, req)=>{
  res.send("Something went wrong");
});
app.get('/protected', isLoggedIn, (req,res)=>{
  player_name=req.user.displayName;
  email=req.user.email;
  password=req.user.id;
  first_name=req.user.given_name;
  pic=req.user.picture;
  passwordHash=crypto.createHash('sha256').update(password).digest('base64');
  
  db.query(`SELECT COUNT(*) as count FROM player_account WHERE email = "${email}"`, function (err, result, fields) {
    if (err) throw err;
    if(result.length==1){
      //if the player_name or email address is not found in the database
      if(result[0]['count'] == 0){
        // count of input email
        InsertIntoPlayer(first_name, player_name, email, passwordHash);
      }
      res.send('<script>sessionStorage.setItem("player_name", "'+player_name+'");sessionStorage.setItem("password", "'+password+'");window.location="/account"</script>');
    }
    else{
      res.redirect('/login');
    }
  });
});
  
app.get('/logout', (req, res) => {
    req.logout();
    res.send("Goodbye!");
});
// ----------------------------------- Google Auth --------------------------------------
function isLoggedIn(req, res, next){
    req.user ? next() : res.sendStatus(401);
};
app.get('/auth/google', 
passport.authenticate('google', {scope: ['email', 'profile']})
);
app.get('/google/callback',
passport.authenticate('google', {
    successRedirect: '/protected',
    failureRedirect: '/auth/failure'
})
);
app.get('/auth/failure', (res, req)=>{
    res.send("Something went wrong");
});
app.get('/protected', isLoggedIn, (req,res)=>{

    player_name=req.user.displayName;
    email=req.user.email;
    password=req.user.id;
    first_name=req.user.given_name;
    avatar = 1;
    passwordHash=crypto.createHash('sha256').update(password).digest('base64');

    db.query(`SELECT COUNT(*) as count FROM player_account WHERE email = "${email}"`, function (err, result, fields) {
        if (err) throw err;
        if(result[0]['count'] == 0){
            // count of input email
            var player = player_class(email, first_name, player_name, passwordHash, avatar);
        }
        else{
            var player = player_class(email);
        }
        res.end(player);
    });
});
//---------------------------------------------------------------------------------------
app.get('/ranking',(req, res) => {
    res.redirect(domain+'/ranking');
});
  
app.get('/account',(req, res) => {
    res.redirect(domain+'/account');
});
app.post('/account',(req, res) => {
  console.log("hi");
  req.on("data", (chunk) => {
    const chunks = [];
    chunks.push(chunk.toString());
    deta=JSON.parse(chunks[0]);
    console.log(chunks);

    if(typeof deta.player_name=="string"){
      player_login=deta.player_name;
      password=deta.password;
      //ckecks whether the inputted varibale is email address or player_name
      if(player_login.includes("@")){
        column = "email";
      }else{
        column = "player_name";
      }
      console.log(player_login);
      console.log(password);
      passwordHash=crypto.createHash('sha256').update(password).digest('base64');
      var sqlquery = `SELECT * FROM player_account WHERE `+column+` = '`+player_login+`' and login_password_hash = '`+passwordHash+`';`;
      db.query(sqlquery, function (err, result) {
        if (err) throw err;
        if(result.length == 1){
          player_data=result[0];
          //res.json({resp: player_data}); react api testcode.
          res.send(player_data);//response to xhr post in html.
        }
      });
    }
  });
});

app.listen(3001,() => {
    console.log("Started on PORT 3001");
})