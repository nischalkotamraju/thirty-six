import { useState } from "react";
import { auth, db } from "../firebase/firebase-config";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "firebase/auth";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";

const Profile = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [password, setPassword] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const user = auth.currentUser;
            if (password.trim()) {
                if (!currentPassword) throw new Error('Please enter your current password');

                if (password.length < 6) {
                    setError("Password must be at least 6 characters long");
                    return;
                }

                if (password.search(/[A-Z]/) < 0) {
                    setError("Password must contain at least one uppercase letter");
                    return;
                }

                if (password.search(/[a-z]/) < 0) {
                    setError("Password must contain at least one lowercase letter");
                    return;
                }

                if (password.search(/[0-9]/) < 0) {
                    setError("Password must contain at least one digit");
                    return;
                }

                if (password.search(/[!@#$%^&*]/) < 0) {
                    setError("Password must contain at least one special character");
                    return;
                }

                const credential = EmailAuthProvider.credential(user.email, currentPassword);
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, password);
            }

            const updates = {};
            if (firstName.trim()) updates.firstName = firstName;
            if (lastName.trim()) updates.lastName = lastName;

            if (Object.keys(updates).length > 0) {
                const userDoc = doc(db, "users", user.uid);
                await updateDoc(userDoc, updates);
            }

            setSuccess("Profile updated successfully");
        } catch (error) {
            setError(error.message);
        }
    };

    const handleDeleteAccount = async () => {
        setError("");
        setSuccess("");

        try {
            const user = auth.currentUser;
            const userDoc = doc(db, "users", user.uid);

            await deleteDoc(userDoc);
            await deleteUser(user);

            setSuccess("Account deleted successfully");
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <main className="bg-neutral-900 min-h-screen text-white flex items-center justify-center">
            <div className="max-w-md w-full px-6 py-8 rounded-2xl shadow-xl">
                <h2 className="text-3xl font-bold text-center mb-4">
                    <span className="text-emerald-500">Update Profile</span>
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-500 text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-500 text-sm">
                        {success}
                    </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full pl-4 pr-4 py-2 bg-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Enter First Name"
                        />
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full pl-4 pr-4 py-2 bg-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Enter Last Name"
                        />
                    </div>

                    <div className="relative">
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full pl-4 pr-4 py-2 bg-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Enter Current Password"
                        />
                    </div>

                    <div className="relative">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-4 pr-4 py-2 bg-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Enter New Password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition"
                    >
                        Update Profile
                    </button>

                    <button
                        type="button"
                        onClick={handleDeleteAccount}
                        className="w-full bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition"
                    >
                        Delete Account
                    </button>
                </form>
            </div>
        </main>
    );
};

export default Profile;
