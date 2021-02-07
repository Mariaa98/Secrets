//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
//Session should be intialized here after those
app.use(session({                      //1
  secret:"Our Little secret.",
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize()); //2
app.use(passport.session()); //3

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});
mongoose.set('useCreateIndex', true); // 6 to solve warnning

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose); // 4 Use to hash and salt

//model
const User = new mongoose.model("User", userSchema);
//5
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res) {
  res.render("home");
});
app.get("/register", function(req, res) {
  res.render("register");
});
app.get("/login", function(req, res) {
  res.render("login");
});
app.get("/secrets",function(req,res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
});
app.get("/logout",function(req,res){
  //here we will deauthenticate and end the user Session
  req.logout();
  res.redirect("/");
});

app.post("/register",function(req,res){
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function(req, res) {
const user = new User({
  username: req.body.username,
  password: req.body.password
});
req.login(user,function(err){
  if(err){
    console.log(err);
  }else{
    passport.authenticate("local")(req,res,function(){
      res.redirect("/secrets");
    });
  }
})
});

app.listen(3000, function() {
  console.log("Server is up and running ");
});
