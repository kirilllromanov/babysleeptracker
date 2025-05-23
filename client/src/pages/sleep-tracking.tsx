import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Child } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoonIcon, ClockIcon } from "@/assets/icons";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Form schema for sleep tracking
const sleepTrackingSchema = z.object({
  childId: z.string().min(1, "Please select a child"),
  startDate: z.string().min(1, "Please select a date"),
  startTime: z.string().min(1, "Please select a time"),
  endTimeOption: z.enum(["specific", "stillSleeping"]),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
});

type SleepTrackingValues = z.infer<typeof sleepTrackingSchema>;

export default function SleepTracking() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Load children for the dropdown
  const { data: children, isLoading } = useQuery<Child[]>({
    queryKey: ["/api/children"],
  });
  
  // Get current date and time in local format
  const now = new Date();
  const currentDate = format(now, "yyyy-MM-dd");
  const currentTime = format(now, "HH:mm");

  const form = useForm<SleepTrackingValues>({
    resolver: zodResolver(sleepTrackingSchema),
    defaultValues: {
      childId: "",
      startDate: currentDate,
      startTime: currentTime,
      endTimeOption: "stillSleeping",
      endDate: currentDate,
      endTime: currentTime,
    },
  });

  const watchEndTimeOption = form.watch("endTimeOption");

  async function onSubmit(values: SleepTrackingValues) {
    try {
      // Create start date/time by combining the date and time strings
      const [startYear, startMonth, startDay] = values.startDate.split('-').map(Number);
      const [startHour, startMinute] = values.startTime.split(':').map(Number);
      
      const startDateTime = new Date(startYear, startMonth - 1, startDay, startHour, startMinute, 0);
      
      let endDateTime = null;
      
      if (values.endTimeOption === "specific" && values.endDate && values.endTime) {
        const [endYear, endMonth, endDay] = values.endDate.split('-').map(Number);
        const [endHour, endMinute] = values.endTime.split(':').map(Number);
        
        endDateTime = new Date(endYear, endMonth - 1, endDay, endHour, endMinute, 0);
        
        // Validate end time is after start time
        if (endDateTime <= startDateTime) {
          throw new Error("End time must be after start time");
        }
      }
      
      // Create payload with properly formatted date/times
      const payload = {
        childId: parseInt(values.childId),
        startTime: startDateTime.toISOString(),
        endTime: endDateTime?.toISOString() || null,
        isActive: values.endTimeOption === "stillSleeping",
        quality: null
      };
      
      const response = await apiRequest("POST", "/api/sleep-records", payload);
      const sleepRecord = await response.json();
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ 
        queryKey: [`/api/children/${payload.childId}/sleep-records`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/children/${payload.childId}/active-sleep`] 
      });
      
      toast({
        title: "Sleep tracking started",
        description: values.endTimeOption === "stillSleeping"
          ? "Sleep session is now active"
          : "Sleep session recorded",
      });
      
      // If specific end time was provided, go to quality assessment
      if (values.endTimeOption === "specific" && sleepRecord.id) {
        navigate(`/sleep-quality?sleepId=${sleepRecord.id}`);
      } else {
        // Otherwise go back to home
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "Failed to start sleep tracking",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }

  const handleNowClick = () => {
    const now = new Date();
    form.setValue("startDate", format(now, "yyyy-MM-dd"));
    form.setValue("startTime", format(now, "HH:mm"));
  };

  return (
    <div className="min-h-screen bg-navy-dark p-4 flex flex-col justify-center">
      <Card className="w-full max-w-md mx-auto bg-navy-medium border-navy-light">
        <CardHeader className="text-center">
          <MoonIcon className="h-12 w-12 mx-auto text-blue-300 mb-2" />
          <CardTitle className="text-xl">Sleep Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="childId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Child</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a child" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : children && children.length > 0 ? (
                          children.map(child => (
                            <SelectItem key={child.id} value={child.id.toString()}>
                              {child.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No children added</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-3">
                <FormLabel>Start Time</FormLabel>
                <div className="flex items-center justify-between mb-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleNowClick}
                    className="flex items-center gap-1 ml-auto"
                  >
                    <ClockIcon className="h-3 w-3" />
                    Now
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            type="time" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="endTimeOption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="specific">Specify End Time</SelectItem>
                        <SelectItem value="stillSleeping">Still Sleeping</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {watchEndTimeOption === "specific" && (
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input 
                            type="time" 
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {watchEndTimeOption === "stillSleeping" ? "Start Tracking" : "Save Sleep"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
