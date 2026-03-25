const express = require('express');
const cookieParser = require("cookie-parser");
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require("./models/user");
const axios = require('axios');

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.listen(port, ()=>{
    console.log(`Server is listening at port ${port}`);
})

app.get("/", (req, res)=>{
    res.render("login")
})

app.get("/login", (req, res)=>{
    res.render("login")
})

app.get("/logout", (req, res)=>{
    res.cookie("token", "")
    res.redirect("/")
})

app.get("/register", (req, res)=>{
    res.render("register")
})

app.get("/home", isLoggedIn, async (req, res)=>{
    let user = await userModel.findOne({email: req.user.email})
    res.render("home", {user})
    console.log(user);

})

// app.get("/home/section", isLoggedIn, (req, res)=>{
//     res.render("section", sectionD)
// })


let sectionData = {};





app.post("/register", (req, res)=>{
    let {username, age, email, password} = req.body;
    bcrypt.genSalt(10, (err, salt)=>{
        bcrypt.hash(password, salt, async (err, hash)=>{
            

            if(err) res.render("register");
            
            else{

                let createdUser = await userModel.create({
                    username,
                    age,
                    email,
                    password: hash,
                });
                console.log(createdUser); 
    
                let token = jwt.sign({email}, "secretKey");
                res.cookie("token", token);
    
                res.redirect("/");
            }
        })
    })
})



app.post("/login", async (req, res)=>{
    let {email, password} = req.body;
    let user = await userModel.findOne({email});

    if(!user) res.render("login");

    else{
        bcrypt.compare(password, user.password, (err, result)=>{
            if(result){
                let token = jwt.sign({email}, "secretKey");
                res.cookie("token", token);
                res.redirect("home");
            }
            else res.redirect("/");
        })
    }
    
})

app.get("/:section", isLoggedIn, async (req, res)=>{
    let section = req.params.section;
    // res.send(` News Section : ${section}`)

    let NEWS_API_KEY = "7adb5e9be18d427cb9ee2c229a7e0cd3"

    let response = null;
    try {
        if(section == "global"){
            response = await axios.get('https://newsapi.org/v2/top-headlines', {
                params: {
                //   category:section,
                  country: 'us',
                  apiKey: NEWS_API_KEY
                }
              });
        }
        else{
            response = await axios.get('https://newsapi.org/v2/top-headlines', {
                params: {
                  category:section,
                //   country: 'in',
                  apiKey: NEWS_API_KEY
                }
              });
        }
        sectionData = response.data.articles;
        console.log(sectionData)
        
      } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).send('Error fetching news');
      }

      res.render("news", {sectionData, query: section})

})

function isLoggedIn(req, res, next){

    if(req.cookies.token == "") res.redirect("/");
    else{
        let data = jwt.verify(req.cookies.token, "secretKey");
        req.user = data;
        next();
    }
}