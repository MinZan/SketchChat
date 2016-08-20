var mongoose = require('mongoose');
//Create Schema for Users (template ish)
var ModelSchema = new mongoose.Schema({
    name: {type:String, required: true, min: 3},
    description: {type:String, required: true, max: 100}
}, {timestamps: true})

//Store the Schema under the name 'User'
var Model = mongoose.model('Model', ModelSchema);
