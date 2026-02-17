import { getMongoUser } from "./get-user";

/**
 * Retrieves the currently authenticated user from Clerk/MongoDB.
 * Intended for use in Server Components and Server Actions.
 */
export async function getCurrentUser() {
    return await getMongoUser();
}

/**
 * Helper to check if current user is admin
 */
export async function isCurrentUserAdmin() {
    const user = await getCurrentUser();
    return user && (user.role === 'admin' || user.role === 'super-admin');
}
