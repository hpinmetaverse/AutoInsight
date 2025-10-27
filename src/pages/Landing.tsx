import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, Sparkles, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/chat');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  bg-gradient-to-b from-zinc-950 to-zinc-800">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
          
            <span className="text-2xl font-bold">AutoInsight</span>
          </div>
          <Button onClick={() => navigate('/auth')} variant="outline" className=' bg-gradient-to-b from-zinc-700 to-zinc-800'>
            Sign In
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Chat with Advanced
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {' '}AI Models
            </span>
          </h1>
          
          <p className="mb-12 text-xl text-muted-foreground">
            Experience the power of two cutting-edge AI models in one beautiful interface.
            Choose between Anum and Aanum for your perfect conversation.
          </p>

          <div className="mb-16 flex  flex-wrap justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/auth')} className='bg-zinc-700 hover:bg-zinc-800'>
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className='bg-zinc-700 hover:bg-zinc-800'>
              Learn More
            </Button>
          </div>

          <div className="grid gap-8 md:grid-cols-3 ">
            <div className="rounded-lg border border-border  bg-gradient-to-b from-zinc-700 to-zinc-800 p-6">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Dual AI Models</h3>
              <p className="text-muted-foreground">
                Switch between two powerful AI models tailored for different conversation styles
              </p>
            </div>

            <div className="rounded-lg border border-border  bg-gradient-to-b from-zinc-700 to-zinc-800 p-6">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Chat History</h3>
              <p className="text-muted-foreground">
                Access all your conversations anytime with organized chat history
              </p>
            </div>

            <div className="rounded-lg border border-border  bg-gradient-to-b from-zinc-700 to-zinc-800 p-6">
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Real-time Updates</h3>
              <p className="text-muted-foreground">
                Instant responses with smooth, real-time message synchronization
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
