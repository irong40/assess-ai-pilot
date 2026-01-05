import { AppLayout } from '@/components/layout/AppLayout';
import RAGChatInterface from '@/components/rag/RAGChatInterface';

export default function KnowledgeAI() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Knowledge AI</h1>
          <p className="text-muted-foreground">
            Ask questions about compliance frameworks, security controls, and RMF processes
          </p>
        </div>
        <RAGChatInterface />
      </div>
    </AppLayout>
  );
}
