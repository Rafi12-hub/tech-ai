import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles } from 'lucide-react';
import { useAnalysis } from '../../lib/AnalysisContext';

const suggestedQuestions = [
  'What is the main objective of this report?',
  'What are the key technical findings?',
  'What risks are identified and how are they mitigated?',
  'Summarize the methodology used.'
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="flex gap-1.5">
        <div className="bouncing-dot" />
        <div className="bouncing-dot" />
        <div className="bouncing-dot" />
      </div>
    </div>
  );
}

export default function ChatTab() {
  const { analysis, currentDoc, chatWithDoc } = useAnalysis();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsThinking(true);

    try {
      const result = await chatWithDoc(question);
      if (result?.answer) {
        setMessages(prev => [...prev, { role: 'assistant', content: result.answer }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your question.' }]);
    }
    setIsThinking(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentDoc) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-dark-card flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400">No document selected</h3>
        <p className="text-sm text-slate-400 mt-1">Upload a document to start asking questions</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex-shrink-0">
        <h2 className="text-2xl font-bold gradient-text">Chat with Document</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Ask questions about {currentDoc.filename}</p>
      </div>

      <div className="flex-1 overflow-y-auto mt-6 space-y-4 px-1 scroll-smooth">
        {messages.length === 0 && !isThinking && (
          <div className="space-y-3 py-8">
            <p className="text-sm text-slate-400 text-center mb-4">Suggested questions to get started:</p>
            {suggestedQuestions.map((q, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setInput(q)}
                className="block w-full glass rounded-xl p-3 text-left text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-card/50 transition-all"
              >
                {q}
              </motion.button>
            ))}
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center flex-shrink-0 mr-3 mt-1">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-accent to-accent-secondary text-white rounded-tr-md'
                    : 'glass text-slate-600 dark:text-slate-400 rounded-tl-md'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isThinking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <TypingIndicator />
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 mt-4 glass rounded-2xl p-2 flex items-center gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about the document..."
          rows={1}
          className="flex-1 px-4 py-2 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none resize-none max-h-32"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isThinking}
          className="p-3 rounded-xl bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
        >
          {isThinking ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
