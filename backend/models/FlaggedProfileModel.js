const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FlaggedProfileSchema = new Schema({
    // The username of the user whose profile is being flagged
    username: {
        type: String,
        required: true,
        unique: true, // Ensures a user is only listed once
        trim: true
    },
    // A list of IDs of their posts that have been flagged
    flaggedPostIds: [{
        type: String, // Storing the string ID from the Post model
        required: true
    }],
    // A list of IDs of the VIPs associated with the flagged posts.
    // The `ref: 'VIP'` links this field to the VIP model.
    associatedVIPs: [{
        type: Schema.Types.ObjectId,
        ref: 'VIP',
        required: false
    }],
    // The date and time the profile was first flagged
    dateFirstFlagged: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('FlaggedProfile', FlaggedProfileSchema);
