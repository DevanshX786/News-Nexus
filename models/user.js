const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/NewsApp";
const localUsersPath = path.join(__dirname, '..', 'users.local.json');

mongoose.connect(mongoUri)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });

const userSchema = mongoose.Schema({
    username:String,
    age:Number,
    email:String,
    password:String,
})

const MongoUserModel = mongoose.model("user", userSchema);

function loadLocalUsers() {
    if (!fs.existsSync(localUsersPath)) {
        return [];
    }

    try {
        const raw = fs.readFileSync(localUsersPath, 'utf8');
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('Failed to read local users store:', error.message);
        return [];
    }
}

function saveLocalUsers(users) {
    fs.writeFileSync(localUsersPath, JSON.stringify(users, null, 2));
}

function isMongoReady() {
    return mongoose.connection.readyState === 1;
}

function findByQuery(users, query) {
    return users.find((user) => {
        return Object.keys(query).every((key) => user[key] === query[key]);
    }) || null;
}

module.exports = {
    async findOne(query) {
        if (isMongoReady()) {
            return MongoUserModel.findOne(query);
        }

        const users = loadLocalUsers();
        return findByQuery(users, query);
    },

    async create(payload) {
        if (isMongoReady()) {
            return MongoUserModel.create(payload);
        }

        const users = loadLocalUsers();
        const existing = users.find((user) => user.email === payload.email);
        if (existing) {
            const err = new Error('User already exists');
            err.code = 11000;
            throw err;
        }

        const created = {
            _id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            ...payload,
        };
        users.push(created);
        saveLocalUsers(users);
        return created;
    }
};