import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SunriseIcon, ClockIcon } from "@/assets/icons";
import { formatTimeAgo } from "@/lib/dates";
import { SleepRecord } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface TimeDisplayProps {
  childId: number | null;
}

export default function TimeDisplay({ childId }: TimeDisplayProps) {
  const [timeAwake, setTimeAwake] = useState<string>("");
  
  // Get the most recent sleep record for this child
  const { data: sleepRecords } = useQuery<SleepRecord[]>({
    queryKey: [`/api/children/${childId}/sleep-records`],
    enabled: !!childId,
  });
  
  // Get active sleep record if exists
  const { data: activeSleep } = useQuery<SleepRecord>({
    queryKey: [`/api/children/${childId}/active-sleep`],
    enabled: !!childId,
  });
  
  useEffect(() => {
    if (!childId || !sleepRecords || sleepRecords.length === 0 || activeSleep) {
      return;
    }
    
    // Find the most recent completed sleep record
    const mostRecentSleep = sleepRecords
      .filter(record => record.endTime)
      .sort((a, b) => {
        const dateA = new Date(a.endTime!).getTime();
        const dateB = new Date(b.endTime!).getTime();
        return dateB - dateA;
      })[0];
    
    if (!mostRecentSleep || !mostRecentSleep.endTime) {
      return;
    }
    
    // Update time since wakeup every minute
    const updateTimeAwake = () => {
      const wakeTime = new Date(mostRecentSleep.endTime!);
      setTimeAwake(formatTimeAgo(wakeTime));
    };
    
    updateTimeAwake();
    const interval = setInterval(updateTimeAwake, 60000);
    
    return () => clearInterval(interval);
  }, [childId, sleepRecords, activeSleep]);
  
  // If no child selected or child is currently sleeping, don't show time awake
  if (!childId || activeSleep) {
    return null;
  }
  
  // If no sleep records with end time, don't show time awake
  if (!timeAwake) {
    return null;
  }
  
  return (
    <Card className="bg-accent/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <SunriseIcon className="h-5 w-5 mr-2 text-amber-300" />
          Time Since Wake Up
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-4 w-4 text-amber-300" />
          <span>{timeAwake}</span>
        </div>
      </CardContent>
    </Card>
  );
}
