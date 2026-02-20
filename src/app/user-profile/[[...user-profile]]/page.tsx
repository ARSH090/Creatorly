
import { UserProfile } from "@clerk/nextjs";

export default function UserProfilePage() {
    return (
        <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6">
            <UserProfile path="/user-profile" routing="path" />
        </div>
    );
}
