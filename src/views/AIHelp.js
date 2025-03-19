import React, { useState } from "react";
import OpenAI from "openai";

const AIHelp = () => {
    const [question, setQuestion] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

        try {
            const chatResponse = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: `You are an ACT expert chatbot. You can only answer ACT-related questions. If a user asks a question unrelated to the ACT, respond with "Sorry, I can't assist with that."`,
                    },
                    {
                        role: "user",
                        content: question,
                    },
                ],
                max_tokens: 500,
            });

            if (chatResponse && chatResponse.choices && chatResponse.choices.length > 0) {
                setResponse(chatResponse.choices[0].message.content.trim());
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
                    placeholder="Ask your ACT-related question here..."
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