const mongoose = require('mongoose');

const listingCategorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    banner_image: {
        type: String
    },
});

listingCategorySchema.set('timestamps', true);

const bookmarkSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    dateAdded: {
        type: Date,
        default: Date.now()
    },
});


const listingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ListingCategory",
        required: true
    },
    condition: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    media: [
        {
            url: {
                type: String,
                required: true
            },
        },
    ],
});

listingSchema.set('timestamps', true);

const reportSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'listings',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    explanation: {
        type: String,
        required: true
    },
    action: {
        type: String,
        enum: ['pending', 'hide', 'rejected'],
        default: 'pending'
    },
    dateReported: {
        type: Date,
        default: Date.now
    },
    dateActionCarriedOut: {
        type: Date
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admins'
    }
});

const listingNotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'listings'
    },
    action: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isSystemNotification: {
        type: Boolean,
        default: false
    }
});

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    }
});


module.exports = {
    ListingCategory: mongoose.model('ListingCategory', listingCategorySchema),
    Listing: mongoose.model('Listing', listingSchema),
    ListingBookmark: mongoose.model('ListingBookmark', bookmarkSchema),
    ReportListing: mongoose.model('ReportListing', reportSchema),
    ListingNotification: mongoose.model('ListingNotification', listingNotificationSchema),
    MarketplaceMessage: mongoose.model('MarketplaceMessage', messageSchema),
};
