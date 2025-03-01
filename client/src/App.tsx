import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import More from "@/pages/more";
import { Footer } from "@/components/footer";
import { FloatingButton } from "@/components/floating-button";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/more" component={More} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow">
          <Router />
        </main>
        <Footer />
      </div>
      <FloatingButton />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;