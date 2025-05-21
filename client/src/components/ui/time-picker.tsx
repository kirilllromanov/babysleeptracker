
import { ClockIcon } from "lucide-react";
import { Button } from "./button";

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
}

export function TimePicker({ date, setDate }: TimePickerProps) {
  const minuteOptions = [...Array(60)].map((_, i) => {
    return i.toString().padStart(2, "0");
  });

  const hourOptions = [...Array(24)].map((_, i) => {
    return i.toString().padStart(2, "0");
  });

  return (
    <div className="flex gap-2 p-4">
      <select
        value={date.getHours().toString().padStart(2, "0")}
        onChange={(e) => {
          const newDate = new Date(date);
          newDate.setHours(parseInt(e.target.value));
          setDate(newDate);
        }}
        className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm"
      >
        {hourOptions.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>
      <span className="text-sm py-1">:</span>
      <select
        value={date.getMinutes().toString().padStart(2, "0")}
        onChange={(e) => {
          const newDate = new Date(date);
          newDate.setMinutes(parseInt(e.target.value));
          setDate(newDate);
        }}
        className="w-16 rounded-md border border-input bg-background px-2 py-1 text-sm"
      >
        {minuteOptions.map((minute) => (
          <option key={minute} value={minute}>
            {minute}
          </option>
        ))}
      </select>
    </div>
  );
}
