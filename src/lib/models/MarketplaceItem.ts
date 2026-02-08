import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMarketplaceItem extends Document {
    title: string;
    description: string;
    category: 'template' | 'plugin' | 'theme' | 'tool' | 'course';
    seller: mongoose.Types.ObjectId;
    price: number;
    rating: number;
    reviews: number;
    downloads: number;
    images: string[];
    files: Array<{
        name: string;
        url: string;
        size: number;
    }>;
    tags: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MarketplaceItemSchema: Schema = new Schema({
    title: {
        type: String,
        required: true,
        index: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['template', 'plugin', 'theme', 'tool', 'course'],
        required: true,
        index: true,
    },
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    reviews: {
        type: Number,
        default: 0,
    },
    downloads: {
        type: Number,
        default: 0,
    },
    images: [String],
    files: [
        {
            name: String,
            url: String,
            size: Number,
        },
    ],
    tags: [String],
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

export default (mongoose.models.MarketplaceItem as Model<IMarketplaceItem>) ||
    mongoose.model<IMarketplaceItem>('MarketplaceItem', MarketplaceItemSchema);
