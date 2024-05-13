var express = require('express');
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const User = require('./model/user')
const Recipe = require('./model/recipe')
const bcrypt = require('bcrypt')
const { stat } = require('fs')
const multer = require('multer')
const cookieParser = require('cookie-parser');
const { error } = require('console');
const path = require('path')
const manager = require('./nlpData'); //Get bot training data

//connect to mongodb with mongoose
mongoose.connect('mongodb://localhost:27017/login-app')

//Set up storage
const storage = multer.diskStorage({
    destination:'uploads', 
    filename: (req, file, cb) =>{
        cb(null, file.originalname)
    },
})

//Set up file location stuff
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb)=>{
            cb(null, "./uploads")
        },
        filename: function(req, file, callback) {
            callback(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname))
        }
    })
})

//Say we are using express as the application
var app = express();

//we are using the view engine with ejs.  And the views engine again with the files in the /public directory
app.set('view engine', 'ejs');
app.set('views', __dirname + '/public');

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

//Any static stuff is handled here
app.use(express.static('public'))
app.use(express.static('uploads')) //this one is for the "uploads" folder where our images are stored for recipes

//Routing
app.get('/', async (req, res) =>{
    const name = await getJustUserNameFromCookie(req);
    const recipes = await Recipe.find().lean();
    const desserts = await Recipe.find({ meal: "dessert" }).lean();
    const drinks = await Recipe.find({ meal: "drinks" }).lean();

    res.render('index', {user: name, allRecipes: recipes, dessert: desserts, drinks: drinks})
});

app.get('/login', async (req, res) =>{
    const name = await getJustUserNameFromCookie(req);

    res.render('login', {user: name})
});

app.get('/register', async (req, res) =>{
    const name = await getJustUserNameFromCookie(req);

    res.render('register', {user: name})
})

app.get('/myRecipes', checkUser, async (req, res) =>{
    const justName = await getJustUserNameFromCookie(req);
    const name = await getUserNameFromCookie(req);
    let recipes = await Recipe.find({ username: name }).lean();

    res.render('myRecipes', {username: name, recipes: recipes, user: justName})
})

app.get('/recipeUpload', checkUser, async (req, res) =>{
    const name = await getJustUserNameFromCookie(req);
    let recipe = await Recipe.findOne({ username: name }).lean();
    let recipeImage

    if(recipe != null){
        recipeImage = recipe.image
    }

    res.render('recipeUpload', {user: name, imageUrl: recipeImage})
});

app.get('/breakfast', async (req, res) =>{
    const name = await getJustUserNameFromCookie(req);
    const recipe = await Recipe.find({ meal: "breakfast" }).lean();

    res.render('breakfast', {user: name, recipe: recipe})
})

app.get('/lunch', async (req, res) =>{
    const name = await getJustUserNameFromCookie(req);
    const recipe = await Recipe.find({ meal: "lunch" }).lean();
    
    res.render('lunch', {user: name, recipe: recipe})
})

app.get('/dinner', async (req, res) =>{
    const name = await getJustUserNameFromCookie(req);
    const recipe = await Recipe.find({ meal: "dinner" }).lean();
    
    res.render('dinner', {user: name, recipe: recipe})
})

app.get('/dessert', async (req, res) =>{
    const name = await getJustUserNameFromCookie(req);
    const recipe = await Recipe.find({ meal: "dessert" }).lean();
    
    res.render('dessert', {user: name, recipe: recipe})
})

app.get('/drinks', async (req, res) =>{
    const name = await getJustUserNameFromCookie(req);
    const recipe = await Recipe.find({ meal: "drinks" }).lean();
    
    res.render('drinks', {user: name, recipe: recipe})
})

app.get('/item/:itemId', async (req, res) => {
    const name = await getJustUserNameFromCookie(req);

    const itemId = req.params.itemId;
    const item = await Recipe.findOne({ _id: itemId }).lean();
    const steps = item.steps.split('<br>').filter(step => step.trim() !== '');

    res.render('items', {user: name, item: item, steps: steps});
});

app.get('/edit/:itemId', checkUser, checkIfCurrentUser, async (req, res) => {
    const name = await getJustUserNameFromCookie(req);

    const itemId = req.params.itemId;
    const item = await Recipe.findOne({ _id: itemId }).lean();
    const steps = item.steps.split('<br>').filter(step => step.trim() !== '');

    res.render('edit', {user: name, item: item, steps: steps});
});

app.get('/bot', async (req, res) =>{
    const name = await getJustUserNameFromCookie(req);
    
    res.render('bot', {user: name})
})

app.get('/privatePolicy', async (req, res) =>{
    res.render('privatePolicy')
})

app.get('/termsOfService', async (req, res) =>{
    res.render('termsOfService')
})

//Uploading recipes
const validImageExtensions = ['.png', '.jpg', '.jpeg']; // List of valid image file extensions
app.post('/api/recipeUpload', checkUser, upload.single("image"), async(req, res) => {
    const username = await getUserNameFromCookie(req);
    const {name: name, meal, steps} = req.body

    //check if any any information is missing, sends error if not
    if(name == "" || meal == "" || steps == ""){
        return res.json({ status: 'error', error: "Missing information"})    
    }

    //check if any file is uploaded, sends error if not
    if(!req.file){
        return res.json({ status: 'error', error: "No file"})    
    }

    //makes sure its a png or jpg, sends error if not
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    if (!validImageExtensions.includes(fileExtension)) {
        return res.json({ status: 'error', error: "Invalid file format. Only PNG and JPG files are allowed." });
    }
    
    try{
        const response = await Recipe.create({
            username: username,
            name: name,
            image: req.file.filename,
            meal: meal,
            steps: steps
        })
    }catch(error){
        //Something else went wrong
        return res.json({ status: 'error', error: "Something went wrong"})    
    }
    res.json({ status: 'ok' })    
})

//Editing recipes
app.post('/api/recipeEdit', checkUser, upload.single("image"), async(req, res) => {
    const {name, meal, steps, ID} = req.body

    //check if any any information is missing, sends error if not
    if(name == "" || meal == "" || steps == ""){
        return res.json({ status: 'error', error: "Missing information"})    
    }

    //makes sure its a png or jpg, sends error if not
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    if (!validImageExtensions.includes(fileExtension)) {
        return res.json({ status: 'error', error: "Invalid file format. Only PNG and JPG files are allowed." });
    }

    try{
        const recipe = await Recipe.findOneAndUpdate({ _id: ID }, { 
            name: name,
            meal: meal,
            steps: steps,
            image: req.file.filename,
        });
    }catch(error){
        //Something else went wrong
        return res.json({ status: 'error', error: "Something went wrong"})    
    }

    res.json({ status: 'ok' })    
})

//To register new users
app.post('/api/register', async(req, res) =>{
    const {username, password: plainTextPassword} = req.body

    //Username and password checks
    if(!username || typeof username !== 'string'){
        return res.json({ status: 'error', error: 'Invalid username'})
    }

    if(!plainTextPassword || typeof plainTextPassword !== 'string'){
        return res.json({ status: 'error', error: 'Invalid password'})
    }

    if(username.length < 5){
        return res.json({ 
            status: 'error', 
            error: 'Password to small.  Should be at least 6 characters'
        })
    }

    const password = await bcrypt.hash(plainTextPassword, 10)
    const ID = -1

    try{
        const response = await User.create({
            username: username,
            password: password,
            ID: ID
        })
    }catch(error){
        //Error for duplicants
        if(error.code === 11000){
            return res.json({ status: 'error', error: "Username already in use"})
        }
        throw error
    }
    
    res.json({ status: 'ok' })    
})

//To login users
app.post('/api/login', async(req, res) => {
    const {username, password} = req.body
    const user = await User.findOne({username}).lean() 

    if(!user){
        return res.json({ status: 'error', error: 'Invalid username/password'})
    }

    //means username and password combo is successful
    if(await bcrypt.compare(password, user.password)){
        const userId = user._id
        const num = Math.floor(Math.random() * 999999999)
        await User.updateOne(
			{ _id: userId },
			{
				$set: { ID: num}
			}
		)
        res.cookie('ID', num)
        return res.json({ status: 'ok', data: "good"})
    }

    res.json({ status: 'error', error: 'Invalid username/password'})
})

//Bot answers
manager.train().then(async () =>{
    manager.save();  

    //Post request for bot input
    app.post('/api/bot', async (req, res) => {
        const { input: botAnswer } = req.body;
        
        let response = await manager.process('en', botAnswer)

        //If the bot deems that the user is searching for a recipe, look for it
        if(response.intent == 'recipe'){
            try {
                const recipes = await Recipe.find().exec();
        
                let foundRecipe = null;
                //try to find the recipe they are talking about
                for (const recipe of recipes) {
                    if (botAnswer.toLowerCase().includes(recipe.name.toLowerCase())) {
                        foundRecipe = recipe;
                        break;
                    }
                }
                
                //if we find it, send it, if they tell them
                if (foundRecipe) {
                    response = foundRecipe
                } else {
                    response = "Could not find that recipe";
                }
            } catch (error) {
                console.error("Error retrieving recipes:", error);
                response = "Sorry, there was an error processing your request.";
            }
        }else{
            //If the response is not a recipe, then just send the
            response = response.answer
        }
        
        return res.json({ status: 'ok', input: response || "I don't understand, please rephrase"});
    });
})

//Logging out
app.post('/deleteRecipe', async(req, res) => {
    const {id} = req.body

    console.log(id)

    try{
        const response = await Recipe.deleteOne({_id: id})
        console.log(response)
    }catch(error){
        return res.json({ status: 'error', error: "Something went wrong"})    
    }

    res.redirect("../myRecipes")
    res.send()
})

//Logging out
app.post('/logout', async(req, res) => {
    let myCookieValue = req.cookies.ID;

    if(myCookieValue){
        res.clearCookie('ID');
        res.redirect("/login")
    }else{
        res.send()
    }
})

//middleware
async function checkUser(req, res, next) {
    let myCookieValue = req.cookies.ID;
    let user
        
    if (myCookieValue) {
        user = await User.findOne({ ID: myCookieValue }).lean();
    }

    if (user == null){
        res.redirect("/login")
    }else{
        next();
    }
}

async function checkIfCurrentUser(req, res, next) {
    try {
        let myCookieValue = req.cookies.ID;
        let user = await User.findOne({ ID: myCookieValue }).lean();
        let recipes = await Recipe.find({ username: user.username }).lean();
        const itemId = req.params.itemId;

        let itemFound = false;
        for (let recipe of recipes) {
            if (itemId === recipe._id.toHexString()) {
                itemFound = true;
                break;
            }
        }

        if (itemFound) {
            next();
        } else {
            next();
            res.redirect("/myRecipes")
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
}

//functions for stuff i use a lot
async function getUserNameFromCookie(req) {
    const myCookieValue = req.cookies.ID;
    let name = '';

    if (myCookieValue) {
        try {
            const user = await User.findOne({ ID: myCookieValue }).lean();
            if (user) {
                name = user.username;
            }
        } catch (error) {
            // Handle error
            console.error('Error fetching user:', error);
        }
    }

    return name;
}

async function getJustUserNameFromCookie(req) {
    const myCookieValue = req.cookies.ID;
    let name = '';

    if (myCookieValue) {
        try {
            const user = await User.findOne({ ID: myCookieValue }).lean();
            if (user) {
                name = "Hello, " + user.username;
            }
        } catch (error) {
            // Handle error
            console.error('Error fetching user:', error);
        }
    }

    return name;
}

app.listen(8080, () =>{
    console.log('Server is listening on port 8080');
});