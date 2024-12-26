import { useState } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a PDF file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsLoading(true);
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert(response.data.message);
      setIsLoading(false);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload and process the file.");
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message) {
      alert("Please enter a message.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post("http://localhost:5000/query", { message });
      const reply = response.data.reply;

      setChatHistory((prev) => [...prev, { user: message, bot: reply }]);
      setMessage("");
      setIsLoading(false);
    } catch (error) {
      console.error("Error querying chatbot:", error);
      alert("Failed to get a response.");
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>LangChain Chatbot</h1>
      
      <div className="upload-section">
        <h2>Upload PDF</h2>
        <form onSubmit={handleFileUpload}>
          <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
          <button type="submit">Upload</button>
        </form>
      </div>

      <div className="chat-section">
        <h2>Chat</h2>
        <div className="chat-history">
          {chatHistory.map((entry, index) => (
            <div key={index} className="chat-entry">
              <p><strong>User:</strong> {entry.user}</p>
              <p><strong>Bot:</strong> {entry.bot}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Type your question..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
