import React, { useState } from "react";
import OpenAI from "openai";
import { db, auth } from "../firebase/firebase-config";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

const AIHelp = () => {
    const [question, setQuestion] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

    if (!apiKey) {
        console.error("API key is missing. Please set REACT_APP_OPENAI_API_KEY in your environment variables.");
    }

    const openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true,
    });

    const handleQuestionSubmit = async () => {
        setLoading(true);
        setError("");
        setResponse("");
        setSuccess("");

        try {
            const chatResponse = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `You are an ACT expert chatbot. You can answer ACT-related questions and also help users add practice test scores to their database. 
                        If a user provides practice test scores in the format "Math: [score], English: [score], Reading: [score], Writing: [score], Overall: [score]", validate the scores and respond with "Scores added successfully!" if valid. 
                        If the scores are invalid, respond with "Invalid scores. Please ensure all scores are between 0 and 36 (Writing: 0-12)."`,
                    },
                    {
                        role: "user",
                        content: question,
                    },
                ],
                max_tokens: 500,
            });

            if (chatResponse && chatResponse.choices && chatResponse.choices.length > 0) {
                const aiResponse = chatResponse.choices[0].message.content.trim();
                setResponse(aiResponse);

                // Check if the AI response indicates valid scores
                if (aiResponse === "Scores added successfully!") {
                    await addPracticeTestToDB(question);
                    setSuccess("Practice test added successfully!");
                } else if (aiResponse.startsWith("Invalid scores")) {
                    setError(aiResponse);
                }
            } else {
                setError("Failed to get a response. Please try again.");
            }
        } catch (err) {
            setError("Failed to fetch response. Please try again.");
            console.error("Error fetching response:", err);
        } finally {
            setLoading(false);
        }
    };

    const addPracticeTestToDB = async (input) => {
        try {
            // Extract scores from the input
            const scores = input.match(/Math: (\d+), English: (\d+), Reading: (\d+), Writing: (\d+), Overall: (\d+)/);
            if (!scores) {
                throw new Error("Invalid input format for practice test scores.");
            }
    
            const [math, english, reading, writing, overall] = scores.slice(1).map(Number);
    
            const user = auth.currentUser;
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const userDoc = await getDoc(userRef);
                const totalPracticeTests = userDoc.data().practiceSessions.totalPracticeSessions || 0;
    
                await updateDoc(userRef, {
                    "practiceSessions.practiceSessionList": arrayUnion({
                        math,
                        english,
                        reading,
                        writing,
                        overall,
                        date: new Date().toISOString(),
                    }),
                    "practiceSessions.totalPracticeSessions": totalPracticeTests + 1,
                });
            }
        } catch (err) {
            console.error("Error adding practice test to DB:", err);
            setError("Failed to add practice test to the database.");
        }
    };
    

    return (
        <div className="bg-neutral-900 min-h-screen text-white flex items-center justify-center">
            <div className="max-w-2xl w-full px-6 py-8 rounded-2xl shadow-xl">
                <h2 className="text-3xl font-bold text-center mb-4">
                    <span className="text-emerald-500">ACT Help Chatbot</span>
                </h2>
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full h-32 p-4 bg-neutral-800 text-white rounded-lg mb-4"
                    placeholder="Ask your ACT-related question here or provide practice test scores..."
                />
                <button
                    onClick={handleQuestionSubmit}
                    className="w-full bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition"
                    disabled={loading}
                >
                    {loading ? "Fetching Response..." : "Submit Question"}
                </button>
                {response && (
                    <div className="mt-4 p-4 bg-neutral-800 text-gray-300 rounded-lg">
                        <h3 className="text-xl font-semibold mb-2">Response:</h3>
                        <p>{response}</p>
                    </div>
                )}
                {success && (
                    <div className="mt-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-500 text-sm">
                        {success}
                    </div>
                )}
                {error && (
                    <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-500 text-sm">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIHelp;