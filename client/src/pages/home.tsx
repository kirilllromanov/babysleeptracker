import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Child, SleepRecord } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ChildDropdown from "@/components/child-dropdown";
import SleepPredictionDisplay from "@/components/sleep-prediction";
import TimeDisplay from "@/components/time-display";
import { MoonIcon, SunriseIcon } from "@/assets/icons";
import { apiRequest } from "@/lib/queryClient";
import { formatSleepDuration } from "@/lib/dates";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  // Get active sleep session for selected child
  const { data: activeSleep, refetch: refetchActiveSleep } = useQuery<SleepRecord>({
    queryKey: [`/api/children/${selectedChildId}/active-sleep`],
    enabled: !!selectedChildId,
  });

  // Handle sleeping status updates
  const handleStartSleep = () => {
    if (!selectedChildId) {
      toast({
        title: "No child selected",
        description: "Please select a child first",
        variant: "destructive",
      });
      return;
    }
    navigate("/sleep-tracking");
  };

  const handleEndSleep = async () => {
    if (!activeSleep) return;
    
    try {
      // End the sleep session
      await apiRequest("PATCH", `/api/sleep-records/${activeSleep.id}`, {
        endTime: new Date(),
        isActive: false,
      });
      
      // Refresh data
      await refetchActiveSleep();
      queryClient.invalidateQueries({ queryKey: [`/api/children/${selectedChildId}/sleep-records`] });
      
      // Navigate to sleep quality assessment
      navigate(`/sleep-quality?sleepId=${activeSleep.id}`);
    } catch (error) {
      toast({
        title: "Error ending sleep session",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-navy-dark p-4 flex flex-col">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Baby Sleep Tracker</h1>
        <p className="text-lavender-300">Track your baby's sleep patterns</p>
      </header>

      <Card className="mb-6 bg-navy-medium border-navy-light">
        <CardContent className="pt-6">
          <ChildDropdown 
            selectedChildId={selectedChildId} 
            onSelectChild={setSelectedChildId} 
          />
        </CardContent>
      </Card>

      {activeSleep ? (
        <Card className="mb-6 bg-primary/20 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <MoonIcon className="h-12 w-12 text-blue-300 mb-2" />
              <h2 className="text-xl font-semibold mb-1">Currently Sleeping</h2>
              <div className="bg-navy-dark rounded-lg px-4 py-3 mb-4 w-full max-w-xs">
                <p className="text-sm font-medium text-lavender-300 mb-1">Time in bed</p>
                <p className="text-2xl font-bold text-white">
                  {formatSleepDuration(new Date(activeSleep.startTime), null)}
                </p>
              </div>
              <Button 
                variant="default" 
                size="lg" 
                className="w-full"
                onClick={handleEndSleep}
              >
                <SunriseIcon className="h-5 w-5 mr-2" />
                End Sleep
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 mb-6">
          <TimeDisplay childId={selectedChildId} />
          <SleepPredictionDisplay childId={selectedChildId} />
        </div>
      )}

      {!activeSleep && (
        <Button 
          variant="default" 
          size="lg" 
          className="w-full bg-indigo-600 hover:bg-indigo-700"
          onClick={handleStartSleep}
          disabled={!selectedChildId}
        >
          <MoonIcon className="h-5 w-5 mr-2" />
          Start Sleep Tracking
        </Button>
      )}
    </div>
  );
}
