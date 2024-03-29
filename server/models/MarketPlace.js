const mongoose = require('mongoose');

const listingCategorySchema = new mongoose.Schema({
    listingType: {
        type: String,
        required: true,
    },
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
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user',
    },
    visibility: {
        type: Boolean,
        default: true
    },
    title: {
        type: String,
        required: true
    },
    listingType: {
        type: String,
        enum: ['itemsForSale', 'jobListing', 'housingAndResources', 'academicAssistance'],
        required: true
    },
    location: {
        type: String,
    },
    jobListing: {
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ListingCategory",
            required: function () {
                return this.listingType === 'jobListing';
            }
        },
        deadline: {
            type: Date,
            required: function () {
                return this.listingType === 'jobListing';
            }
        },
        description: {
            type: String,
            required: function () {
                return this.listingType === 'jobListing';
            }
        },
        link: {
            type: String,
            required: function () {
                return this.listingType === 'jobListing';
            }
        },
        organization: {
            type: String,
            required: function () {
                return this.listingType === 'jobListing';
            }
        },
        media: [
            {
                url: {
                    type: String,
                    required: function () {
                        return this.listingType === 'jobListing';
                    }
                }
            }
        ]
    },
    itemsForSale: {
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ListingCategory",
            required: function () {
                return this.listingType === 'itemsForSale';
            }
        },
        condition: {
            type: String,
            enum: ['new', 'like-new', 'fair', 'good'],
            required: function () {
                return this.listingType === 'itemsForSale';
            }
        },
        description: {
            type: String,
            required: function () {
                return this.listingType === 'itemsForSale';
            }
        },
        price: {
            type: Number,
            required: function () {
                return this.listingType === 'itemsForSale';
            }
        },
        media: [
            {
                url: {
                    type: String,
                    required: function () {
                        return this.listingType === 'itemsForSale';
                    }
                }
            }
        ]
    },
    housingAndResources: {
        description: {
            type: String,
            required: function () {
                return this.listingType === 'housingAndResources';
            }
        },
        category: {
            type: String,
            ref: "ListingCategory",
            required: function () {
                return this.listingType === 'housingAndResources';
            }
        },
        preferences: {
            type: String,
            required: function () {
                return this.listingType === 'housingAndResources';
            }
        },
        media: [
            {
                url: {
                    type: String,
                    required: function () {
                        return this.listingType === 'housingAndResources';
                    }
                }
            }
        ],
        payment: {
            type: String,
            enum: ['free', 'paid'],
            required: function () {
                return this.listingType === 'housingAndResources';
            }
        },
        durationOfStay: {
            type: String,
            required: function () {
                return this.listingType === 'housingAndResources';
            }
        },
        amount: {
            type: Number,
            required: function () {
                return this.payment === 'paid';
            }
        },
        termsAndConditions: {
            type: String,
            required: function () {
                return this.listingType === 'housingAndResources';
            }
        }
    },
    academicAssistance: {
        description: {
            type: String,
            required: function () {
                return this.listingType === 'academicAssistance';
            }
        },
        category: {
            type: String,
            ref: "ListingCategory",
            required: function () {
                return this.listingType === 'academicAssistance';
            }
        },
        media: [
            {
                url: {
                    type: String,
                    required: function () {
                        return this.listingType === 'academicAssistance';
                    }
                }
            }
        ],
        payment: {
            type: String,
            enum: ['free', 'paid'],
            required: function () {
                return this.listingType === 'academicAssistance';
            }
        },
        amount: {
            type: Number,
            required: function () {
                return this.payment === 'paid';
            }
        },
    },

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
    message: {
        type: String,
        required: true,
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
        required: true,
        ref: 'user',
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user',
    },
     
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true
    },
    messages: [
        {
            sender: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'user',
            },
            receiver: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'user',
            },
            content: {
                type: String,
            },
            timeSent: {
                type: Date,
                default: Date.now
            },
            status: {
                type: String,
                enum: ['sent', 'delivered', 'seen'],
                default: 'sent'
            },
            deleted: {
                type: Boolean,
                default: false
            }
        },
    ]
});

const userFollowingSchema = new mongoose.Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    dateFollowed: {
        type: Date,
        default: Date.now
    }
});

const recentActivitySchema = new mongoose.Schema({
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
    dateVisited: {
        type: Date,
        default: Date.now
    }
});

module.exports = {
    ListingUserFollowing: mongoose.model('ListingUserFollowing', userFollowingSchema),
    ListingCategory: mongoose.model('ListingCategory', listingCategorySchema),
    Listing: mongoose.model('Listing', listingSchema),
    ListingBookmark: mongoose.model('ListingBookmark', bookmarkSchema),
    ReportListing: mongoose.model('ReportListing', reportSchema),
    ListingNotification: mongoose.model('ListingNotification', listingNotificationSchema),
    MarketplaceMessage: mongoose.model('MarketplaceMessage', messageSchema),
    MarketplaceRecentActivity: mongoose.model('MarketplaceRecentActivity ', recentActivitySchema),
};
