import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoonIcon, ClockIcon } from "@/assets/icons";
import { SleepPrediction } from "@shared/schema";
import { formatTime, formatTimeUntil } from "@/lib/dates";
import { Skeleton } from "@/components/ui/skeleton";

interface SleepPredictionProps {
  childId: number | null;
}

export default function SleepPredictionDisplay({ childId }: SleepPredictionProps) {
  const queryClient = useQueryClient();
  
  const { data: prediction, isLoading, error, isError } = useQuery<SleepPrediction>({
    queryKey: [`/api/children/${childId}/sleep-prediction`],
    enabled: !!childId,
    refetchInterval: 1000 * 60 * 15, // Refetch every 15 minutes
  });

  // Force refresh prediction if changing children
  useEffect(() => {
    if (childId) {
      queryClient.invalidateQueries({ queryKey: [`/api/children/${childId}/sleep-prediction`] });
    }
  }, [childId, queryClient]);

  if (!childId) {
    return (
      <Card className="bg-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <MoonIcon className="h-5 w-5 mr-2 text-blue-300" />
            Next Sleep Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Select a child to see predictions</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <MoonIcon className="h-5 w-5 mr-2 text-blue-300" />
            Next Sleep Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-1/2 mb-2" />
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/3" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !prediction) {
    return (
      <Card className="bg-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <MoonIcon className="h-5 w-5 mr-2 text-blue-300" />
            Next Sleep Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">
            {error instanceof Error ? error.message : "Failed to load prediction"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const predictedTime = new Date(prediction.predictedTime);
  const timeUntilBed = formatTimeUntil(predictedTime);
  const durationHours = Math.floor(prediction.predictedDuration / 60);
  const durationMinutes = prediction.predictedDuration % 60;
  const durationText = durationHours > 0 
    ? `${durationHours}h ${durationMinutes > 0 ? `${durationMinutes}m` : ''}` 
    : `${durationMinutes}m`;

  return (
    <Card className="bg-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <MoonIcon className="h-5 w-5 mr-2 text-blue-300" />
          Next Sleep Prediction
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-3">
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2 text-lavender-400" />
            <span className="font-medium">Bedtime:</span>
            <span className="ml-2">{formatTime(predictedTime)}</span>
          </div>
          
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2 text-lavender-400" />
            <span className="font-medium">Time until bedtime:</span>
            <span className="ml-2">{timeUntilBed}</span>
          </div>
          
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2 text-lavender-400" />
            <span className="font-medium">Expected duration:</span>
            <span className="ml-2">{durationText}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
