import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, FileText, ThumbsUp, ThumbsDown, BookOpen, AlertTriangle, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ragService, type RAGQueryResponse } from "@/services/aiService";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: RAGQueryResponse["sources"];
  queryId?: string;
  timestamp: Date;
  feedbackGiven?: "up" | "down";
}

const SUGGESTED_QUERIES = [
  "What controls address access management?",
  "How should we handle incident response?",
  "What are the requirements for encryption at rest?",
  "Explain the continuous monitoring requirements",
  "What documentation is needed for system authorization?",
];

export const RAGChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const documentTypes = [
    { value: "policy", label: "Policies", icon: FileText },
    { value: "assessment", label: "Assessments", icon: FileSearch },
    { value: "finding", label: "Findings", icon: AlertTriangle },
    { value: "framework", label: "Frameworks", icon: BookOpen },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await ragService.query({
        query,
        documentTypes: selectedDocTypes.length > 0 ? selectedDocTypes : undefined,
        maxChunks: 5,
        includeSources: true,
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.answer,
        sources: response.sources,
        queryId: response.query_id,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I apologize, but I encountered an error processing your question. Please try again.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, queryId: string, rating: "up" | "down") => {
    try {
      await ragService.submitFeedback(queryId, rating === "up" ? 5 : 1);
      
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, feedbackGiven: rating } : msg
        )
      );

      toast({
        title: "Feedback submitted",
        description: "Thank you for helping us improve!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    }
  };

  const toggleDocType = (type: string) => {
    setSelectedDocTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <Card className="h-[700px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Compliance Knowledge Assistant
            </CardTitle>
            <CardDescription>
              Ask questions about your security policies, assessments, and compliance frameworks
            </CardDescription>
          </div>
        </div>

        {/* Document Type Filters */}
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-sm text-muted-foreground mr-2">Filter by:</span>
          {documentTypes.map(type => (
            <Badge
              key={type.value}
              variant={selectedDocTypes.includes(type.value) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleDocType(type.value)}
            >
              <type.icon className="h-3 w-3 mr-1" />
              {type.label}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        {/* Messages Area */}
        <ScrollArea ref={scrollRef} className="flex-1 px-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">How can I help?</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                I can answer questions about your organization's security policies, 
                assessment findings, and compliance requirements.
              </p>
              <div className="space-y-2 w-full max-w-md">
                <p className="text-sm text-muted-foreground">Try asking:</p>
                {SUGGESTED_QUERIES.map((query, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => handleSubmit(query)}
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] space-y-2 ${message.role === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Sources:</p>
                        {message.sources.map((source, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-background border rounded px-2 py-1"
                          >
                            <span className="font-medium">{source.document_name}</span>
                            <Badge variant="outline" className="ml-2 text-[10px]">
                              {source.document_type}
                            </Badge>
                            <span className="text-muted-foreground ml-2">
                              ({(source.similarity * 100).toFixed(0)}% match)
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Feedback buttons */}
                    {message.role === "assistant" && message.queryId && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Was this helpful?</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 ${message.feedbackGiven === "up" ? "text-green-500" : ""}`}
                          onClick={() => handleFeedback(message.id, message.queryId!, "up")}
                          disabled={!!message.feedbackGiven}
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 ${message.feedbackGiven === "down" ? "text-red-500" : ""}`}
                          onClick={() => handleFeedback(message.id, message.queryId!, "down")}
                          disabled={!!message.feedbackGiven}
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    <p className="text-[10px] text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>

                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSubmit(inputValue);
            }}
            className="flex gap-2"
          >
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Ask about compliance, policies, or findings..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !inputValue.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default RAGChatInterface;
