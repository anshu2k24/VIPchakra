const mongoose = require('mongoose');

const FlaggedPostSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    image: {
        type: String,
        trim: true
    },
    // The link to the original post, for reference
    linkToPost: {
        type: String,
        required: true,
        trim: true
    },
    flagStatus: {
        type: String,
        enum: ['ok', 'flagged'],
        default: 'ok'
    },
    flagReasons: {
        type: [String],
        default: ['Content is clean.']
    },
    // The associatedVIP field is now an array to store multiple VIPs
    // who may appear in an image or be mentioned in the text.
    associatedVIPs: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'VIP',
        default: []
    },
    // A new field to store the perceptual hash of an image for reuse detection.
    imageHash: {
        type: String,
        default: null
    },
    // The embedding is a large array of numbers, which we'll store as a BSON Array in MongoDB
    embedding: {
        type: [Number],
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Post', FlaggedPostSchema);
