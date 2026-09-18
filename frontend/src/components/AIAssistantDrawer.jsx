import React, { useState, useEffect } from 'react';
import { Sparkles, Send, Bot, User, ArrowRight } from 'lucide-react';
import { askAIAssistant } from '../services/transitService';

export default function AIAssistantDrawer({ station, currentLocationNode, accessibleMode, onApplyAIRoute }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Namaskar! I am your SmartRail Assistant for ${station?.name || 'Central Railway Mumbai'}. Ask me where any platform, restroom, food stall, or FOB lift is, and I will navigate you.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (station?.name) {
      setMessages([
        {
          role: 'assistant',
          text: `Namaskar! I am your SmartRail Assistant for ${station.name}. Ask me where any platform, restroom, food stall, or FOB lift is, and I will navigate you.`
        }
      ]);
    }
  }, [station?.id]);

  // Dynamic suggestions based on station
  const sampleQueries = station?.id === 1
    ? ['Where is Platform 18 for express trains?', 'Take me to Platform 1 for slow local', 'Where is the ticket counter?', 'Find the nearest restroom']
    : station?.id === 8
    ? ['How do I transfer to Western Line?', 'Where is Platform 4 for Kalyan Fast?', 'Take me to the FOB lift']
    : station?.id === 13
    ? ['How do I reach Metro Line 1?', 'Where is Platform 1 for CSMT Slow?', 'Find the ticket counter']
    : [`Where is Platform 1?`, `Where is Platform ${station?.totalPlatforms || 4}?`, 'Take me to the ticket office', 'Nearest restroom'];

  const handleSend = async (queryText) => {
    const text = queryText || input;
    if (!text.trim()) return;

    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await askAIAssistant(text, currentLocationNode?.id, accessibleMode, station?.id || 1);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: res.reply,
          route: res.route,
          destinationNodeId: res.destinationNodeId
        }
      ]);

      if (res.destinationNodeId && onApplyAIRoute) {
        onApplyAIRoute(res.destinationNodeId, res.route);
      }
    } catch (e) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: `Unable to access station database right now. Please select your platform from the navigation panel.` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '520px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={15} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--text-primary)' }}>Mumbai Rail Assistant</h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{station?.code} Grounded Data</span>
          </div>
        </div>
        <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Grounded AI</span>
      </div>

      {/* Messages List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '0.75rem', paddingRight: '0.25rem' }}>
        {messages.map((m, i) => {
          const isAI = m.role === 'assistant';
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '0.45rem',
                alignSelf: isAI ? 'flex-start' : 'flex-end',
                maxWidth: '92%'
              }}
            >
              {isAI && (
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Bot size={13} color="#0284c7" />
                </div>
              )}

              <div style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: isAI ? '#f1f5f9' : '#0284c7',
                border: isAI ? '1px solid #e2e8f0' : 'none',
                color: isAI ? '#0f172a' : '#ffffff',
                fontSize: '0.8rem',
                lineHeight: '1.45',
                boxShadow: isAI ? '0 1px 2px rgba(0,0,0,0.03)' : '0 2px 6px rgba(2, 132, 199, 0.25)'
              }}>
                {m.text}

                {m.destinationNodeId && (
                  <div style={{ marginTop: '0.45rem', paddingTop: '0.35rem', borderTop: isAI ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.25)', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: isAI ? '#0284c7' : '#ffffff', fontWeight: 700 }}>
                    <ArrowRight size={12} />
                    <span>Path to Platform Highlighted on Map!</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', paddingLeft: '2rem' }}>
            Looking up Central Railway station database...
          </div>
        )}
      </div>

      {/* Suggested Quick Questions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.65rem' }}>
        {sampleQueries.map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(q)}
            style={{
              fontSize: '0.68rem',
              padding: '0.25rem 0.55rem',
              borderRadius: 'var(--radius-full)',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '0.4rem' }}>
        <label htmlFor="ai-assistant-query" className="sr-only">
          Ask Transit AI Assistant
        </label>
        <input
          id="ai-assistant-query"
          name="aiQuery"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask about platforms 1 to ${station?.totalPlatforms || 18}...`}
          aria-label={`Ask about platforms 1 to ${station?.totalPlatforms || 18} or station facilities`}
          style={{
            flex: 1,
            padding: '0.55rem 0.8rem',
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: 'var(--radius-md)',
            color: '#0f172a',
            fontSize: '0.8rem',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}
        />
        <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 0.85rem' }} aria-label="Send message">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
