// Client-side chat UI component.
// - Manages WebSocket connection lifecycle (connect, receive, close, error)
// - Renders a simple chat interface with messages, typing indicator, and input box
// - Uses Tailwind CSS utility classes for styling
"use client";
import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

type ChatMessage = {
	role: "user" | "assistant";
	content: string;
	timestamp: Date;
};

export default function ChatInterface() {
	// Local UI state for messages, input field, connection status, and typing indicator
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [isConnected, setIsConnected] = useState(false);
	const [isTyping, setIsTyping] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement | null>(null);
	const wsRef = useRef<WebSocket | null>(null);
	const inputRef = useRef<HTMLTextAreaElement | null>(null);

	useEffect(() => {
		// Establish WebSocket connection to the server
		// Note: Ensure the server (app/chatServer.js) is running locally on the same port
		const ws = new WebSocket("ws://localhost:8080");
		ws.onopen = () => {
			setIsConnected(true);
			console.log("WebSocket connected");
		};
		ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				// Minimal protocol:
				// - { type: "message", content: string } -> append assistant message
				// - { type: "typing" } -> show typing indicator
				if (data.type === "message") {
					setMessages((prev) => [
						...prev,
						{ role: "assistant", content: data.content, timestamp: new Date() },
					]);
					setIsTyping(false);
				} else if (data.type === "typing") {
					setIsTyping(true);
				}
			} catch {
				// ignore non-JSON
			}
		};
		ws.onclose = () => {
			setIsConnected(false);
			console.log("WebSocket disconnected");
		};
		ws.onerror = (error) => {
			console.error("WebSocket error:", error);
		};
		wsRef.current = ws;
		return () => {
			// Cleanly close WebSocket on unmount
			ws.close();
		};
	}, []);

	useEffect(() => {
		// Keep the scroll pinned to the latest message or typing indicator
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isTyping]);

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		// Prevent empty sends and require an active connection
		if (!input.trim() || !isConnected) return;
		// Echo the user message locally
		const userMessage: ChatMessage = { role: "user", content: input, timestamp: new Date() };
		setMessages((prev) => [...prev, userMessage]);
		// Send message to the WS server following the simple protocol
		wsRef.current?.send(JSON.stringify({ type: "message", content: input }));
		setInput("");
		setIsTyping(true);
	}

	return (
		<div className="flex flex-col h-screen bg-white">
			{/* Header with connection status */}
			<div className="border-b border-gray-200 px-4 py-3">
				<div className="flex items-center justify-between max-w-3xl mx-auto">
					<h1 className="text-lg font-semibold text-gray-900">AI Chat</h1>
					<div className="flex items-center gap-2">
						<div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
						<span className="text-sm text-gray-600">{isConnected ? "Connected" : "Disconnected"}</span>
					</div>
				</div>
			</div>
			{/* Message list and typing indicator */}
			<div className="flex-1 overflow-y-auto px-4 py-6">
				<div className="max-w-3xl mx-auto space-y-6">
					{messages.length === 0 && (
						<div className="text-center py-12">
							<p className="text-gray-400 text-lg">Start a conversation</p>
						</div>
					)}
					{messages.map((message, index) => (
						<div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
							<div
								className={`max-w-[80%] rounded-2xl px-4 py-3 ${
									message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
								}`}
							>
								<p className="whitespace-pre-wrap break-words">{message.content}</p>
							</div>
						</div>
					))}
					{isTyping && (
						<div className="flex justify-start">
							<div className="bg-gray-100 rounded-2xl px-4 py-3">
								<div className="flex gap-1">
									<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
									<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
									<div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
								</div>
							</div>
						</div>
					)}
					<div ref={messagesEndRef} />
				</div>
			</div>
			{/* Composer with textarea and submit button */}
			<div className="border-t border-gray-200 px-4 py-4 bg-white">
				<form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
					<div className="flex gap-3 items-end">
						<div className="flex-1 relative">
							<textarea
								ref={inputRef}
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && !e.shiftKey) {
										e.preventDefault();
										// submit
										(e.currentTarget.form as HTMLFormElement | null)?.dispatchEvent(
											new Event("submit", { cancelable: true, bubbles: true })
										);
									}
								}}
								placeholder="Type a message..."
								className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
								rows={1}
								style={{ minHeight: "52px", maxHeight: "200px" }}
								disabled={!isConnected}
							/>
						</div>
						<button
							type="submit"
							disabled={!input.trim() || !isConnected}
							className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
						>
							<Send size={20} />
						</button>
					</div>
					<p className="text-xs text-gray-500 mt-2 text-center">Press Enter to send, Shift + Enter for new line</p>
				</form>
			</div>
		</div>
	);
}


