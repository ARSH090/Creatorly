import mongoose from 'mongoose';
import { Project, IProject } from '@/lib/models/Project';
import { Task, ITask } from '@/lib/models/Task';
import { Order } from '@/lib/models/Order';
import { Product } from '@/lib/models/Product';
import crypto from 'crypto';

export class ProjectService {
    /**
     * Create a project manually
     */
    static async createProject(data: {
        creatorId: string;
        name: string;
        description?: string;
        clientId?: string;
        dueDate?: Date;
    }): Promise<IProject> {
        return await Project.create({
            ...data,
            status: 'Active',
            isArchived: false
        });
    }

    /**
     * Automatically create a project from an order
     */
    static async createProjectFromOrder(orderId: string): Promise<IProject | null> {
        const order = await Order.findById(orderId).populate('items.productId');
        if (!order) return null;

        // Find service/course product that triggers project creation
        const productItem = order.items.find(item => {
            const prod = item.productId as any;
            return prod?.autoCreateProject === true;
        });

        if (!productItem) return null;
        const product = productItem.productId as any;

        // Create the project
        const project = await Project.create({
            creatorId: order.creatorId,
            clientId: order.userId,
            orderId: order._id,
            name: `${product.title} - ${order.customerName || order.customerEmail}`,
            description: `Auto-generated from order ${order.orderNumber}`,
            status: 'Active'
        });

        // Instantiate tasks from template if available
        if (product.projectTemplate?.tasks?.length > 0) {
            const taskPromises = product.projectTemplate.tasks.map((t: any, index: number) => {
                return Task.create({
                    projectId: project._id,
                    title: t.title,
                    description: t.description,
                    priority: t.priority || 'Medium',
                    status: 'To Do',
                    order: index
                });
            });
            await Promise.all(taskPromises);
        }

        return project;
    }

    /**
     * Add a task to a project
     */
    static async addTask(projectId: string, taskData: Partial<ITask>): Promise<ITask> {
        // Calculate next order
        const lastTask = await Task.findOne({ projectId }).sort({ order: -1 });
        const order = lastTask ? lastTask.order + 1 : 0;

        return await Task.create({
            ...taskData,
            projectId,
            order
        });
    }

    /**
     * Archive or Unarchive a project
     */
    static async setArchived(projectId: string, isArchived: boolean): Promise<IProject | null> {
        return await Project.findByIdAndUpdate(
            projectId,
            { isArchived },
            { new: true }
        );
    }

    /**
     * Generate or rotate client access token
     */
    static async generateClientToken(projectId: string, expiryDays: number = 30): Promise<string> {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiryDays);

        await Project.findByIdAndUpdate(projectId, {
            clientViewEnabled: true,
            $push: {
                accessTokens: { token, expiresAt }
            }
        });

        return token;
    }

    /**
     * Validate client token
     */
    static async validateToken(token: string): Promise<IProject | null> {
        return await Project.findOne({
            'accessTokens.token': token,
            'accessTokens.expiresAt': { $gt: new Date() },
            clientViewEnabled: true
        });
    }
}
