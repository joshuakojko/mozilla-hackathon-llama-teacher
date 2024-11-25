import { Chat } from '@/components/chat';

export default function HomePage() {
  return (
    <main className="container py-8">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter">Llama Teacher</h1>
          <p className="text-muted-foreground">
            Your personalized AI learning assistant. Completely local.
          </p>
        </div>
        <Chat />
      </div>
    </main>
  );
}
