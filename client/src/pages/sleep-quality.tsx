import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useSearch } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SleepRecord } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StarIcon } from "@/assets/icons";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime, formatSleepDuration } from "@/lib/dates";

// Form schema for sleep quality
const sleepQualitySchema = z.object({
  quality: z.enum(["slept well", "average", "poor sleep", "very poor"], {
    errorMap: () => ({ message: "Please select sleep quality" }),
  }),
});

type SleepQualityValues = z.infer<typeof sleepQualitySchema>;

export default function SleepQuality() {
  const [, navigate] = useLocation();
  const params = useSearch();
  const sleepId = new URLSearchParams(params).get("sleepId");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Load the sleep record to assess
  const { data: sleepRecord, isLoading, error } = useQuery<SleepRecord>({
    queryKey: [`/api/sleep-records/${sleepId}`],
    enabled: !!sleepId,
  });

  const form = useForm<SleepQualityValues>({
    resolver: zodResolver(sleepQualitySchema),
    defaultValues: {
      quality: "slept well",
    },
  });

  // Redirect if no sleepId provided
  useEffect(() => {
    if (!sleepId) {
      toast({
        title: "Error",
        description: "No sleep record specified",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [sleepId, navigate, toast]);

  async function onSubmit(values: SleepQualityValues) {
    if (!sleepId || !sleepRecord) return;
    
    try {
      await apiRequest("PATCH", `/api/sleep-records/${sleepId}`, {
        quality: values.quality,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ 
        queryKey: [`/api/children/${sleepRecord.childId}/sleep-records`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/children/${sleepRecord.childId}/sleep-prediction`] 
      });
      
      toast({
        title: "Sleep quality saved",
        description: "Sleep record has been updated",
      });
      
      // Go back to home
      navigate("/");
    } catch (error) {
      toast({
        title: "Failed to save sleep quality",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-dark p-4 flex flex-col justify-center">
        <Card className="w-full max-w-md mx-auto bg-navy-medium border-navy-light">
          <CardContent className="p-6 flex justify-center">
            <p>Loading sleep record...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !sleepRecord) {
    return (
      <div className="min-h-screen bg-navy-dark p-4 flex flex-col justify-center">
        <Card className="w-full max-w-md mx-auto bg-navy-medium border-navy-light">
          <CardContent className="p-6">
            <p className="text-destructive">Failed to load sleep record</p>
            <Button 
              className="mt-4"
              onClick={() => navigate("/")}
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const startTime = new Date(sleepRecord.startTime);
  const endTime = sleepRecord.endTime ? new Date(sleepRecord.endTime) : null;
  const duration = endTime ? formatSleepDuration(startTime, endTime) : "Unknown";

  return (
    <div className="min-h-screen bg-navy-dark p-4 flex flex-col justify-center">
      <Card className="w-full max-w-md mx-auto bg-navy-medium border-navy-light">
        <CardHeader className="text-center">
          <StarIcon className="h-12 w-12 mx-auto text-amber-300 mb-2" />
          <CardTitle className="text-xl">Sleep Quality Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Start Time:</div>
              <div>{formatDateTime(startTime)}</div>
              
              <div className="text-muted-foreground">End Time:</div>
              <div>{endTime ? formatDateTime(endTime) : "N/A"}</div>
              
              <div className="text-muted-foreground">Duration:</div>
              <div>{duration}</div>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="quality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How was the sleep quality?</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="slept well">Slept Well</SelectItem>
                        <SelectItem value="average">Average</SelectItem>
                        <SelectItem value="poor sleep">Poor Sleep</SelectItem>
                        <SelectItem value="very poor">Very Poor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate("/")}
                >
                  Skip
                </Button>
                <Button type="submit" className="flex-1">
                  Save Quality
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
