import { connectToDatabase } from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        console.log('=== DEBUG REGISTER START ===');
        
        const body = await req.json();
        console.log('Request body:', { ...body, password: '***' });

        // Step 1: Validate fields
        if (!body.email || !body.password || !body.username || !body.displayName) {
            console.log('Missing fields:', { email: !!body.email, password: !!body.password, username: !!body.username, displayName: !!body.displayName });
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log('✓ Fields present');

        // Step 2: Connect to database
        console.log('Connecting to database...');
        const connection = await connectToDatabase();
        console.log('✓ Database connected');

        // Step 3: Check existing user
        console.log('Checking for existing user...');
        const existingUser = await User.findOne({
            $or: [
                { email: body.email.toLowerCase() },
                { username: body.username.toLowerCase() }
            ]
        });

        if (existingUser) {
            console.log('User already exists:', { email: existingUser.email, username: existingUser.username });
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 400 }
            );
        }

        console.log('✓ No existing user found');

        // Step 4: Hash password
        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(body.password, 12);
        console.log('✓ Password hashed');

        // Step 5: Create user
        console.log('Creating user...');
        const newUser = await User.create({
            email: body.email.toLowerCase(),
            password: hashedPassword,
            username: body.username.toLowerCase(),
            displayName: body.displayName,
        });

        console.log('✓ User created successfully:', { id: newUser._id, email: newUser.email, username: newUser.username });

        return NextResponse.json({
            success: true,
            message: 'User created successfully',
            user: {
                id: newUser._id,
                email: newUser.email,
                username: newUser.username,
                displayName: newUser.displayName
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('=== DEBUG REGISTER ERROR ===');
        console.error('Error:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            console.log('Duplicate key error on field:', field);
            return NextResponse.json(
                { error: `This ${field} is already registered` },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { 
                error: 'Failed to create account',
                details: error.message
            },
            { status: 500 }
        );
    }
}
