require('dotenv').config()
const express = require("express");
const ejs = require ("ejs");
const bodyParser = require ("body-parser");
const mongoose = require ("mongoose");
const session = require('express-session');
const passport = require ("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();

app.use(express.static("public"));
app.set("view engine" , "ejs");
app.use (bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret:process.env.SECRET,
  resave:false,
  saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://shubh-admin:"+ process.env.PASSWORD +"@cluster0.3wpoe.mongodb.net/userDB", {useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);     //to sole the deprecation warning regarding the module

const taskSchema = new mongoose.Schema({                        // schema for saving our tasks.
  title: String
})

const Task = new mongoose.model("Task", taskSchema);


const userSchema = new mongoose.Schema({                          //schema for our users.
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);      //adding plugin to shema to save the user credentials to the mongodb database

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support by passport local mongoose
passport.serializeUser(User.serializeUser());               //cookies implementation
passport.deserializeUser(User.deserializeUser());

//Routs///////////////////////////////////////////////////////////////////////////

app.get("/", function(req, res){
  res.render("home");
});

app.get("/submit", function(req, res){
  res.render("submit");
})

app.get("/edit", function(req, res){
  res.render("edit");
})

app.get("/delete", function(req, res){
  res.render("delete");
})

app.get("/tasks", function(req, res){
  if(req.isAuthenticated()){                                    // one of the CRUD operation R- read
    Task.find({}, function(err, result){
      if(!err){
        res.render("tasks", {tasks:result});
      }
    });
  }else{
    res.redirect("/login");
  }

});

app.get("/register", function(req,res){
  res.render("Register");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.post("/register", function(req, res){
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/tasks")
      })
    }
  })
});

app.post("/login", function(req, res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/tasks")
      });
    }
  });
});

app.post("/submit", function(req, res){
  const task = new Task({
    title: req.body.task
  });
  task.save(function(err){                                  // another CRUD operation C- Create.
    if(err){
      console.log(err)
    }else{
      res.redirect("/tasks");
    }
  })
})

app.post("/edit", function(req,res){                     //another CRUD operation U - update
  Task.findOneAndUpdate({title:req.body.taskToEdit}, {$set:{title:req.body.newTask}}, {new:true}, (err,doc) => {
    if(err){
      console.log(err);
    }else{
      console.log("edition successful");
      res.redirect("/tasks");
    }
  });
});

app.post("/delete", function(req, res){
  Task.findOneAndRemove({title:req.body.taskToDelete}, (err) =>{
    if(err){
      console.log(err);
    }else{
      console.log("deletion successful");
      res.redirect("/tasks");
    }
  });
});


app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully.")
})
