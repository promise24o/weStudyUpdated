const mongoose = require ('mongoose');

const itemSchema = new mongoose.Schema ({
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    src: {
        type: String,
        required: true
    },
    preview: {
        type: String,
        required: true
    },
    link: {
        type: String
    },
    linkText: {
        type: String
    },
    time: {
        type: Number, // Store as a number (timestamp)
        default: () => Math.floor (Date.now () / 1000), // Generate the timestamp
        required: true
    }
});

const storySchema = new mongoose.Schema ({
    id: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    time: {
        type: Number, // Store as a number (timestamp)
        default: () => Math.floor (Date.now () / 1000), // Generate the timestamp
        required: true
    },
    items: [itemSchema]
});

const Story = mongoose.model ('Story', storySchema);

// Function to periodically remove expired items from stories
const removeExpiredItems = async () => {
    try {
        const twelveHoursAgo = new Date (Date.now () - 12 * 60 * 60 * 1000);
        await Story.updateMany ({}, {
            $pull: {
                items: {
                    time: {
                        $lt: Math.floor (twelveHoursAgo.getTime () / 1000)
                    }
                }
            }
        });

        // Find and delete documents with no items left
        await Story.deleteMany ({
            items: {
                $exists: true,
                $eq: []
            }
        });
    } catch (error) {
        console.error ('Error removing expired items:', error);
    }
};


// Call the removeExpiredItems function every minute
setInterval (removeExpiredItems, 60 * 1000);

module.exports = Story;
