import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductFile extends Document {
    productId: mongoose.Types.ObjectId;
    fileName: string;
    originalFileName: string;
    fileSize: number; // in bytes
    fileType: string; // mime type
    storagePath: string; // key/path in object storage
    versionNumber: number;
    isCurrentVersion: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProductFileSchema: Schema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    fileName: { type: String, required: true },
    originalFileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileType: { type: String, required: true },
    storagePath: { type: String, required: true },
    versionNumber: { type: Number, default: 1 },
    isCurrentVersion: { type: Boolean, default: true }
}, {
    timestamps: true
});

// Index for getting the current version of a file quickly
ProductFileSchema.index({ productId: 1, isCurrentVersion: 1 });

const ProductFile: Model<IProductFile> = mongoose.models.ProductFile || mongoose.model<IProductFile>('ProductFile', ProductFileSchema);
export { ProductFile };
export default ProductFile;
