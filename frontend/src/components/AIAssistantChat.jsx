import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { askAICopilot } from '../services/transitService';

export default function AIAssistantChat({ onTriggerAction }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your SmartRail Travel Copilot. How can I help you navigate stations, check live train telemetry, or find accessible routes today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const samplePrompts = [
    'How do I reach Platform 4 with a wheelchair?',
    'Are there any delays right now?',
    'How much is a business class ticket?',
    'Where are the ticket vending machines?'
  ];

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { role: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await askAICopilot(query);
      const aiMsg = {
        role: 'assistant',
        text: response.reply,
        action: response.action
      };
      setMessages(prev => [...prev, aiMsg]);

      if (response.action && onTriggerAction) {
        onTriggerAction(response.action);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'I encountered an issue connecting to the railway telemetry server. Please verify your connection.' }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '620px', overflow: 'hidden' }}>
      {/* Copilot Header */}
      <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-violet), var(--accent-cyan))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Transit AI Copilot</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Context-Aware Transit & Accessibility Assistant
            </span>
          </div>
        </div>

        <span className="badge badge-cyan">Online</span>
      </div>

      {/* Message History */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((m, idx) => {
          const isAI = m.role === 'assistant';
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                gap: '0.75rem',
                alignSelf: isAI ? 'flex-start' : 'flex-end',
                maxWidth: '85%'
              }}
            >
              {isAI && (
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Bot size={16} color="var(--accent-cyan)" />
                </div>
              )}

              <div
                style={{
                  padding: '0.9rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: isAI ? 'rgba(30, 41, 59, 0.8)' : 'linear-gradient(135deg, var(--accent-cyan), #0284c7)',
                  border: isAI ? '1px solid var(--border-glass)' : 'none',
                  color: isAI ? 'var(--text-primary)' : '#ffffff',
                  fontSize: '0.885rem',
                  lineHeight: '1.5'
                }}
              >
                {m.text}

                {m.action && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                    <ArrowRight size={14} />
                    <span>Action dispatched: {m.action.type}</span>
                  </div>
                )}
              </div>

              {!isAI && (
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <User size={16} color="#ffffff" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} color="var(--accent-cyan)" />
            </div>
            <div style={{ padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(30, 41, 59, 0.6)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Copilot is checking live rail data...
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div style={{ padding: '0.5rem 1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', borderTop: '1px solid var(--border-glass)', background: 'rgba(15, 23, 42, 0.4)' }}>
        {samplePrompts.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(prompt)}
            style={{
              whiteSpace: 'nowrap',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-secondary)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '0.75rem', background: 'rgba(15, 23, 42, 0.8)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about trains, platform directions, accessibility, or fares..."
          style={{
            flex: 1,
            padding: '0.75rem 1.25rem',
            background: 'rgba(11, 17, 32, 0.8)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem'
          }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.25rem' }}
          aria-label="Send query to AI copilot"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
