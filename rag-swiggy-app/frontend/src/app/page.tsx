"use client";

import { useState } from "react";
import { Send, Settings, BookOpen, AlertCircle, Loader2, Mic, MicOff } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  contexts?: string[];
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Settings state
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState("groq");
  const [isProcessing, setIsProcessing] = useState(false);
  const [indexStatus, setIndexStatus] = useState<string | null>(null);

  const handleProcessDocument = async () => {
    setIsProcessing(true);
    setIndexStatus(null);
    try {
      const res = await fetch(`http://${window.location.hostname}:8000/process`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setIndexStatus(data.message);
      } else {
        setIndexStatus("Error: " + data.detail);
      }
    } catch (err) {
      setIndexStatus("Failed to connect to backend server.");
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join("");
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const res = await fetch(`http://${window.location.hostname}:8000/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userMessage,
          api_key: apiKey || null,
          provider: provider,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.answer, contexts: data.context },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.detail}` },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to connect to the backend server. Please ensure it is running." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 text-orange-600 font-bold text-2xl mb-2">
            <BookOpen className="w-8 h-8" />
            AnalyzeX
          </div>
          <p className="text-sm text-gray-500">
            RAG Dashboard for Swiggy Annual Report FY23-24
          </p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-4 h-4" /> Configuration
            </h3>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">LLM Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-orange-500 focus:border-orange-500 bg-white"
              >
                <option value="groq">Groq (Llama 3)</option>
                <option value="openai">OpenAI (GPT-3.5)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">API Key</label>
              <input
                type="password"
                placeholder={`Enter ${provider === 'groq' ? 'Groq' : 'OpenAI'} API Key...`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500">Key is only used for the current session.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Document Processing</h3>
            <p className="text-xs text-gray-600">
              Initialize the vector store for the Swiggy Annual Report. Only needs to be done once.
            </p>
            <button
              onClick={handleProcessDocument}
              disabled={isProcessing}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md shadow flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
              {isProcessing ? "Processing PDF..." : "Build Vector Store"}
            </button>
            {indexStatus && (
              <div className={`text-xs p-3 rounded-md flex items-start gap-2 ${indexStatus.includes('Error') || indexStatus.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{indexStatus}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        <header className="bg-white border-b border-gray-200 p-4 shadow-sm z-10">
          <h1 className="text-lg font-semibold text-gray-800">Ask the Report</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 pb-32">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4 shadow-inner">
                <BookOpen className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Welcome to AnalyzeX</h2>
              <p className="text-gray-500">
                Ask me anything about the Swiggy Annual Report FY23-24. I answer strictly based on the document context to prevent hallucinations.
              </p>
              <div className="grid grid-cols-1 gap-2 w-full mt-6">
                {[
                  "What was Swiggy's Total Income in FY24?",
                  "When did Swiggy launch its Food Delivery service?",
                  "By what percentage did total orders grow in Food Delivery?"
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="p-3 text-sm text-left border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors bg-white shadow-sm"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex max-w-3xl mx-auto w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`p-4 rounded-xl shadow-sm max-w-[85%] ${msg.role === "user"
                  ? "bg-orange-600 text-white rounded-tr-none"
                  : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
                  }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                  {msg.contexts && msg.contexts.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <details className="group">
                        <summary className="text-xs font-medium text-gray-500 cursor-pointer hover:text-orange-600 flex items-center gap-1">
                          View Retrieved Context ({msg.contexts.length} sources)
                        </summary>
                        <div className="mt-2 space-y-2">
                          {msg.contexts.map((ctx, idx) => (
                            <div key={idx} className="bg-gray-50 p-2 rounded text-xs text-gray-600 border border-gray-100 italic">
                              <span className="font-semibold text-gray-700 not-italic block mb-1">Source {idx + 1}</span>
                              "{ctx}"
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex max-w-3xl mx-auto w-full justify-start">
              <div className="p-4 rounded-xl shadow-sm bg-white border border-gray-200 text-gray-800 rounded-tl-none flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
                <span className="text-sm text-gray-500">Searching document and generating answer...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the report..."
              className="w-full p-4 pr-14 rounded-full border border-gray-300 shadow-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-gray-800 disabled:opacity-50"
              disabled={isLoading}
            />
            <div className="absolute right-2 flex items-center gap-2">
              <button
                type="button"
                onClick={isListening ? undefined : startListening}
                className={`p-2 rounded-full transition-colors ${isListening
                  ? "bg-red-100 text-red-600 animate-pulse"
                  : "text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                  }`}
                title="Use Microphone"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
          <p className="text-center text-xs text-gray-400 mt-2">
            AI can make mistakes. All answers are strictly fetched from the Swiggy Annual Report FY23-24.
          </p>
        </div>
      </main>
    </div>
  );
}
