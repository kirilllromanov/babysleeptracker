import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Child } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoonIcon } from "@/assets/icons";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

// Form schema for sleep tracking
const sleepTrackingSchema = z.object({
  childId: z.string().min(1, "Please select a child"),
  startTime: z.string().refine(time => !isNaN(Date.parse(time)), {
    message: "Please enter a valid time",
  }),
  endTimeOption: z.enum(["specific", "stillSleeping"]),
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
  const currentDateTime = format(now, "yyyy-MM-dd'T'HH:mm");

  const form = useForm<SleepTrackingValues>({
    resolver: zodResolver(sleepTrackingSchema),
    defaultValues: {
      childId: "",
      startTime: currentDateTime,
      endTimeOption: "stillSleeping",
      endTime: "",
    },
  });

  const watchEndTimeOption = form.watch("endTimeOption");

  async function onSubmit(values: SleepTrackingValues) {
    try {
      const startTime = new Date(values.startTime);
      startTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      
      const endTime = values.endTimeOption === "specific" && values.endTime 
        ? new Date(values.endTime)
        : undefined;
      
      if (endTime) {
        endTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);
      }
      
      const payload = {
        childId: parseInt(values.childId),
        startTime,
        isActive: values.endTimeOption === "stillSleeping",
        endTime,
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
    form.setValue("startTime", currentDateTime);
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
              
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                          >
                            {field.value ? (
                              format(new Date(field.value), "PPP HH:mm")
                            ) : (
                              <span>Pick a date and time</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <div className="p-3 border-b">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                const currentValue = field.value ? new Date(field.value) : new Date();
                                date.setHours(currentValue.getHours(), currentValue.getMinutes());
                                field.onChange(date.toISOString());
                              }
                            }}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </div>
                        <div className="p-3 border-t">
                          <Input
                            type="time"
                            value={field.value ? format(new Date(field.value), "HH:mm") : ""}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':');
                              const date = field.value ? new Date(field.value) : new Date();
                              date.setHours(parseInt(hours), parseInt(minutes));
                              field.onChange(date.toISOString());
                            }}
                          />
                        </div>
                        <div className="p-3 border-t flex justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNowClick}
                          >
                            Now
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specific End Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
