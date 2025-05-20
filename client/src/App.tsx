import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AddChild from "@/pages/add-child";
import SleepTracking from "@/pages/sleep-tracking";
import SleepQuality from "@/pages/sleep-quality";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/add-child" component={AddChild} />
      <Route path="/sleep-tracking" component={SleepTracking} />
      <Route path="/sleep-quality" component={SleepQuality} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Always use dark mode for this app
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
