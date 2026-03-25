const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/NewsApp");

const userSchema = mongoose.Schema({
    username:String,
    age:Number,
    email:String,
    password:String,
})

module.exports = mongoose.model("user", userSchema);