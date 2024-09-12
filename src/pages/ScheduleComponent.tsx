'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Calendar } from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import moment from 'moment'
import { Task } from '@/Types/index'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ScheduleComponentProps {
  events: Array<{
    title: string;
    start: string;
    end: string;
  }>;
  hoursPerDay: number;
  startTime: string;
  tasks: Task[];
}

interface CalendarEvent {
  title: string;      // イベントのタイトル
  start: Date | string; // イベントの開始日時
  end?: Date | string;  // イベントの終了日時（オプション）
  allDay?: boolean;     // 終日イベントかどうか（オプション）
  // その他のオプションプロパティ
  color?: string;       // イベントの背景色
  textColor?: string;   // イベントのテキスト色
  // ... 他のカスタムプロパティ
}

export default function ScheduleComponent({ 
  events: initialEvents,
  hoursPerDay: initialHoursPerDay,
  startTime: initialStartTime,
  tasks: initialTasks
}: ScheduleComponentProps) {
  console.log("ScheduleComponent - 受け取ったprops:", { initialEvents, initialHoursPerDay, initialStartTime, initialTasks });

  const [calendar, setCalendar] = useState<Calendar | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [localHoursPerDay, setLocalHoursPerDay] = useState(initialHoursPerDay)
  const [localStartTime, setLocalStartTime] = useState(initialStartTime)
  const [events, setEvents] = useState<any[]>(initialEvents)
  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks)


  const generateSchedule = useCallback((currentTasks: Task[], currentHoursPerDay: number, currentStartTime: string) => {
    console.log("generateSchedule呼び出し:", { currentTasks, currentHoursPerDay, currentStartTime });
  
    if (!Array.isArray(currentTasks)) {
      console.error('Tasks is not an array:', currentTasks)
      return []
    }
  
    const sortedTasks = [...currentTasks].sort((a, b) => (a.order || 0) - (b.order || 0))
    let currentDate = moment().startOf('day')
    const generatedEvents: CalendarEvent[] = []
    let remainingHoursForDay = currentHoursPerDay
  
    for (const task of sortedTasks) {
      let remainingTime = task.estimated_time || 0
      while (remainingTime > 0) {
        const [hours, minutes] = currentStartTime.split(':').map(Number)
        let taskStart = moment(currentDate).set({ hour: hours, minute: minutes })
        
        // 当日の残り時間を考慮
        if (remainingHoursForDay < currentHoursPerDay) {
          taskStart = taskStart.add(currentHoursPerDay - remainingHoursForDay, 'hours')
        }
  
        const availableTime = Math.min(remainingTime, remainingHoursForDay)
        const taskEnd = moment(taskStart).add(availableTime, 'hours')
  
        generatedEvents.push({
          title: task.name || task.taskName || 'Unnamed Task',
          start: taskStart.toDate(),
          end: taskEnd.toDate(),
          extendedProps: {
            description: task.description || '',
            priority: task.taskPriority || 0
          }
        })
  
        remainingTime -= availableTime
        remainingHoursForDay -= availableTime
  
        // 日をまたぐ場合
        if (remainingHoursForDay <= 0) {
          currentDate = currentDate.add(1, 'day')
          remainingHoursForDay = currentHoursPerDay
        }
      }
    }
    console.log("生成されたイベント:", generatedEvents);
    return generatedEvents
  }, [])

  useEffect(() => {
    const calendarEl = document.getElementById('calendar')
    if (calendarEl && events.length > 0) {
      console.log("カレンダー初期化:", { events });
      const newCalendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        initialView: 'timeGridWeek',
        initialDate: new Date(),
        timeZone: 'local',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: events.map(event => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        })),
        slotMinTime: localStartTime,
        slotDuration: '01:00:00',
        allDaySlot: false,
        eventClick: (info) => {
          alert(`タスク: ${info.event.title}\n開始: ${info.event.start}\n終了: ${info.event.end}`)
        }
      })
      newCalendar.render()
      setCalendar(newCalendar)
    }
  
    return () => {
      if (calendar) {
        calendar.destroy()
      }
    }
  }, [events, localStartTime])

  useEffect(() => {
    console.log("localTasks updated:", localTasks);
  }, [localTasks]);
  
  useEffect(() => {
    console.log("localHoursPerDay updated:", localHoursPerDay);
  }, [localHoursPerDay]);
  
  useEffect(() => {
    console.log("localStartTime updated:", localStartTime);
  }, [localStartTime]);

 
  useEffect(() => {
    if (calendar && selectedDate) {
      calendar.gotoDate(selectedDate)
    }
  }, [selectedDate, calendar])

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setSelectedDate(date)
    }
  }

const handleApplySettings = () => {
  if (calendar) {
    calendar.removeAllEvents()
    const newEvents = generateSchedule(localTasks, localHoursPerDay, localStartTime);
    calendar.addEventSource(newEvents)
    console.log("設定が適用されました:", { localHoursPerDay, localStartTime, newEvents });
  }
}

useEffect(() => {
  if (Array.isArray(localTasks) && localTasks.length > 0) {
    const newEvents = generateSchedule(localTasks, localHoursPerDay, localStartTime);
    setEvents(newEvents);
  }
}, [localTasks, localHoursPerDay, localStartTime, generateSchedule]);


  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">スケジュール</h2>
      <div className="flex space-x-4 items-end">
        <div>
          <Label htmlFor="datePicker">日付選択</Label>
          <DatePicker
            id="datePicker"
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="yyyy/MM/dd"
            className="p-2 border rounded"
          />
        </div>
        <div>
          <Label htmlFor="hoursPerDay">1日の作業時間</Label>
          <Input
            id="hoursPerDay"
            type="number"
            value={localHoursPerDay}
            onChange={(e) => setLocalHoursPerDay(Number(e.target.value))}
            min={1}
            max={24}
          />
        </div>
        <div>
          <Label htmlFor="startTime">開始時間</Label>
          <Input
            id="startTime"
            type="time"
            value={localStartTime}
            onChange={(e) => setLocalStartTime(e.target.value)}
          />
        </div>
        <Button onClick={handleApplySettings}>設定を適用</Button>
      </div>
      <div>
      <h2>スケジュール</h2>
      <div id="calendar" style={{ height: '600px' }} />
    </div>
    </div>
  )
}