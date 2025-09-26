'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export const ChatButton = ({ editorRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const captureWhiteboardState = () => {
    if (!editorRef.current) return null;
    
    const editor = editorRef.current;
    
    // Get the shapes and other data
    const shapes = editor.getCurrentPageShapes();
    
    // Get page bindings (connections between shapes) using the correct API
    const currentPageId = editor.getCurrentPageId();
    const page = editor.getPage(currentPageId);
    const bindings = Object.values(page.bindings || {});
    
    return {
      shapes: shapes.map(shape => ({
        id: shape.id,
        type: shape.type,
        props: shape.props,
        x: shape.x,
        y: shape.y
      })),
      bindings,
      pageId: currentPageId
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    try {
      setIsLoading(true);
      
      // Add user message to chat
      const userMessage = { role: 'user', content: inputMessage };
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      
      // Get whiteboard state
      const whiteboardState = captureWhiteboardState();
      
      // Create context for the AI
      const contextWithWhiteboard = `
        User's message: ${inputMessage}
        
        The user is referring to a whiteboard with the following content:
        ${JSON.stringify(whiteboardState, null, 2)}
        
        Please consider the whiteboard content in your response.
      `;
      
      // Get response from Generative AI
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // If there's chat history, include it
      let geminiMessages = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }));
      
      // Add the new message with whiteboard context
      geminiMessages.push({
        role: 'user',
        parts: [{ text: contextWithWhiteboard }]
      });
      
      // Start the chat
      const chat = model.startChat({
        history: geminiMessages.length > 1 ? geminiMessages.slice(0, -1) : [],
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });
      
      // Generate response
      const result = await chat.sendMessage(contextWithWhiteboard);
      const response = await result.response;
      const responseText = response.text();
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    } catch (error) {
      console.error("Error in chat:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I couldn't process your request. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        variant="default"
        className="flex items-center gap-2"
      >
        <MessageSquare size={16} />
        Chat about Whiteboard
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chat about your Whiteboard</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[400px] p-4 border rounded-md">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">
                Start a conversation about your whiteboard content.
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground ml-8' 
                        : 'bg-muted mr-8'
                    }`}
                  >
                    {msg.content}
                  </div>
                ))}
                {isLoading && (
                  <div className="bg-muted p-3 rounded-lg mr-8 animate-pulse">
                    Thinking...
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          
          <div className="flex gap-2 items-center">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about your whiteboard..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleSendMessage();
                }
              }}
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading}
            >
              Send
            </Button>
          </div>
          
          <DialogFooter className="sm:justify-start">
            <p className="text-xs text-muted-foreground">
              Powered by Google Generative AI
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};