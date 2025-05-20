import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Child } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/assets/icons";
import { useLocation } from "wouter";

interface ChildDropdownProps {
  selectedChildId: number | null;
  onSelectChild: (childId: number) => void;
}

export default function ChildDropdown({ selectedChildId, onSelectChild }: ChildDropdownProps) {
  const [, navigate] = useLocation();
  const { data: children, isLoading, error } = useQuery<Child[]>({
    queryKey: ["/api/children"],
  });

  // Auto-select first child when data loads if no child is selected
  useEffect(() => {
    if (children && children.length > 0 && !selectedChildId) {
      onSelectChild(children[0].id);
    }
  }, [children, selectedChildId, onSelectChild]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-between w-full">
        <div className="h-10 bg-muted animate-pulse rounded-md w-40"></div>
        <Button size="sm" variant="outline" disabled className="ml-2">
          <PlusIcon className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-between w-full">
        <div className="text-sm text-destructive">Failed to load children</div>
        <Button size="sm" variant="outline" onClick={() => navigate("/add-child")}>
          <PlusIcon className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
    );
  }

  // If no children, show just the add button
  if (!children || children.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 w-full">
        <p className="text-muted-foreground mb-4">No children added yet</p>
        <Button onClick={() => navigate("/add-child")}>
          <PlusIcon className="h-4 w-4 mr-2" /> Add Your First Child
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full">
      <Select
        value={selectedChildId?.toString() || ""}
        onValueChange={(value) => onSelectChild(parseInt(value))}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select a child" />
        </SelectTrigger>
        <SelectContent>
          {children.map((child) => (
            <SelectItem key={child.id} value={child.id.toString()}>
              {child.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" onClick={() => navigate("/add-child")}>
        <PlusIcon className="h-4 w-4 mr-1" /> Add
      </Button>
    </div>
  );
}
