'use client'

import React, { useEffect, useRef } from 'react';
import { theme } from "@/styles/theme";
import { ChatMessage } from './ChatMessage';

export type ChatMessageType = {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

interface ChatInterfaceProps {
  messages: ChatMessageType[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Chat Messages */}
      <div
        style={{
          flex: 1,
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.md,
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: theme.spacing.xl,
            }}
          >
            <div
              style={{
                textAlign: 'center',
                maxWidth: '80%',
              }}
            >
              <p
                style={{
                  color: theme.colors.text.muted,
                  margin: 0,
                  fontSize: theme.typography.fontSize.base,
                  lineHeight: 1.6,
                }}
              >
                Chat with the AI coach to enhance your session plan!
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

    </div>
  );
};