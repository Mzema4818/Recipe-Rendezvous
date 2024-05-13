const mongoose = require('mongoose')

const RecipeSchema = new mongoose.Schema({
    username : {type: String, required: true}, 
    name : { type: String, required: true},
    image : { type: String, required: true},
    meal : {type: String, required: true},
    steps : {type: String, required: true}
},
    { collection: 'recipes'}
)

const model = mongoose.model('RecipeSchema', RecipeSchema)

module.exports = model